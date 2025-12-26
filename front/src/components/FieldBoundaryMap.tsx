import { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  useMapEvents,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Save, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface FieldBoundaryMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onBoundaryComplete: (boundary: [number, number][], area: number) => void;
  onCancel?: () => void;
  fieldName?: string;
}

// Простой обработчик рисования
function DrawingHandler({ 
  onPointAdd 
}: { 
  onPointAdd: (point: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onPointAdd([e.latlng.lat, e.latlng.lng]);
    }
  });

  // Принудительная активация карты
  useEffect(() => {
    if (map) {
      // Даем карте немного времени на инициализацию
      const timer = setTimeout(() => {
        try {
          // 1. Обновляем размеры
          map.invalidateSize();
          
          // 2. Включаем все взаимодействия
          map.dragging.enable();
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.scrollWheelZoom.enable();
          map.boxZoom.enable();
          map.keyboard.enable();
          
          // 3. Немного "шевелим" карту чтобы она стала активной
          const center = map.getCenter();
          const zoom = map.getZoom();
          
          // Микро-движение (незаметное для пользователя)
          map.setView(
            [center.lat + 0.000001, center.lng],
            zoom,
            { animate: false }
          );
          
          // Возвращаем обратно
          setTimeout(() => {
            map.setView(center, zoom, { animate: false });
          }, 10);
          
        } catch (error) {
          console.error('Failed to activate map:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [map]);

  return null;
}

export default function FieldBoundaryMap({ 
  initialCenter = [55.7558, 37.6173],
  initialZoom = 13,
  onBoundaryComplete,
  onCancel,
  fieldName = "Новое поле"
}: FieldBoundaryMapProps) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [showMinPointsAlert, setShowMinPointsAlert] = useState(false);
  const mapInitialized = useRef(false);

  const handlePointAdd = (point: [number, number]) => {
    const newPoints = [...points, point];
    setPoints(newPoints);
    
    if (newPoints.length >= 3 && !showMinPointsAlert) {
      setShowMinPointsAlert(true);
      toast.info('Минимум 3 точки добавлено', {
        description: 'Нажмите "Завершить" или продолжайте рисовать.',
        duration: 3000,
        position: 'top-right'
      });
    }
  };

  const calculateArea = (points: [number, number][]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    
    return Math.abs(area) * 11132 * 11132 * Math.cos(initialCenter[0] * Math.PI / 180) / 10000 / 2;
  };

const API_BASE = "http://localhost:8000"; // где крутится FastAPI

async function predictPNC(polygonCoords) {
// polygonCoords: [[lon,lat],[lon,lat],...,[lon,lat]] (последняя точка = первая)
const body = {
    coords: polygonCoords,
    project_id: "harvestai-482321",
    date_start: "2024-08-10",
    date_end: "2024-09-29",
    cell_size_m: 20,
    max_cloud_pct: 20,
    rededge_band: "B5",
    composite: "median",
    // nan_policy: "drop" // если добавишь
};

const r = await fetch(`${API_BASE}/pnc/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${r.status}`);
}

const data = await r.json();
// data = { lon: [...], lat: [...], pred: [...], meta: {...} }
return data;
}
  const handleComplete = () => {
    if (points.length < 3) {
      toast.error('Нужно минимум 3 точки для поля', {
        position: 'top-right'
      });
      return;
    }
    try {
        const res = predictPNC(points);
        console.log(res.lon.length, res.pred.length);
        // TODO: отрисовать на карте
    } catch (e) {
        alert(e.message);
    }
    const area = calculateArea(points);
    onBoundaryComplete(points, area);
  };

  const resetDrawing = () => {
    setPoints([]);
    setShowMinPointsAlert(false);
    toast.info('Рисование сброшено', {
      position: 'top-right'
    });
  };

  // Дополнительная активация после монтирования
  useEffect(() => {
    const timer = setTimeout(() => {
      // Попытка активировать карту через некоторое время
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      if (mapElement) {
        // Генерируем событие resize чтобы Leaflet обновил размеры
        window.dispatchEvent(new Event('resize'));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Инструкция */}
      <Card className="mb-4 bg-[#131613] border-[#2b8d35]/20 flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-medium mb-1">
                {fieldName} - выбор границ
              </h3>
              <p className="text-sm text-[#b2b3b2]">
                Кликайте на карте чтобы добавить точки границы поля. Минимум 3 точки.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-white text-sm">
                    Точек: {points.length}
                  </span>
                  {points.length >= 3 && (
                    <div className="text-[#66d771] text-sm">
                      Площадь: {calculateArea(points).toFixed(2)} га
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Карта */}
      <div className="flex-1 relative rounded-lg overflow-hidden min-h-0">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ 
            height: '100%', 
            width: '100%',
            zIndex: 1
          }}
          className="rounded-lg leaflet-container"
          whenCreated={(map) => {
            // Сохраняем что карта инициализирована
            mapInitialized.current = true;
            
            // Включаем все взаимодействия сразу
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            
            // Принудительное обновление размеров
            setTimeout(() => {
              try {
                map.invalidateSize();
                
                // Делаем микро-движение для активации
                const center = map.getCenter();
                const zoom = map.getZoom();
                
                // Небольшое смещение и возврат
                map.setView(
                  [center.lat + 0.00001, center.lng],
                  zoom,
                  { animate: false }
                );
                
                setTimeout(() => {
                  map.setView(center, zoom, { animate: false });
                }, 50);
                
              } catch (error) {
                console.error('Map activation failed:', error);
              }
            }, 150);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <DrawingHandler onPointAdd={handlePointAdd} />
          
          {/* Нарисованные точки */}
          {points.length > 0 && (
            <Polygon
              positions={points}
              pathOptions={{
                color: '#66d771',
                fillColor: '#66d771',
                fillOpacity: 0.3,
                weight: 3,
                dashArray: '10, 10'
              }}
            />
          )}

          {/* Отображение точек на карте */}
          {points.map((point, index) => (
            <Popup key={index} position={point}>
              <div className="text-sm">
                <div>Точка {index + 1}</div>
                <div>Широта: {point[0].toFixed(6)}</div>
                <div>Долгота: {point[1].toFixed(6)}</div>
              </div>
            </Popup>
          ))}
        </MapContainer>
      </div>

      {/* Панель управления */}
      <div className="mt-4 flex justify-between flex-shrink-0">
        <div className="flex gap-2">
          <Button
            onClick={resetDrawing}
            variant="outline"
            className="border-[#2b8d35] text-[#66d771]"
          >
            <RotateCcw className="size-4 mr-2" />
            Сбросить
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-red-500 text-red-500"
            >
              <X className="size-4 mr-2" />
              Отмена
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {points.length < 3 && (
            <div className="flex items-center gap-2 mr-4 px-3 py-2 bg-[#2b8d35]/10 border border-[#2b8d35]/20 rounded-lg">
              <AlertCircle className="size-4 text-[#66d771]" />
              <span className="text-sm text-[#b2b3b2]">
                Нужно еще {3 - points.length} точки
              </span>
            </div>
          )}
          
          <Button
            onClick={handleComplete}
            disabled={points.length < 3}
            className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c] min-w-[180px]"
          >
            <Check className="size-4 mr-2" />
            Завершить ({points.length}/3)
          </Button>
          
        </div>
      </div>
    </div>
  );
}