from __future__ import annotations

from typing import List, Tuple
import numpy as np
import ee


VI43_NAMES = [
    "BNDVI", "CI-GREEN", "CI-RED", "CI-REG", "CVI", "DVI", "DVI-GREEN", "DVI-REG",
    "EVI", "EVI2", "GARI", "GNDVI", "GOSAVI", "GRVI", "LCI", "MCARI", "MCARI1",
    "MCARI2", "MNLI", "MSR", "MSR-REG", "MTCI", "NDRE", "NDREI", "NAVI", "NDVI", "OSAVI",
    "OSAVI-REG", "RDVI", "RDVI-REG", "RGBVI", "RTVI-CORE", "RVI", "SAVI", "SAVI-GREEN",
    "S-CCCI", "SIPI", "SR-REG", "TCARI", "TCARI/OSAVI", "TVI", "VARI", "WDRVI",
]


def gee_init(project_id: str) -> None:
    """Инициализация GEE. Токен должен быть уже сохранён через earthengine authenticate."""
    ee.Initialize(project=project_id)


def _mask_s2_sr_clouds(img: ee.Image) -> ee.Image:
    """
    Маска по SCL (Sentinel-2 SR).
    Убираем: тени, облака, перистые, снег/лёд.
    """
    scl = img.select("SCL")
    mask = (
        scl.neq(3)   # cloud shadow
        .And(scl.neq(8))   # medium prob cloud
        .And(scl.neq(9))   # high prob cloud
        .And(scl.neq(10))  # cirrus
        .And(scl.neq(11))  # snow/ice
    )
    return img.updateMask(mask)


def _safe_div(num: ee.Image, den: ee.Image, eps: float) -> ee.Image:
    return num.divide(den.add(eps))


def _vi43_image_from_s2(
    field: ee.Geometry,
    date_start: str,
    date_end: str,
    max_cloud_pct: float,
    rededge_band: str,
    composite: str,
    eps: float,
) -> ee.Image:
    """
    Возвращает ee.Image с 43 бэндами VI (float).
    """
    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(field)
        .filterDate(date_start, date_end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud_pct))
        .map(_mask_s2_sr_clouds)
    )

    composite = composite.lower().strip()
    if composite == "median":
        base = s2.median()
    elif composite in ("least_cloudy_mosaic", "least-cloudy-mosaic", "least_cloudy"):
        base = s2.sort("CLOUDY_PIXEL_PERCENTAGE").mosaic()
    else:
        raise ValueError(f"Unknown composite={composite}. Use 'median' or 'least_cloudy_mosaic'.")

    base = base.clip(field)

    # Sentinel-2 SR scale factor: /10000
    BLUE = base.select("B2").divide(10000)
    GREEN = base.select("B3").divide(10000)
    RED = base.select("B4").divide(10000)
    NIR = base.select("B8").divide(10000)
    REDEDGE = base.select(rededge_band).divide(10000)

    # ---- VI.1..VI.43 ----
    VI1 = _safe_div(NIR.subtract(BLUE), NIR.add(BLUE), eps)  # BNDVI

    VI2 = _safe_div(NIR, GREEN, eps).subtract(1)             # CI-GREEN
    VI3 = _safe_div(NIR, RED, eps).subtract(1)               # CI-RED
    VI4 = _safe_div(NIR, REDEDGE, eps).subtract(1)           # CI-REG

    VI5 = _safe_div(NIR, GREEN, eps).multiply(_safe_div(RED, GREEN, eps))  # CVI

    VI6 = NIR.subtract(RED)                                  # DVI
    VI7 = NIR.subtract(GREEN)                                # DVI-GREEN
    VI8 = NIR.subtract(REDEDGE)                              # DVI-REG

    VI9 = _safe_div(NIR.subtract(RED).multiply(2.5), ee.Image(1).add(NIR).subtract(RED.multiply(2.4)), eps)  # EVI (как у тебя)
    VI10 = _safe_div(NIR.subtract(RED).multiply(2.5), NIR.add(RED.multiply(2.4)).add(1), eps)                # EVI2

    tmp = GREEN.subtract(BLUE.subtract(RED).multiply(1.7))
    VI11 = _safe_div(NIR.subtract(tmp), NIR.add(tmp), eps)    # GARI

    VI12 = _safe_div(NIR.subtract(GREEN), NIR.add(GREEN), eps)              # GNDVI
    VI13 = _safe_div(NIR.subtract(GREEN), NIR.add(GREEN).add(0.16), eps)    # GOSAVI
    VI14 = _safe_div(GREEN.subtract(RED), GREEN.add(RED), eps)              # GRVI

    VI15 = _safe_div(NIR.subtract(REDEDGE), NIR.subtract(RED), eps)         # LCI

    VI16 = (REDEDGE.subtract(RED).subtract(REDEDGE.subtract(GREEN).multiply(0.2))).multiply(_safe_div(REDEDGE, RED, eps))  # MCARI

    VI17 = (NIR.subtract(RED).multiply(2.5).subtract(NIR.subtract(GREEN).multiply(1.3))).multiply(1.2)       # MCARI1

    # MCARI2 denom: sqrt( (2NIR+1)^2 - 6*(NIR - 5*sqrt(RED)) - 0.5 )
    sqrtRED = RED.max(0).sqrt()
    denom_inside = (NIR.multiply(2).add(1)).pow(2).subtract(NIR.subtract(sqrtRED.multiply(5)).multiply(6)).subtract(0.5)
    denom_inside = denom_inside.max(0)  # чтобы sqrt не падал
    denom = denom_inside.sqrt().add(eps)
    VI18 = (NIR.subtract(RED).multiply(3.75).subtract(NIR.subtract(GREEN).multiply(1.95))).divide(denom)     # MCARI2

    VI19 = _safe_div(NIR.pow(2).multiply(1.5).subtract(GREEN.multiply(1.5)), NIR.pow(2).add(RED).add(0.5), eps)  # MNLI

    r = _safe_div(NIR, RED, eps)
    VI20 = r.subtract(1).divide(r.add(1).sqrt().add(eps))     # MSR

    rr = _safe_div(NIR, REDEDGE, eps)
    VI21 = rr.subtract(1).divide(rr.add(1).sqrt().add(eps))   # MSR-REG

    VI22 = _safe_div(NIR.subtract(REDEDGE), NIR.subtract(RED), eps)         # MTCI
    VI23 = _safe_div(NIR.subtract(REDEDGE), NIR.add(REDEDGE), eps)          # NDRE
    VI24 = _safe_div(REDEDGE.subtract(GREEN), REDEDGE.add(GREEN), eps)      # NDREI
    VI25 = ee.Image(1).subtract(_safe_div(RED, NIR, eps))                   # NAVI
    VI26 = _safe_div(NIR.subtract(RED), NIR.add(RED), eps)                  # NDVI
    VI27 = _safe_div(NIR.subtract(RED), NIR.add(RED).add(0.16), eps).multiply(1.6)  # OSAVI

    VI28 = _safe_div(NIR.subtract(REDEDGE), NIR.add(REDEDGE).add(0.16), eps).multiply(1.6)  # OSAVI-REG

    VI29 = NIR.subtract(RED).divide(NIR.add(RED).max(0).sqrt().add(eps))                # RDVI
    VI30 = NIR.subtract(REDEDGE).divide(NIR.add(REDEDGE).max(0).sqrt().add(eps))        # RDVI-REG

    VI31 = _safe_div(GREEN.pow(2).subtract(BLUE.multiply(RED)), GREEN.pow(2).add(BLUE.multiply(RED)), eps)    # RGBVI
    VI32 = NIR.subtract(REDEDGE).multiply(100).subtract(NIR.subtract(GREEN).multiply(10))                      # RTVI-CORE
    VI33 = _safe_div(NIR, RED, eps)                                                                            # RVI

    VI34 = _safe_div(NIR.subtract(RED), NIR.add(RED).add(0.5), eps).multiply(1.5)                              # SAVI
    VI35 = _safe_div(NIR.subtract(GREEN), NIR.add(GREEN).add(0.5), eps).multiply(1.5)                          # SAVI-GREEN

    VI36 = _safe_div(VI23, VI26, eps)                                                                          # S-CCCI
    VI37 = _safe_div(NIR.subtract(BLUE), NIR.subtract(RED), eps)                                               # SIPI
    VI38 = _safe_div(NIR, REDEDGE, eps)                                                                        # SR-REG

    VI39 = (REDEDGE.subtract(RED).subtract(REDEDGE.subtract(GREEN).multiply(0.2).multiply(_safe_div(REDEDGE, RED, eps)))).multiply(3)  # TCARI
    VI40 = _safe_div(VI39, VI27, eps)                                                                           # TCARI/OSAVI

    VI41 = (NIR.subtract(GREEN).multiply(120).subtract(RED.subtract(GREEN).multiply(200))).divide(2)            # TVI
    VI42 = _safe_div(GREEN.subtract(RED), GREEN.add(RED).subtract(BLUE), eps)                                   # VARI
    VI43 = _safe_div(NIR.multiply(0.2).subtract(RED), NIR.multiply(0.2).add(RED), eps)                          # WDRVI

    vi_img = ee.Image.cat([
        VI1.rename("BNDVI"),
        VI2.rename("CI-GREEN"),
        VI3.rename("CI-RED"),
        VI4.rename("CI-REG"),
        VI5.rename("CVI"),
        VI6.rename("DVI"),
        VI7.rename("DVI-GREEN"),
        VI8.rename("DVI-REG"),
        VI9.rename("EVI"),
        VI10.rename("EVI2"),
        VI11.rename("GARI"),
        VI12.rename("GNDVI"),
        VI13.rename("GOSAVI"),
        VI14.rename("GRVI"),
        VI15.rename("LCI"),
        VI16.rename("MCARI"),
        VI17.rename("MCARI1"),
        VI18.rename("MCARI2"),
        VI19.rename("MNLI"),
        VI20.rename("MSR"),
        VI21.rename("MSR-REG"),
        VI22.rename("MTCI"),
        VI23.rename("NDRE"),
        VI24.rename("NDREI"),
        VI25.rename("NAVI"),
        VI26.rename("NDVI"),
        VI27.rename("OSAVI"),
        VI28.rename("OSAVI-REG"),
        VI29.rename("RDVI"),
        VI30.rename("RDVI-REG"),
        VI31.rename("RGBVI"),
        VI32.rename("RTVI-CORE"),
        VI33.rename("RVI"),
        VI34.rename("SAVI"),
        VI35.rename("SAVI-GREEN"),
        VI36.rename("S-CCCI"),
        VI37.rename("SIPI"),
        VI38.rename("SR-REG"),
        VI39.rename("TCARI"),
        VI40.rename("TCARI/OSAVI"),
        VI41.rename("TVI"),
        VI42.rename("VARI"),
        VI43.rename("WDRVI"),
    ]).toFloat()

    return vi_img


def gee_vi43_grid_features(
    coords_lonlat: List[List[float]],
    *,
    project_id: str,
    date_start: str,
    date_end: str,
    cell_size_m: int = 20,
    max_cloud_pct: float = 20,
    rededge_band: str = "B5",   # B5/B6/B7
    composite: str = "median",  # "median" / "least_cloudy_mosaic"
    eps: float = 1e-10,
) -> Tuple[np.ndarray, List[str]]:
    """
    Принимает полигон (список [lon, lat], замкнутый) и возвращает numpy массив:

      X shape: (N, 45)  -> [lon, lat, 43 индексов]
      names: ["lon","lat"] + VI43_NAMES

    N = количество ячеек сетки, покрывающих поле.
    """
    gee_init(project_id)

    # Полигон
    field = ee.Geometry.Polygon([coords_lonlat])

    # 43-band VI image
    vi_img = _vi43_image_from_s2(
        field=field,
        date_start=date_start,
        date_end=date_end,
        max_cloud_pct=max_cloud_pct,
        rededge_band=rededge_band,
        composite=composite,
        eps=eps,
    )

    # Проекция/масштаб для грида: берём проекцию Sentinel-2 и задаём размер клетки в метрах
    proj = vi_img.select("NDVI").projection().atScale(cell_size_m)

    # Генерируем grid поверх поля и редуцируем средние значения VI по каждой клетке
    grid = field.coveringGrid(proj)

    reduced = vi_img.reduceRegions(
        collection=grid,
        reducer=ee.Reducer.mean(),
        scale=cell_size_m,
        crs=proj
    )

    # Добавим lon/lat центроида клетки в свойства (геометрию наружу не тащим — быстрее)
    def add_lonlat(f: ee.Feature) -> ee.Feature:
        c = f.geometry().centroid(1).coordinates()
        return f.set({"lon": c.get(0), "lat": c.get(1)})

    reduced = reduced.map(add_lonlat)

    # Снимем в один запрос: toList по всем колонкам сразу
    props = ["lon", "lat"] + VI43_NAMES
    table_dict = reduced.reduceColumns(
        reducer=ee.Reducer.toList(len(props)),
        selectors=props
    )
    payload = table_dict.getInfo()  # один сетевой ответ
    rows = payload.get("list", [])

    # rows: List[List[float]]; приводим в numpy
    X = np.asarray(rows, dtype=np.float32)  # (N, 45)
    return X, props


# test
if __name__ == "__main__":
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
        date_start="2025-8-20",
        date_end="2025-9-11",
        cell_size_m=20,
        max_cloud_pct=20,
        rededge_band="B5",
        composite="median",
    )

    print(X.shape)    # (N, 45)
    print(names[:5])  # ['lon','lat','BNDVI','CI-GREEN','CI-RED',...]
