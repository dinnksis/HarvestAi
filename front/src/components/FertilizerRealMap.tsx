import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Download, ZoomIn, ZoomOut, Layers } from 'lucide-react';

// Fix for Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

interface FertilizerZone {
  id: string;
  coordinates: [number, number][];
  nitrogenRate: number; // кг/га
  phosphorusRate: number;
  potassiumRate: number;
  recommendation: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  boundary?: [number, number][];
}

interface FertilizerRealMapProps {
  field: Field;
}

// Компонент для управления картой
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function FertilizerRealMap({ field }: FertilizerRealMapProps) {
  const [zoom, setZoom] = useState(15);
  const [opacity, setOpacity] = useState(0.7);
  const [selectedZone, setSelectedZone] = useState<FertilizerZone | null>(null);
  
  // Центр карты - центр поля или дефолтный
  const getCenter = (): [number, number] => {
    if (field.boundary && field.boundary.length > 0) {
      const lats = field.boundary.map(c => c[0]);
      const lngs = field.boundary.map(c => c[1]);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2
      ];
    }
    return [55.7558, 37.6173]; // Москва по умолчанию
  };

  // Генерация сетки удобрений 10x10м внутри границ поля
  const generateFertilizerGrid = (): FertilizerZone[] => {
    if (!field.boundary || field.boundary.length < 3) return [];
    
    const zones: FertilizerZone[] = [];
    const gridSizeMeters = 10; // 10x10 метров
    
    // Получаем границы поля
    const lats = field.boundary.map(c => c[0]);
    const lngs = field.boundary.map(c => c[1]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Конвертируем метры в градусы (примерно)
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    
    const cellSizeLat = gridSizeMeters / metersPerDegreeLat;
    const cellSizeLng = gridSizeMeters / metersPerDegreeLng;
    
    // Создаем сетку
    let id = 1;
    for (let lat = minLat; lat < maxLat; lat += cellSizeLat) {
      for (let lng = minLng; lng < maxLng; lng += cellSizeLng) {
        // Создаем квадрат 10x10м
        const zoneCoordinates: [number, number][] = [
          [lat, lng],
          [lat + cellSizeLat, lng],
          [lat + cellSizeLat, lng + cellSizeLng],
          [lat, lng + cellSizeLng]
        ];
        
        // Генерируем случайные данные для демо
        const nitrogenRate = Math.floor(Math.random() * 80) + 20; // 20-100 кг/га
        const phosphorusRate = Math.floor(nitrogenRate * 0.6);
        const potassiumRate = Math.floor(nitrogenRate * 0.4);
        
        zones.push({
          id: `zone-${id++}`,
          coordinates: zoneCoordinates,
          nitrogenRate,
          phosphorusRate,
          potassiumRate,
          recommendation: nitrogenRate > 70 ? 'Высокая норма' : 
                         nitrogenRate > 50 ? 'Средняя норма' : 'Низкая норма'
        });
      }
    }
    
    return zones.slice(0, 100); // Ограничиваем для производительности
  };

  const fertilizerZones = generateFertilizerGrid();

  // Цвет для зоны удобрений
  const getZoneColor = (nitrogenRate: number): string => {
    if (nitrogenRate >= 80) return '#ff6b6b'; // красный
    if (nitrogenRate >= 60) return '#ffa500'; // оранжевый
    if (nitrogenRate >= 40) return '#ffd700'; // желтый
    return '#90ee90'; // зеленый
  };

  // Увеличить зум
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  
  // Уменьшить зум
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 10));

  // Экспорт данных
  const handleExport = () => {
    const data = {
      field: field.name,
      zones: fertilizerZones,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fertilizer-map-${field.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative h-full bg-[#131613]">
      {/* Основная карта */}
      <div className="absolute inset-0">
        <MapContainer
          center={getCenter()}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapController center={getCenter()} zoom={zoom} />
          
          {/* Фоновая карта OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {/* Границы поля */}
          {field.boundary && field.boundary.length >= 3 && (
            <Polygon
              positions={field.boundary}
              pathOptions={{
                color: '#66d771',
                weight: 3,
                fillColor: '#2b8d35',
                fillOpacity: 0.1,
                opacity: 0.8
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{field.name}</h3>
                  <p>Культура: {field.cropType}</p>
                  <p>Площадь: {field.area} га</p>
                </div>
              </Popup>
            </Polygon>
          )}
          
          {/* Сетка удобрений */}
          {fertilizerZones.map(zone => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                fillColor: getZoneColor(zone.nitrogenRate),
                color: '#000',
                weight: 0.3,
                fillOpacity: opacity,
                opacity: 0.8
              }}
              eventHandlers={{
                click: () => setSelectedZone(zone),
                mouseover: (e) => {
                  e.target.setStyle({ weight: 1.5 });
                },
                mouseout: (e) => {
                  e.target.setStyle({ weight: 0.3 });
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-bold mb-2">Зона удобрений</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Азот (N):</span>
                      <span className="font-bold">{zone.nitrogenRate} кг/га</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Фосфор (P):</span>
                      <span>{zone.phosphorusRate} кг/га</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Калий (K):</span>
                      <span>{zone.potassiumRate} кг/га</span>
                    </div>
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <span className="font-medium">Рекомендация:</span>
                      <p className="text-sm">{zone.recommendation}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
      </div>

      {/* Панель управления - справа */}
      <div className="absolute right-4 top-4 z-[1000] space-y-3">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-64">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="size-5 text-[#66d771]" />
              <h3 className="text-white text-lg">Управление картой</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#b2b3b2] text-sm">Прозрачность зон:</span>
                  <span className="text-white text-sm">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  onValueChange={(value) => setOpacity(value[0])}
                  min={0.3}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#b2b3b2] text-sm">Масштаб:</span>
                  <span className="text-white text-sm">{zoom}x</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleZoomOut}
                    size="sm"
                    className="flex-1 bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                  >
                    <ZoomOut className="size-4 mr-1" />
                    Отдалить
                  </Button>
                  <Button
                    onClick={handleZoomIn}
                    size="sm"
                    className="flex-1 bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                  >
                    <ZoomIn className="size-4 mr-1" />
                    Приблизить
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleExport}
                className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
              >
                <Download className="size-4 mr-2" />
                Экспорт карты
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Легенда */}
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-64">
          <CardContent className="p-4">
            <h3 className="text-white text-lg mb-3">Легенда</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#90ee90] border border-black" />
                <span className="text-white text-sm">Низкая норма (20-40 кг/га)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ffd700] border border-black" />
                <span className="text-white text-sm">Средняя норма (40-60 кг/га)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ffa500] border border-black" />
                <span className="text-white text-sm">Высокая норма (60-80 кг/га)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ff6b6b] border border-black" />
                <span className="text-white text-sm">Очень высокая (80+ кг/га)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информация о выбранной зоне - слева */}
      {selectedZone && (
        <div className="absolute left-4 top-4 z-[1000]">
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-72">
            <CardContent className="p-4">
              <h3 className="text-white text-lg mb-3">Выбранная зона</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">Азот (N):</span>
                  <span className="text-white font-bold">{selectedZone.nitrogenRate} кг/га</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">Фосфор (P):</span>
                  <span className="text-white">{selectedZone.phosphorusRate} кг/га</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">Калий (K):</span>
                  <span className="text-white">{selectedZone.potassiumRate} кг/га</span>
                </div>
                <div className="mt-3 p-2 bg-[#2b8d35]/20 rounded border border-[#2b8d35]/30">
                  <span className="text-[#66d771] font-medium">Рекомендация:</span>
                  <p className="text-white text-sm mt-1">{selectedZone.recommendation}</p>
                </div>
                <Button
                  onClick={() => setSelectedZone(null)}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-[#2b8d35] text-[#66d771]"
                >
                  Закрыть
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}