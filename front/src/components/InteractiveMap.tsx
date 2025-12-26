import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, RefreshCw, Info, Search, Layers } from 'lucide-react';
import { toast } from 'sonner';

type IndexType = 'ndvi' | 'ndvi-avg' | 'ndre' | 'pri';

interface Position {
  lat: number;
  lng: number;
}

interface FieldZone {
  id: string;
  center: Position;
  ndvi: number;
  ndre: number;
  pri: number;
  area: number;
  health: string;
  nitrogenRate: number;
  phosphorusRate: number;
  potassiumRate: number;
  recommendation: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
  boundary?: Position[] | [number, number][];
}

interface InteractiveMapProps {
  field: Field;
}

function calculateFertilizerRecommendation(ndvi: number): {
  nitrogenRate: number;
  phosphorusRate: number;
  potassiumRate: number;
  recommendation: string;
} {
  if (ndvi >= 0.8) {
    return {
      nitrogenRate: 40,
      phosphorusRate: 30,
      potassiumRate: 25,
      recommendation: 'Низкая норма',
    };
  } else if (ndvi >= 0.6) {
    return {
      nitrogenRate: 70,
      phosphorusRate: 45,
      potassiumRate: 35,
      recommendation: 'Средняя норма',
    };
  } else if (ndvi >= 0.4) {
    return {
      nitrogenRate: 100,
      phosphorusRate: 60,
      potassiumRate: 50,
      recommendation: 'Высокая норма',
    };
  } else {
    return {
      nitrogenRate: 130,
      phosphorusRate: 75,
      potassiumRate: 65,
      recommendation: 'Очень высокая норма',
    };
  }
}

function getIndexColor(value: number, indexType: IndexType): string {
  if (indexType === 'ndvi' || indexType === 'ndvi-avg') {
    if (value >= 0.8) return '#289f34';
    if (value >= 0.6) return '#66d771';
    if (value >= 0.4) return '#eeff06';
    if (value >= 0.2) return '#f1b650';
    return '#f23939';
  }
  if (value >= 0.6) return '#289f34';
  if (value >= 0.4) return '#66d771';
  if (value >= 0.25) return '#eeff06';
  if (value >= 0.15) return '#f1b650';
  return '#f23939';
}

function getFertilizerColor(nitrogenRate: number): string {
  if (nitrogenRate >= 120) return '#ff6b6b';
  if (nitrogenRate >= 90) return '#ffa500';
  if (nitrogenRate >= 60) return '#ffd700';
  return '#90ee90';
}

function normalizeBoundary(boundary: Position[] | [number, number][] | undefined): Position[] {
  if (!boundary) return [];
  
  if (Array.isArray(boundary[0]) && Array.isArray(boundary[0])) {
    return (boundary as [number, number][]).map(coord => ({
      lat: coord[0],
      lng: coord[1]
    }));
  }
  return boundary as Position[];
}

function createSquarePolygon(center: Position): Position[] {
  const size = 0.00018;
  return [
    { lat: center.lat - size/2, lng: center.lng - size/2 },
    { lat: center.lat - size/2, lng: center.lng + size/2 },
    { lat: center.lat + size/2, lng: center.lng + size/2 },
    { lat: center.lat + size/2, lng: center.lng - size/2 },
  ];
}

function generateFieldZones(fieldBoundary: Position[]): FieldZone[] {
  if (!fieldBoundary || fieldBoundary.length < 3) return [];

  const zones: FieldZone[] = [];
  const healthStates = [
    'Отличное состояние',
    'Хорошее состояние',
    'Умеренное состояние',
    'Слабое состояние',
  ];

  const minLat = Math.min(...fieldBoundary.map(p => p.lat));
  const maxLat = Math.max(...fieldBoundary.map(p => p.lat));
  const minLng = Math.min(...fieldBoundary.map(p => p.lng));
  const maxLng = Math.max(...fieldBoundary.map(p => p.lng));

  const squareSize = 0.00018;
  const rows = Math.ceil((maxLat - minLat) / squareSize);
  const cols = Math.ceil((maxLng - minLng) / squareSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const center: Position = {
        lat: minLat + (row * squareSize) + squareSize/2,
        lng: minLng + (col * squareSize) + squareSize/2,
      };

      const baseNdvi = Math.random() * 0.7 + 0.2;
      const ndvi = Math.min(0.95, Math.max(0.15, baseNdvi));
      const fertilizerRec = calculateFertilizerRecommendation(ndvi);
      
      zones.push({
        id: `zone-${row}-${col}`,
        center,
        ndvi,
        ndre: ndvi * 0.85,
        pri: ndvi * 0.75,
        area: 0.0004,
        health: healthStates[Math.min(Math.floor(ndvi / 0.25), 3)],
        ...fertilizerRec,
      });
    }
  }

  return zones;
}

export default function InteractiveMap({ field }: InteractiveMapProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<IndexType>('ndvi');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [showVegetation, setShowVegetation] = useState(true);
  const [showFertilizer, setShowFertilizer] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  const [selectedZone, setSelectedZone] = useState<FieldZone | null>(null);
  const [fieldZones, setFieldZones] = useState<FieldZone[]>([]);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polygonsLayer = useRef<L.LayerGroup | null>(null);

  const normalizedBoundary = normalizeBoundary(field.boundary);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: [55.7558, 37.6173],
      zoom: 15,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    polygonsLayer.current = L.layerGroup().addTo(map);

    if (normalizedBoundary.length >= 3) {
      const latLngs = normalizedBoundary.map(pos => [pos.lat, pos.lng] as [number, number]);
      L.polygon(latLngs, {
        color: '#66d771',
        weight: 3,
        fillColor: '#2b8d35',
        fillOpacity: 0.1,
        opacity: 0.8,
      }).addTo(map);
    }

    mapInstance.current = map;

    if (normalizedBoundary.length >= 3) {
      const zones = generateFieldZones(normalizedBoundary);
      setFieldZones(zones);
      toast.success(`Загружено квадратов: ${zones.length}`);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [field.id]);

  // Рендеринг квадратов
  useEffect(() => {
    if (!mapInstance.current || !polygonsLayer.current) return;

    polygonsLayer.current.clearLayers();

    if (showCulture || (!showVegetation && !showFertilizer)) return;

    fieldZones.forEach(zone => {
      const squareCorners = createSquarePolygon(zone.center);
      const latLngs = squareCorners.map(pos => [pos.lat, pos.lng] as [number, number]);

      let fillColor: string;
      let popupContent: string;

      if (showFertilizer) {
        fillColor = getFertilizerColor(zone.nitrogenRate);
        popupContent = `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0;">Квадрат ${zone.id}</h4>
            <div><strong>Удобрения (кг/га):</strong></div>
            <div>Азот (N): ${zone.nitrogenRate}</div>
            <div>Фосфор (P): ${zone.phosphorusRate}</div>
            <div>Калий (K): ${zone.potassiumRate}</div>
            <div>Рекомендация: ${zone.recommendation}</div>
          </div>
        `;
      } else {
        const value = getIndexValue(zone);
        fillColor = getIndexColor(value, selectedIndex);
        popupContent = `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0;">Квадрат ${zone.id}</h4>
            <div><strong>${getIndexName(selectedIndex)}: ${value.toFixed(2)}</strong></div>
            <div>Состояние: ${zone.health}</div>
            <div>NDVI: ${zone.ndvi.toFixed(2)}</div>
            <div>NDRE: ${zone.ndre.toFixed(2)}</div>
            <div>PRI: ${zone.pri.toFixed(2)}</div>
          </div>
        `;
      }

      const polygon = L.polygon(latLngs, {
        color: '#000',
        weight: 1,
        fillColor: fillColor,
        fillOpacity: 0.7,
        opacity: 0.5,
      }).addTo(polygonsLayer.current!);

      polygon.bindPopup(popupContent);
      polygon.on('click', () => setSelectedZone(zone));
    });
  }, [fieldZones, showVegetation, showFertilizer, showCulture, selectedIndex]);

  const handleUpdateData = () => {
    setIsUpdating(true);
    setTimeout(() => {
      if (normalizedBoundary.length >= 3) {
        const zones = generateFieldZones(normalizedBoundary);
        setFieldZones(zones);
        toast.success(`Данные обновлены. Квадратов: ${zones.length}`);
      }
      setIsUpdating(false);
    }, 1500);
  };

  const getIndexValue = (zone: FieldZone): number => {
    switch (selectedIndex) {
      case 'ndvi':
      case 'ndvi-avg':
        return zone.ndvi;
      case 'ndre':
        return zone.ndre;
      case 'pri':
        return zone.pri;
      default:
        return zone.ndvi;
    }
  };

  const calculateAverageIndex = () => {
    if (fieldZones.length === 0) return '0.00';
    const sum = fieldZones.reduce((acc, zone) => acc + getIndexValue(zone), 0);
    return (sum / fieldZones.length).toFixed(2);
  };

  const getIndexName = (index: IndexType): string => {
    switch (index) {
      case 'ndvi':
        return 'NDVI';
      case 'ndvi-avg':
        return 'Средний NDVI';
      case 'ndre':
        return 'NDRE';
      case 'pri':
        return 'PRI';
      default:
        return 'NDVI';
    }
  };

  const handleExportData = () => {
    toast.success('Данные экспортированы');
  };

  return (
    <div className="relative h-full w-full bg-[#131613]">
      {/* 1. КОНТЕЙНЕР КАРТЫ - ЗАНИМАЕТ ВСЁ ПРОСТРАНСТВО */}
      <div 
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        style={{ 
          height: '100%', 
          width: '100%',
        }}
      />

      {/* 2. ОСНОВНОЙ КОНТЕЙНЕР UI - поверх карты */}
      <div className="relative z-10 h-full w-full">
        
        {/* 3. ВЕРХНИЙ БАР - ПАНЕЛЬ "СЛОИ КАРТЫ" И ДРУГИЕ ЭЛЕМЕНТЫ */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
          
          {/* ЛЕВАЯ ЧАСТЬ - Слои карты */}
          <div className="flex items-start space-x-4">
            {/* Панель "Слои карты" */}
            <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[240px]">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#2b8d35]/10 transition-colors"
                  onClick={() => setLayerMenuOpen(!layerMenuOpen)}
                >
                  <Layers className="size-5 text-[#66d771]" />
                  <p className="text-[#66d771] text-lg font-medium">Слои карты</p>
                </div>

                {layerMenuOpen && (
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setShowCulture(!showCulture);
                        if (!showCulture) {
                          setShowVegetation(false);
                          setShowFertilizer(false);
                        }
                      }}
                      className={`px-4 py-2 text-left text-sm transition-colors ${
                        showCulture
                          ? 'bg-[#2b8d35] text-[rgba(12,14,12,0.9)]'
                          : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                      }`}
                    >
                      Культура
                    </button>
                    <button
                      onClick={() => {
                        setShowVegetation(!showVegetation);
                        if (!showVegetation) {
                          setShowFertilizer(false);
                          setShowCulture(false);
                        }
                      }}
                      className={`px-4 py-2 text-left text-sm transition-colors ${
                        showVegetation
                          ? 'bg-[#2b8d35] text-[rgba(12,14,12,0.9)]'
                          : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                      }`}
                    >
                      Растительность
                    </button>
                    <button
                      onClick={() => {
                        setShowFertilizer(!showFertilizer);
                        if (!showFertilizer) {
                          setShowVegetation(false);
                          setShowCulture(false);
                        }
                      }}
                      className={`px-4 py-2 text-left text-sm transition-colors ${
                        showFertilizer
                          ? 'bg-[#2b8d35] text-[rgba(12,14,12,0.9)]'
                          : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                      }`}
                    >
                      Удобрения
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Подменю индексов */}
            {layerMenuOpen && showVegetation && (
              <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[200px]">
                <CardContent className="p-0 flex flex-col">
                  <button
                    onClick={() => setSelectedIndex('ndvi')}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      selectedIndex === 'ndvi'
                        ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                        : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    NDVI
                  </button>
                  <button
                    onClick={() => setSelectedIndex('ndvi-avg')}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      selectedIndex === 'ndvi-avg'
                        ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                        : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    Средний NDVI
                  </button>
                  <button
                    onClick={() => setSelectedIndex('ndre')}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      selectedIndex === 'ndre'
                        ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                        : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    NDRE
                  </button>
                  <button
                    onClick={() => setSelectedIndex('pri')}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      selectedIndex === 'pri'
                        ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                        : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    PRI
                  </button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ - Поиск */}
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[300px]">
            <CardContent className="p-0 flex items-center gap-2 px-3 py-2">
              <Search className="size-5 text-[#b2b3b2]" />
              <input
                type="text"
                placeholder="Поиск"
                className="bg-transparent border-none outline-none text-[#b2b3b2] text-sm w-full"
              />
            </CardContent>
          </Card>

          {/* ПРАВАЯ ЧАСТЬ - Кнопки действий */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Обновление...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  Обновить данные
                </>
              )}
            </Button>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
            >
              <Download className="size-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* 4. ЛЕГЕНДА - левый нижний угол */}
        <div className="absolute bottom-4 left-4">
          {showVegetation && (
            <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20">
              <CardContent className="flex gap-3 items-center p-3">
                <div
                  className="h-[100px] w-3 rounded-[6px]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgb(40, 159, 52) 0%, rgb(102, 215, 113) 17.308%, rgb(238, 255, 6) 46.635%, rgb(241, 182, 80) 68.75%, rgb(242, 57, 57) 88.462%, rgb(158, 18, 18) 99.99%)',
                  }}
                />
                <div className="flex flex-col justify-between h-[100px] text-white text-sm">
                  <p>1.0</p>
                  <p>0.0</p>
                </div>
              </CardContent>
            </Card>
          )}

          {showFertilizer && (
            <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 mt-2">
              <CardContent className="p-3">
                <p className="text-white text-sm mb-2">Норма азота (N), кг/га</p>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#90ee90' }} />
                      <span className="text-white text-xs">40-60</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffd700' }} />
                      <span className="text-white text-xs">60-90</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffa500' }} />
                      <span className="text-white text-xs">90-120</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ff6b6b' }} />
                      <span className="text-white text-xs">120+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 5. ПАНЕЛЬ ИНФОРМАЦИИ - правый нижний угол */}
        <div className="absolute bottom-4 right-4 space-y-3">
          {/* Информация о поле */}
          <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm w-72">
            <CardContent className="p-4">
              <h3 className="text-white text-lg mb-3">{field.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2] text-sm">Культура:</span>
                  <span className="text-white text-sm">{field.cropType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2] text-sm">Площадь:</span>
                  <span className="text-white text-sm">{field.area} га</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2] text-sm">{getIndexName(selectedIndex)}:</span>
                  <span className="text-[#66d771] text-sm">{calculateAverageIndex()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2] text-sm">Обновлено:</span>
                  <span className="text-white text-xs">{field.lastUpdate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Панель пояснений */}
          <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm w-72">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-[#66d771] shrink-0 mt-0.5" />
                <div>
                  {showVegetation ? (
                    <>
                      <p className="text-white text-sm mb-1">
                        Интерпретация {getIndexName(selectedIndex)}
                      </p>
                      <ul className="text-[#b2b3b2] text-xs space-y-1">
                        <li>0.8-1.0: Отличное состояние</li>
                        <li>0.6-0.8: Хорошее состояние</li>
                        <li>0.4-0.6: Умеренное состояние</li>
                        <li>0.2-0.4: Слабое состояние</li>
                        <li>&lt;0.2: Очень слабое</li>
                      </ul>
                    </>
                  ) : showFertilizer ? (
                    <>
                      <p className="text-white text-sm mb-1">О картах удобрений</p>
                      <ul className="text-[#b2b3b2] text-xs space-y-1">
                        <li>Норма рассчитана на основе NDVI</li>
                        <li>Низкий NDVI = больше удобрений</li>
                        <li>Высокий NDVI = меньше удобрений</li>
                        <li>Дифференцированное внесение</li>
                      </ul>
                    </>
                  ) : showCulture ? (
                    <>
                      <p className="text-white text-sm mb-1">Информация о культуре</p>
                      <p className="text-[#b2b3b2] text-xs">{field.cropType} - основная культура</p>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Информация о выбранном квадрате */}
          {selectedZone && (
            <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm w-72">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="size-4 text-[#66d771] shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="text-white text-sm mb-2 font-medium">{selectedZone.health}</p>
                    
                    {showVegetation && (
                      <div className="mb-2">
                        <p className="text-[#b2b3b2] text-xs mb-1">Индексы:</p>
                        <div className="text-[#b2b3b2] text-xs">
                          <div>NDVI: {selectedZone.ndvi.toFixed(2)}</div>
                          <div>NDRE: {selectedZone.ndre.toFixed(2)}</div>
                          <div>PRI: {selectedZone.pri.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                    
                    {showFertilizer && (
                      <div className="mb-2">
                        <p className="text-[#b2b3b2] text-xs mb-1">Удобрения:</p>
                        <div className="text-[#b2b3b2] text-xs">
                          <div>N: {selectedZone.nitrogenRate} кг/га</div>
                          <div>P: {selectedZone.phosphorusRate} кг/га</div>
                          <div>K: {selectedZone.potassiumRate} кг/га</div>
                          <div className="text-[#66d771]">{selectedZone.recommendation}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-[#b2b3b2] text-xs">
                      <div>Площадь: {selectedZone.area} га</div>
                      <div>ID: {selectedZone.id}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 6. НИЖНЯЯ ПАНЕЛЬ - по центру */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20">
            <CardContent className="px-4 py-2">
              <p className="text-white text-sm text-center whitespace-nowrap">
                Площадь: {field.area} га | Квадратов: {fieldZones.length} | Размер: 20x20 м
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}