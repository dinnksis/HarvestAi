import numpy as np
from typing import List, Dict, Any
import json
import importlib.util
from pathlib import Path

def calculate_ndvi(red_band: List[float], nir_band: List[float]) -> List[float]:
    """Calculate NDVI from red and NIR bands"""
    red = np.array(red_band)
    nir = np.array(nir_band)
    ndvi = (nir - red) / (nir + red + 1e-10)
    return ndvi.tolist()


def generate_fertilizer_map(field_boundary: Dict[str, Any]) -> List[Dict[str, float]]:
    """
    Generate fertilizer recommendation map based on field boundary
    Works now - will be replaced with actual ML model later
    """
    #extract coordinates from GeoJSON
    coordinates = field_boundary.get('coordinates', [])
    
    if not coordinates:
        # default rectangle if no coordinates provided
        min_lat, min_lon = 55.1558, 37.3176 
        max_lat, max_lon = 55.1658, 37.3276
    else:
        # flatten and find bounds
        flat_coords = [item for sublist in coordinates for item in sublist]
        lats = [coord[1] for coord in flat_coords]
        lons = [coord[0] for coord in flat_coords]
        min_lat, max_lat = min(lats), max(lats)
        min_lon, max_lon = min(lons), max(lons)
    
    # generate HIGH DETAIL grid of points
    grid_size = 30  # 900 точек для детализации
    fertilizer_data = []
    
    # calculate field center for gradient
    center_lat = (min_lat + max_lat) / 2
    center_lon = (min_lon + max_lon) / 2
    
    for i in range(grid_size):
        for j in range(grid_size):
            # coordinates
            lat = min_lat + (max_lat - min_lat) * i / grid_size
            lon = min_lon + (max_lon - min_lon) * j / grid_size
            
            # calculate distance from center for gradient effect
            lat_distance = abs(lat - center_lat) / (max_lat - min_lat) if (max_lat - min_lat) > 0 else 0
            lon_distance = abs(lon - center_lon) / (max_lon - min_lon) if (max_lon - min_lon) > 0 else 0
            distance = np.sqrt(lat_distance**2 + lon_distance**2)
            
            #smooth NDVI gradient (low at edges, high in center)
            base_ndvi = 0.7 - distance * 0.4
            ndvi_value = max(0.1, min(0.9, base_ndvi + np.random.normal(0, 0.03)))
            
            #convert NDVI to fertilizer (inverse relationship)
            if ndvi_value < 0.3:
                fertilizer = 75 + np.random.normal(0, 3)
            elif ndvi_value < 0.5:
                fertilizer = 55 + np.random.normal(0, 3)
            elif ndvi_value < 0.7:
                fertilizer = 35 + np.random.normal(0, 3)
            else:
                fertilizer = 15 + np.random.normal(0, 3)
            
            #clamp to 0-100 range
            fertilizer = max(0, min(100, fertilizer))
            
            fertilizer_data.append({
                "x": round(lon, 6),
                "y": round(lat, 6),
                "value": round(fertilizer, 1),  
                "ndvi": round(ndvi_value, 3)
            })
    
    return fertilizer_data


class FertilizerModel:
    """Fertilizer recommendation model"""
    
    def __init__(self, use_real_model: bool = False):
        """
        Initialize the model
        
        Args:
            use_real_model: Whether to use real ML model (False for demo)
        """
        self.model_name = "Fertilizer Recommendation System"
        self.use_real_model = use_real_model
        self.real_model = None
        
        if use_real_model:
            self._try_load_real_model()
    
    def _try_load_real_model(self):
        """Попытаться загрузить реальную ML модель"""
        try:
            #импорт real_model если существует
            spec = importlib.util.find_spec("real_model")
            if spec is not None:
                real_model_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(real_model_module)
                
                if hasattr(real_model_module, 'RealFertilizerModel'):
                    self.real_model = real_model_module.RealFertilizerModel()
                    print(f"✅ Реальная ML модель загружена")
                    print(f"   Модель: {type(self.real_model).__name__}")
                else:
                    print("⚠️ real_model.py найден, но нет класса RealFertilizerModel")
            else:
                print("ℹ️ real_model.py не найден, используется демо-режим")
                
        except Exception as e:
            print(f"❌ Ошибка загрузки real_model: {e}")
            print("   Используется демо-режим")
    
    def predict(self, field_data: Dict[str, Any]) -> List[Dict[str, float]]:
        """
        Main prediction method
        
        Args:
            field_data: Field data containing 'boundary' (GeoJSON)
        
        Returns:
            List of points with fertilizer recommendations
        """
       
        if self.real_model is not None and hasattr(self.real_model, 'predict'):
            try:
                print("🔧 Используется реальная ML модель")
                return self.real_model.predict(field_data)
            except Exception as e:
                print(f"⚠️ Ошибка в реальной модели: {e}")
                print("   Используется демо-генерация")
        
        #используем демо-генерацию если нет реальной модели
        boundary = field_data.get('boundary', {})
        return generate_fertilizer_map(boundary)
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        info = {
            "model_name": self.model_name,
            "mode": "demo" if self.real_model is None else "real_model",
            "description": "Fertilizer recommendation system",
            "grid_size": 30,
            "total_points_per_field": 900,
            "status": "active"
        }
        
        if self.real_model is not None:
            info.update({
                "real_model_class": type(self.real_model).__name__,
                "has_predict": hasattr(self.real_model, 'predict')
            })
        
        return info


def get_fertilizer_recommendations(field_boundary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get fertilizer recommendations for a field
    
    Args:
        field_boundary: Field boundaries in GeoJSON format
    
    Returns:
        Complete response with recommendations
    """
    
    use_real_model = False  #по умолчанию демо
    
   
    import os
    if os.getenv("USE_REAL_MODEL", "").lower() == "true":
        use_real_model = True
    
    model = FertilizerModel(use_real_model=use_real_model)
    predictions = model.predict({"boundary": field_boundary})
    
    #статистика
    values = [p["value"] for p in predictions if p["value"] is not None]
    stats = {
        "average": round(sum(values) / len(values), 1) if values else 0,
        "min": round(min(values), 1) if values else 0,
        "max": round(max(values), 1) if values else 0,
        "total_points": len(predictions)
    }
    
    #распределение по зонам
    zones = {
        "low": len([v for v in values if v <= 20]),
        "medium": len([v for v in values if 20 < v <= 40]),
        "high": len([v for v in values if 40 < v <= 60]),
        "very_high": len([v for v in values if v > 60])
    }
    
    if values:
        total = len(values)
        zone_percentages = {k: round(v/total*100, 1) for k, v in zones.items()}
    else:
        zone_percentages = {k: 0 for k in zones.keys()}
    
    return {
        "success": True,
        "fertilizer_map": predictions,
        "total_points": len(predictions),
        "model_info": model.get_info(),
        "statistics": stats,
        "zone_distribution": zone_percentages,
        "recommendation": "Используйте цветовую карту для определения зон с разной потребностью в удобрениях"
    }
