from __future__ import annotations

from typing import List, Literal

import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.satellite.geo_engine import gee_vi43_grid_features
from app.ml import infer_pnc_from_gee_grid  # <-- ИМПОРТ ТВОЕЙ ФУНКЦИИ


# Модель грузим один раз
#cat_loaded = joblib.load("./app/agropipe/catboost_pnc_pipeline.joblib")
ridge_loaded = joblib.load("./app/agropipe/ridge_pnc_pipeline.joblib")

router = APIRouter(prefix="/pnc", tags=["pnc"])


class PNCRequest(BaseModel):
    coords: List[List[float]] = Field(
        ...,
        description="Полигон как список [lon, lat], замкнутый (последняя точка = первая).",
        min_length=4,
    )

    project_id: str = "harvestai-482321"
    date_start: str = "2024-08-10"
    date_end: str = "2024-09-29"
    cell_size_m: int = 2
    max_cloud_pct: int = 40
    rededge_band: Literal["B5", "B6", "B7"] = "B5"
    composite: Literal["median", "least_cloudy_mosaic"] = "median"



def _validate_polygon(coords: List[List[float]]) -> None:
    if len(coords) < 3:
        print('coords must contain at least 3 points')
        raise HTTPException(status_code=400, detail="coords must contain at least 3 points")
    for i, p in enumerate(coords):
        if not isinstance(p, (list, tuple)) or len(p) != 2:
            print('coords[{i}] must be [lon, lat]')
            raise HTTPException(status_code=400, detail=f"coords[{i}] must be [lon, lat]")
        lon, lat = float(p[0]), float(p[1])
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            print('coords[{i}] has invalid lon/lat: {p}')
            raise HTTPException(status_code=400, detail=f"coords[{i}] has invalid lon/lat: {p}")


@router.post("/predict")
def predict_pnc(req: PNCRequest):
    _validate_polygon(req.coords)
    coords = req.coords + [req.coords[0]]

    try:
        X, _names = gee_vi43_grid_features(
            coords,
            project_id=req.project_id,
            date_start=req.date_start,
            date_end=req.date_end,
            cell_size_m=req.cell_size_m,
            max_cloud_pct=req.max_cloud_pct,
            rededge_band=req.rededge_band,
            composite=req.composite,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GEE failed: {e}")

    try:
        res = infer_pnc_from_gee_grid(X, ridge_loaded)
        # res.lonlat_pred: (N,3) => [lon, lat, pred]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    lon = res.lonlat_pred[:, 0].tolist()
    lat = res.lonlat_pred[:, 1].tolist()
    pred = res.lonlat_pred[:, 2].tolist()

    return {
        "lon": lon,
        "lat": lat,
        "pred": pred,
        "meta": res.meta,
    }