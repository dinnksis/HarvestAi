
import ee
import geemap
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import Polygon, Point
from datetime import datetime, timedelta

# Инициализация
try:
    ee.Initialize()
except:
    ee.Authenticate()
    ee.Initialize()

def create_field_polygon(coordinates_list):
    """
    Создает полигон из списка координат
    
    Параметры:
    coordinates_list: list of [lon, lat] или list of tuples [(lon1, lat1), (lon2, lat2), ...]
    Должны быть в правильном порядке (по или против часовой стрелки)
    """
    
    # Проверяем, что полигон замкнут (первая и последняя точки совпадают)
    if coordinates_list[0] != coordinates_list[-1]:
        coordinates_list.append(coordinates_list[0])
    
    # Создаем полигон в Earth Engine
    polygon = ee.Geometry.Polygon(coordinates_list)
    
    return polygon

def get_agro_indices_for_polygon(polygon_coords, start_date='2023-06-01', end_date='2023-09-30', 
                                 cloud_cover_max=20, scale=10):
    """
    Получение агроиндексов для полигона произвольной формы
    
    Параметры:
    polygon_coords: список координат [[lon1, lat1], [lon2, lat2], ...]
    start_date: начальная дата
    end_date: конечная дата
    cloud_cover_max: максимальный процент облачности
    scale: разрешение в метрах
    """
    
    # Создаем полигон
    polygon = create_field_polygon(polygon_coords)
    
    # Функция для расчета индексов
    def calculate_all_indices(image):
        # Основные спектральные каналы Sentinel-2
        B2 = image.select('B2')  # Blue
        B3 = image.select('B3')  # Green
        B4 = image.select('B4')  # Red
        B8 = image.select('B8')  # NIR
        B11 = image.select('B11')  # SWIR
        B12 = image.select('B12')  # SWIR
        
        # 1. NDVI - индекс растительности
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        # 2. EVI - улучшенный индекс растительности
        evi = image.expression(
            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
            {
                'NIR': B8,
                'RED': B4,
                'BLUE': B2
            }
        ).rename('EVI')
        
        # 3. GNDVI - зеленый NDVI
        gndvi = image.normalizedDifference(['B8', 'B3']).rename('GNDVI')
        
        # 4. NDWI - водный индекс
        ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI')
        
        # 5. NDMI - индекс влажности
        ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI')
        
        # 6. SAVI - индекс с поправкой на почву
        savi = image.expression(
            '((NIR - RED) / (NIR + RED + 0.5)) * 1.5',
            {
                'NIR': B8,
                'RED': B4
            }
        ).rename('SAVI')
        
        # 7. MSAVI - модифицированный SAVI
        msavi = image.expression(
            '(2 * NIR + 1 - sqrt((2 * NIR + 1)**2 - 8 * (NIR - RED))) / 2',
            {
                'NIR': B8,
                'RED': B4
            }
        ).rename('MSAVI')
        
        # 8. LAI - индекс листовой поверхности (упрощенный)
        lai = image.expression(
            '3.618 * EVI - 0.118',
            {
                'EVI': evi
            }
        ).rename('LAI')
        
        # 9. CCCI - индекс хлорофилла
        ccci = image.expression(
            '((NIR - RE) / (NIR + RE)) / ((NIR - RED) / (NIR + RED))',
            {
                'NIR': B8,
                'RED': B4,
                'RE': B5 if 'B5' in image.bandNames().getInfo() else B8  # Red Edge
            }
        ).rename('CCCI')
        
        # 10. OSAVI - оптимизированный SAVI
        osavi = image.expression(
            '(1 + 0.16) * (NIR - RED) / (NIR + RED + 0.16)',
            {
                'NIR': B8,
                'RED': B4
            }
        ).rename('OSAVI')
        
        # Собираем все индексы
        indices = ee.Image.cat([ndvi, evi, gndvi, ndwi, ndmi, savi, msavi, lai, ccci, osavi])
        
        return indices
    
    # Загружаем Sentinel-2 данные
    collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(polygon) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloud_cover_max))
    
    # Рассчитываем индексы для каждого изображения
    indices_collection = collection.map(calculate_all_indices)
    
    # Функция для извлечения статистики
    def extract_stats(image):
        # Получаем дату
        date = image.date().format('YYYY-MM-dd')
        
        # Рассчитываем статистику для каждого индекса
        stats = image.reduceRegion(
            reducer=ee.Reducer.mean() \
                .combine(ee.Reducer.min(), sharedInputs=True) \
                .combine(ee.Reducer.max(), sharedInputs=True) \
                .combine(ee.Reducer.stdDev(), sharedInputs=True) \
                .combine(ee.Reducer.percentile([25, 50, 75]), sharedInputs=True),
            geometry=polygon,
            scale=scale,
            maxPixels=1e9
        )
        
        # Создаем словарь результатов
        result_dict = {'date': date}
        
        # Добавляем статистику по каждому индексу
        indices_names = ['NDVI', 'EVI', 'GNDVI', 'NDWI', 'NDMI', 'SAVI', 'MSAVI', 'LAI', 'CCCI', 'OSAVI']
        
        for idx in indices_names:
            result_dict[f'{idx}_mean'] = stats.get(f'{idx}_mean')
            result_dict[f'{idx}_min'] = stats.get(f'{idx}_min')
            result_dict[f'{idx}_max'] = stats.get(f'{idx}_max')
            result_dict[f'{idx}_std'] = stats.get(f'{idx}_stdDev')
            result_dict[f'{idx}_p25'] = stats.get(f'{idx}_p25')
            result_dict[f'{idx}_p50'] = stats.get(f'{idx}_p50')
            result_dict[f'{idx}_p75'] = stats.get(f'{idx}_p75')
        
        return ee.Feature(None, result_dict)
    
    # Создаем временной ряд
    time_series = indices_collection.map(extract_stats)
    
    # Получаем данные
    features = time_series.getInfo()['features']
    
    # Конвертируем в DataFrame
    data = []
    for feature in features:
        props = feature['properties']
        data.append(props)
    
    df = pd.DataFrame(data)
    
    if not df.empty:
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
    
    # Рассчитываем зональную статистику (гистограмму распределения)
    def get_histogram_data(image):
        # Используем последнее изображение для гистограммы
        histogram = image.reduceRegion(
            reducer=ee.Reducer.histogram(255),
            geometry=polygon,
            scale=scale,
            maxPixels=1e9
        )
        return histogram
    
    # Получаем последнее изображение для анализа распределения
    if indices_collection.size().getInfo() > 0:
        latest_image = indices_collection.sort('system:time_start', False).first()
        histogram_data = get_histogram_data(latest_image).getInfo()
    else:
        histogram_data = None
    
    # Площадь поля в гектарах
    area_ha = polygon.area().divide(10000).getInfo()
    
    # Центроид поля
    centroid = polygon.centroid().getInfo()['coordinates']
    
    return {
        'dataframe': df,
        'polygon': polygon.getInfo(),
        'area_ha': area_ha,
        'centroid': centroid,
        'histogram_data': histogram_data,
        'num_images': indices_collection.size().getInfo()
    }