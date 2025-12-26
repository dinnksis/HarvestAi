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
import { X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

type PncResponse = {
  lon: number[];
  lat: number[];
  pred: number[];
  cell_size_m?: number;
  meta?: any;
};

interface FieldBoundaryMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onBoundaryComplete: (boundary: [number, number][], area: number, pnc: PncResponse) => void;
  onCancel?: () => void;
  fieldName?: string;
}

function DrawingHandler({
  onPointAdd
}: {
  onPointAdd: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPointAdd([e.latlng.lat, e.latlng.lng]); // [lat,lng]
    }
  });

  return null;
}

type LatLng = [number, number]; // [lat,lng]
type LonLat = [number, number]; // [lon,lat]

function toLonLat(points: LatLng[]): LonLat[] {
  return points.map(([lat, lng]) => [lng, lat]);
}

function closePolygonLonLat(coords: LonLat[]): LonLat[] {
  if (!coords.length) return coords;
  const [lon0, lat0] = coords[0];
  const [lonN, latN] = coords[coords.length - 1];
  const isClosed = lon0 === lonN && lat0 === latN;
  return isClosed ? coords : [...coords, coords[0]];
}

const API_BASE = "http://localhost:8000";

async function predictPNC(polygonLonLat: LonLat[]): Promise<PncResponse> {
  const body = {
    coords: polygonLonLat, // [lon,lat] + замкнутый
    project_id: "harvestai-482321",
    date_start: "2024-08-10",
    date_end: "2024-09-29",
    cell_size_m: 4,
    max_cloud_pct: 20,
    rededge_band: "B5",
    composite: "median",
  };

  const r = await fetch(`${API_BASE}/pnc/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!r.ok) {
    const detail = payload?.detail ?? text ?? `HTTP ${r.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return payload as PncResponse;
}

export default function FieldBoundaryMap({
  initialCenter = [45.9022, 42.1167],
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

  const calculateArea = (pts: [number, number][]): number => {
    if (pts.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i][0] * pts[j][1];
      area -= pts[j][0] * pts[i][1];
    }

    return Math.abs(area) * 11132 * 11132 * Math.cos(initialCenter[0] * Math.PI / 180) / 10000 / 2;
  };

  const handleComplete = async () => {
    if (points.length < 3) {
      toast.error("Нужно минимум 3 точки для поля", { position: "top-right" });
      return;
    }

    try {
      const lonlat = closePolygonLonLat(toLonLat(points));
      const res = await predictPNC(lonlat);

      console.log("PNC response:", res);
      toast.info(`PNC cells: ${res?.lon?.length ?? 0}`);

      const area = calculateArea(points);
      onBoundaryComplete(points, area, res);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? String(e));
    }
  };

  const resetDrawing = () => {
    setPoints([]);
    setShowMinPointsAlert(false);
    toast.info('Рисование сброшено', { position: 'top-right' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      if (mapElement) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col">
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
            <div className="text-right">
              <span className="text-white text-sm">Точек: {points.length}</span>
              {points.length >= 3 && (
                <div className="text-[#66d771] text-sm">
                  Площадь: {calculateArea(points).toFixed(2)} га
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 relative rounded-lg overflow-hidden min-h-0">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="rounded-lg leaflet-container"
          whenCreated={(map) => {
            mapInitialized.current = true;
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();

            setTimeout(() => {
              try {
                map.invalidateSize();
              } catch {}
            }, 150);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <DrawingHandler onPointAdd={handlePointAdd} />

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

      <div className="mt-4 flex justify-between flex-shrink-0">
        <div className="flex gap-2">
          <Button onClick={resetDrawing} variant="outline" className="border-[#2b8d35] text-[#66d771]">
            <RotateCcw className="size-4 mr-2" />
            Сбросить
          </Button>

          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="border-red-500 text-red-500">
              <X className="size-4 mr-2" />
              Отмена
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
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
