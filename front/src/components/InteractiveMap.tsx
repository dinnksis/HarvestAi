import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner@2.0.3";

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

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sorted[base];
  const b = sorted[Math.min(base + 1, sorted.length - 1)];
  return a + (b - a) * rest;
}

/**
 * Дискретные зоны (визуально чисто):
 * 0: ОК (зелёный, но очень прозрачный)
 * 1: Наблюдать (жёлтый)
 * 2: Удобрять (оранжевый)
 * 3: Срочно (красный, плотнее + обводка)
 *
 * Пороги сдвинуты так, чтобы зелёного было больше (до ~0.60).
 */
function classifyNeed(t: number) {
  t = clamp01(t);
  if (t < 0.60) return 0; // ОК (больше зелёного)
  if (t < 0.78) return 1; // Наблюдать
  if (t < 0.90) return 2; // Удобрять
  return 3; // Срочно
}

function styleForClass(cls: number) {
  // Более "чистая" палитра + контролируемая прозрачность
  // ОК-зона есть, но очень лёгкая, чтобы не "засорять" карту.
  switch (cls) {
    case 0: // зелёный (почти прозрачно)
      return {
        fillColor: "rgba(34, 197, 94, 0.10)", // green-500
        fillOpacity: 1,
        stroke: false,
        color: undefined,
        weight: 0,
        opacity: 0,
      };
    case 1: // жёлтый
      return {
        fillColor: "rgba(250, 204, 21, 0.18)", // amber-400
        fillOpacity: 1,
        stroke: false,
        color: undefined,
        weight: 0,
        opacity: 0,
      };
    case 2: // оранжевый
      return {
        fillColor: "rgba(249, 115, 22, 0.24)", // orange-500
        fillOpacity: 1,
        stroke: false,
        color: undefined,
        weight: 0,
        opacity: 0,
      };
    default: // 3 красный + лёгкая обводка (чтобы читалось как "срочно")
      return {
        fillColor: "rgba(239, 68, 68, 0.32)", // red-500
        fillOpacity: 1,
        stroke: true,
        color: "rgba(220, 38, 38, 0.60)", // red-600
        weight: 1.2,
        opacity: 1,
      };
  }
}

export default function InteractiveMap({ field, pnc }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

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

    // карта как фон
    const container = map.getContainer();
    container.style.pointerEvents = "none";
    container.style.userSelect = "none";
    container.style.touchAction = "none";

    try {
      map.fitBounds(L.latLngBounds(field.boundary), { padding: [40, 40] });
    } catch {
      map.setView([55.7558, 37.6173], 15);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // границы поля
    L.polygon(field.boundary, {
      color: "rgba(102, 215, 113, 0.85)",
      weight: 3,
      fillColor: "rgba(43, 141, 53, 0.10)",
      fillOpacity: 0.08,
      opacity: 1,
    }).addTo(map);

    gridLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setMapVersion((v) => v + 1);

    return () => {
      map.remove();
      mapRef.current = null;
      gridLayerRef.current = null;
    };
  }, [field.id, field.boundary]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = gridLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!pnc || !pnc.lon?.length || !pnc.lat?.length || !pnc.pred?.length) return;

    const preds = pnc.pred;

    // масштаб по хвостам, чтобы не ломалось выбросами
    const sorted = [...preds].sort((a, b) => a - b);
    const lo = quantile(sorted, 0.05);
    const hi = quantile(sorted, 0.95);
    const denom = (hi - lo) || 1;

    const cellSizeM = pnc.cell_size_m ?? 10;

    for (let i = 0; i < pnc.lon.length; i++) {
      const lon = pnc.lon[i];
      const lat = pnc.lat[i];
      const pred = pnc.pred[i];

      // t=0 хорошо, t=1 плохо/удобрять
      // если наоборот — инвертни:
      // const t = 1 - clamp01((pred - lo) / denom);
      const t = clamp01((pred - lo) / denom);

      const cls = classifyNeed(t);
      const st = styleForClass(cls);

      const center = L.latLng(lat, lon);
      const bounds = center.toBounds(cellSizeM / 2);

      const rect = L.rectangle(bounds, {
        fillColor: st.fillColor,
        fillOpacity: st.fillOpacity,
        stroke: st.stroke,
        color: st.color,
        weight: st.weight,
        opacity: st.opacity,
        className: "pnc-cell",
      });

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
      <div ref={mapContainerRef} className="absolute inset-0" style={{ height: "100%", width: "100%" }} />

      <style jsx global>{`
        .pnc-cell {
          mix-blend-mode: normal;
        }
      `}</style>
    </div>
  );
}
