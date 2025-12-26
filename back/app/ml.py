from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Tuple
import numpy as np
import pandas as pd


feature_names = ['VI.1', 'VI.2', 'VI.3', 'VI.4', 'VI.5', 'VI.6', 'VI.7', 'VI.8', 'VI.9', 'VI.10', 'VI.11', 'VI.12', 'VI.13', 'VI.14', 'VI.15', 'VI.16', 'VI.17', 'VI.18', 'VI.19', 'VI.20', 'VI.21', 'VI.22', 'VI.23', 'VI.24', 'VI.25', 'VI.26', 'VI.27', 'VI.28', 'VI.29', 'VI.30', 'VI.31', 'VI.32', 'VI.33', 'VI.34', 'VI.35', 'VI.36', 'VI.37', 'VI.38', 'VI.39', 'VI.40', 'VI.41', 'VI.42', 'VI.43']


@dataclass(frozen=True)
class InferenceResult:
    preds: np.ndarray          # (N,)
    lonlat_pred: np.ndarray    # (N, 3) -> lon, lat, pred
    meta: Dict[str, Any]




def Nc_wheat(dm_t_ha: np.ndarray | float, a: float = 5.35, b: float = 0.442) -> np.ndarray:
    """
    Critical N concentration for wheat:
    Nc(%) = a * DM^{-b}, DM in t/ha (dry matter).
    """
    dm_t_ha = np.asarray(dm_t_ha, dtype=float)
    return a * (dm_t_ha ** (-b))

def compute_nni(oof_pnc: np.ndarray, dm_t_ha: float | np.ndarray) -> np.ndarray:
    """
    Given OOF predicted PNC (%N) and DM (t/ha), compute NNI = PNC / Nc(DM).
    dm_t_ha can be scalar or array-like:
      - scalar -> same Nc for all samples
      - array of shape (n_samples,) -> per-sample Nc
    """
    nc = Nc_wheat(dm_t_ha)
    return oof_pnc / nc

def infer_pnc_from_gee_grid(
    X_gee: np.ndarray,
    model: Any,
    *,
    dtype: np.dtype = np.float32
) -> InferenceResult:
    """
    """

    if not isinstance(X_gee, np.ndarray):
        X_gee = np.asarray(X_gee)

    if X_gee.ndim != 2:
        raise ValueError(f"X_gee must be 2D array, got shape={X_gee.shape}")

    n_rows, n_cols = X_gee.shape

    # ожидаем [lon, lat, 43 индекса] = 45
    if n_cols < 45:
        raise ValueError(f"Expected at least 45 columns (lon,lat + 43 VI), got {n_cols}")
    lon = X_gee[:, 0].astype(dtype, copy=False)
    lat = X_gee[:, 1].astype(dtype, copy=False)
    X_feat = X_gee[:, 2:45].astype(dtype, copy=False)  # ровно 43 фичи

    if X_feat.shape[1] != 43:
        raise RuntimeError(f"Internal error: feature slice has {X_feat.shape[1]} columns, expected 43")

    nan_mask = ~np.isfinite(X_feat)
    nan_count = int(nan_mask.sum())
    print(nan_count)

    train_means = joblib.load("./app/agropipe/feature_means.joblib")
    X_feat = pd.DataFrame(X_feat, columns=feature_names)
    X_feat.fillna(train_means)

    # predict
    preds = model.predict(X_feat)
    preds = np.asarray(preds).reshape(-1).astype(dtype, copy=False)

    if preds.shape[0] != n_rows:
        raise RuntimeError(f"Model returned {preds.shape[0]} preds, expected {n_rows}")

    lonlat_pred = np.column_stack([lon, lat, preds]).astype(dtype, copy=False)

    meta = {
        "n": n_rows,
        "features_used": 43,
        "nan_count": nan_count,
        "input_shape": (n_rows, n_cols),
        "feature_slice": "X[:, 2:45]",
    }

    nni_preds = compute_nni(preds, 18.16)
    return InferenceResult(preds=nni_preds, lonlat_pred=lonlat_pred, meta=meta)

if __name__ == '__main__':
    import joblib

    from satellite.geo_engine import gee_vi43_grid_features

    cat_loaded = joblib.load("./app/agropipe/ridge_pnc_pipeline.joblib")

    coords = [
        [37.61556, 55.75222],
        [37.61800, 55.75280],
        [37.62010, 55.75110],
        [37.61720, 55.75050],
        [37.61556, 55.75222],
    ]

    X, names = gee_vi43_grid_features(
        coords,
        project_id="harvestai-482321",
        date_start="2024-8-10",
        date_end="2024-9-29",
        cell_size_m=20,
        max_cloud_pct=20,
        rededge_band="B5",
        composite="median",
    )

    res = infer_pnc_from_gee_grid(X, cat_loaded)

    print(res.preds.shape)          # (N,)
    print(res.preds[:5])          # (N,)
    print(res.lonlat_pred[:5])      # lon, lat, pred
    print(res.meta)
