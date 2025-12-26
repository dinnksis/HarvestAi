import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner@2.0.3';

interface Field {
  id: string;
  name: string;
  boundary?: [number, number][]; // [lat, lng]
}

type PncResponse = {
  lon: number[];
  lat: number[];
  pred: number[];
  cell_size_m?: number;
  meta?: any;
};

interface InteractiveMapProps {
  field: Field;
  pnc?: PncResponse | null;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

// 0..1 -> rgb
function colorGreenToRedRGB(t: number): [number, number, number] {
  t = clamp01(t);
  const r = Math.round(255 * t);
  const g = Math.round(255 * (1 - t));
  return [r, g, 0];
}

// более “зелёный заметный” вариант: растягиваем низ
function applyGamma(t: number, gamma: number) {
  t = clamp01(t);
  return Math.pow(t, gamma);
}

// IDW интерполяция
function idwValue(
  x: number,
  y: number,
  pts: { x: number; y: number; v: number }[],
  power = 2,
  k = 24
) {
  // берём k ближайших (по квадрату расстояния), чтобы было быстрее
  // простая стратегия: один проход, накапливаем k лучших
  const best: { d2: number; v: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const dx = x - pts[i].x;
    const dy = y - pts[i].y;
    const d2 = dx * dx + dy * dy;

    if (d2 < 1e-9) return pts[i].v; // попали в точку

    if (best.length < k) {
      best.push({ d2, v: pts[i].v });
      if (best.length === k) best.sort((a, b) => a.d2 - b.d2);
      continue;
    }

    // если лучше худшего
    if (d2 < best[best.length - 1].d2) {
      best[best.length - 1] = { d2, v: pts[i].v };
      // восстановим порядок (k маленький — ок)
      best.sort((a, b) => a.d2 - b.d2);
    }
  }

  let wSum = 0;
  let vSum = 0;
  for (const it of best) {
    const w = 1 / Math.pow(it.d2, power / 2);
    wSum += w;
    vSum += w * it.v;
  }
  return wSum ? vSum / wSum : 0;
}

export default function InteractiveMap({ field, pnc }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const rasterOverlayRef = useRef<L.ImageOverlay | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);

  const [mapVersion, setMapVersion] = useState(0);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || !field.boundary || field.boundary.length < 3) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false as any,
      touchZoom: false,
    });

    const container = map.getContainer();
    container.style.pointerEvents = 'none';
    container.style.userSelect = 'none';
    container.style.touchAction = 'none';

    try {
      map.fitBounds(L.latLngBounds(field.boundary), { padding: [40, 40] });
    } catch {
      map.setView([55.7558, 37.6173], 15);
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // границы поля
    const boundary = L.polygon(field.boundary, {
      color: '#66d771',
      weight: 3,
      fillColor: '#2b8d35',
      fillOpacity: 0.12,
      opacity: 0.85,
    }).addTo(map);

    boundaryLayerRef.current = boundary;

    mapRef.current = map;
    setMapVersion((v) => v + 1);

    return () => {
      map.remove();
      mapRef.current = null;
      rasterOverlayRef.current = null;
      boundaryLayerRef.current = null;
    };
  }, [field.id, field.boundary]);

  // Рисуем растровый overlay
  useEffect(() => {
    const map = mapRef.current;
    const boundary = boundaryLayerRef.current;

    console.log('[InteractiveMap] map ready?', !!map);
    console.log('[InteractiveMap] pnc cells:', pnc?.lon?.length ?? 0);

    if (!map || !boundary) return;

    // удаляем старый overlay
    if (rasterOverlayRef.current) {
      map.removeLayer(rasterOverlayRef.current);
      rasterOverlayRef.current = null;
    }

    if (!pnc || !pnc.lon?.length || !pnc.pred?.length) return;

    // bounds поля
    const bounds = boundary.getBounds();

    // Настройки качества:
    // чем больше — тем плавнее, но тем тяжелее.
    const W = 420; // ширина canvas в пикселях
    const H = 420; // высота canvas
    // скорость/качество интерполяции:
    const K_NEAREST = 24;
    const POWER = 2.0;

    // нормализация значений (лучше по перцентилям, чтобы зелёный не исчезал)
    const preds = pnc.pred;
    const sorted = [...preds].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
    const lo = q(0.05);
    const hi = q(0.95);
    const denom = (hi - lo) || 1;

    // Предрасчёт точек в координатах canvas
    // x: 0..W-1 по долготе, y: 0..H-1 по широте (инвертировано)
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    const pts = pnc.lon.map((lon, i) => {
      const lat = pnc.lat[i];
      const vRaw = (pnc.pred[i] - lo) / denom;
      const v01 = clamp01(vRaw);

      const x = ((lon - west) / (east - west)) * (W - 1);
      const y = ((north - lat) / (north - south)) * (H - 1); // вверх=0

      return { x, y, v: v01 };
    });

    // canvas -> imageData
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = ctx.createImageData(W, H);
    const data = img.data;

    // “маска поля”: чтобы не красить за пределами полигона.
    // Проверяем для каждого пикселя, внутри ли он boundary.
    // Оптимизация: используем Leaflet point-in-polygon через latLng + contains?
    // Leaflet polygon: boundary._containsPoint работает в пиксельных координатах карты,
    // поэтому проще: делаем грубо — красим весь bounds.
    // Если хочешь строго по полигону — скажи, добавлю точную маску.
    const gamma = 1.6; // >1 => больше зелёного
    const alpha = 190; // 0..255

    // основной цикл: IDW интерполяция
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        let v = idwValue(px, py, pts, POWER, K_NEAREST);

        // усиливаем зелёный диапазон
        v = applyGamma(v, gamma);

        const [r, g, b] = colorGreenToRedRGB(v);

        const idx = (py * W + px) * 4;
        data[idx + 0] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(img, 0, 0);

    const url = canvas.toDataURL('image/png');

    const overlay = L.imageOverlay(url, bounds, {
      opacity: 0.8,
      interactive: false,
      crossOrigin: false,
    });

    overlay.addTo(map);
    rasterOverlayRef.current = overlay;

    toast.success(`Растер готов (pixels: ${W}x${H})`);
  }, [pnc, mapVersion]);

  if (!field.boundary || field.boundary.length < 3) {
    return (
      <div className="relative h-full bg-[#131613] flex items-center justify-center">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-96">
          <CardContent className="p-6">
            <h2 className="text-white text-xl mb-4">Ошибка</h2>
            <p className="text-[#b2b3b2] mb-4">У поля "{field.name}" нет определенных границ.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#131613]">
      <div ref={mapContainerRef} className="absolute inset-0" style={{ height: '100%', width: '100%' }} />
      <style>{`
        .leaflet-container,
        .leaflet-container * {
          pointer-events: none !important;
          user-select: none !important;
          touch-action: none !important;
        }
      `}</style>
    </div>
  );
}
