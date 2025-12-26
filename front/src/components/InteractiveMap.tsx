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

// 0 -> зелёный, 1 -> красный
// Сделали цвета "светлее" и "зеленее":
// - меньше красного на низких t
// - зелёный держится выше дольше
// - добавили небольшую "подсветку" (mix с белым)
function colorGreenToRed(t: number) {
  t = clamp01(t);

  // сдвигаем шкалу, чтобы зелёный доминировал дольше
  const tt = Math.pow(t, 1.35); // >1 => больше зелёного при средних значениях

  // базовый градиент (приглушённый красный, усиленный зелёный)
  let r = Math.round(220 * tt); // вместо 255
  let g = Math.round(255 * (1 - tt) + 30); // чуть больше зелёного
  let b = 0;

  // "осветляем" цвет: смешиваем с белым на 22%
  const mix = 0.22;
  r = Math.round(r + (255 - r) * mix);
  g = Math.round(g + (255 - g) * mix);
  b = Math.round(b + (255 - b) * mix);

  return `rgb(${r},${g},${b})`;
}

export default function InteractiveMap({ field, pnc }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);

  // нужен, чтобы перерисовать квадраты, если pnc пришёл раньше карты
  const [mapVersion, setMapVersion] = useState(0);

  // Инициализация Leaflet-карты (фон + границы поля)
  useEffect(() => {
    if (!mapContainerRef.current || !field.boundary || field.boundary.length < 3) return;

    // пересоздаём карту при смене поля/границы
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,

      // как у тебя: блокируем интеракции
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false as any,
      touchZoom: false,
    });

    // блокируем события мыши на контейнере Leaflet (если ты так и хочешь)
    const container = map.getContainer();
    container.style.pointerEvents = 'none';
    container.style.userSelect = 'none';
    container.style.touchAction = 'none';

    // центрируем по границе
    try {
      map.fitBounds(L.latLngBounds(field.boundary), { padding: [40, 40] });
    } catch {
      map.setView([55.7558, 37.6173], 15);
    }

    // OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // границы поля (чуть легче/прозрачнее тоже)
    L.polygon(field.boundary, {
      color: '#66d771',
      weight: 3,
      fillColor: '#2b8d35',
      fillOpacity: 0.10,
      opacity: 0.80,
    }).addTo(map);

    // слой сетки
    gridLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapVersion((v) => v + 1);

    return () => {
      map.remove();
      mapRef.current = null;
      gridLayerRef.current = null;
    };
  }, [field.id, field.boundary]);

  // Отрисовка квадратов от бекенда (lon/lat/pred)
  useEffect(() => {
    const map = mapRef.current;
    const layer = gridLayerRef.current;

    // диагностические логи (можно потом удалить)
    console.log('[InteractiveMap] map ready?', !!map, 'layer?', !!layer);
    console.log('[InteractiveMap] pnc cells:', pnc?.lon?.length ?? 0);

    if (!map || !layer) return;

    layer.clearLayers();

    if (!pnc || !pnc.lon?.length || !pnc.pred?.length) return;

    const preds = pnc.pred;
    const min = Math.min(...preds);
    const max = Math.max(...preds);
    const denom = (max - min) || 1;

    console.log('[InteractiveMap] pred min/max:', min, max);

    const cellSizeM = pnc.cell_size_m ?? 20;

    for (let i = 0; i < pnc.lon.length; i++) {
      const lon = pnc.lon[i];
      const lat = pnc.lat[i];
      const pred = pnc.pred[i];

      const t = (pred - min) / denom;
      const fill = colorGreenToRed(t);

      const center = L.latLng(lat, lon);
      const bounds = center.toBounds(cellSizeM);

      const rect = L.rectangle(bounds, {
        color: fill,
        fillColor: fill,

        // было 0.55 — сделали более прозрачным
        fillOpacity: 0.28,

        // было 1 — чуть тоньше, чтобы легче выглядело
        weight: 0.8,

        // было 0.85 — тоже чуть прозрачнее контур
        opacity: 0.45,
      });

      rect.bindTooltip(`pred: ${pred.toFixed(3)}`, { sticky: true });

      rect.addTo(layer);
    }

    toast.success(`Отрисовано клеток: ${pnc.lon.length}`);
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
      <style jsx global>{`
        /* на всякий случай: если нужно полностью отключить события на leaflet */
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
