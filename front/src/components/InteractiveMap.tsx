import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "./ui/card";
import { toast } from "sonner@2.0.3";
import { Button } from "./ui/button";
import { Search, Layers, Info, RefreshCw, Download, ZoomIn, ZoomOut } from "lucide-react";

interface Field {
  id: string;
  name: string;
  boundary?: [number, number][];
  area?: number;
  cropType?: string;
  lastUpdate?: string;
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

type LayerType = 'pnc' | 'ndvi' | 'fertilizer' | 'culture';

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

function classifyNeed(t: number) {
  t = clamp01(t);
  if (t < 0.60) return 0;
  if (t < 0.78) return 1;
  if (t < 0.90) return 2;
  return 3;
}

// Нормализация значений для NDVI
function normalizeForNdvi(value: number, min: number, max: number): number {
  return clamp01((value - min) / (max - min));
}

// Правильная цветовая схема для NDVI с новыми цветами
function getNdviColor(ndvi: number): string {
  if (ndvi >= 0.8) return '#66d771';      // Основной салатовый - отличное состояние
  if (ndvi >= 0.6) return '#88e092';      // Светло-салатовый - хорошее состояние
  if (ndvi >= 0.4) return '#f0ac2d';      // Желтый - умеренное
  if (ndvi >= 0.2) return '#f0ac2d';      // Желтый - слабое
  if (ndvi >= 0) return '#e74f0d';        // Красный - очень слабое
  return '#e74f0d';                       // Красный - плохое
}

// Цвета для удобрений с новыми цветами
function getFertilizerColor(value: number): string {
  if (value >= 0.8) return '#66d771';      // Салатовый - низкая норма
  if (value >= 0.6) return '#88e092';      // Светло-салатовый
  if (value >= 0.4) return '#f0ac2d';      // Желтый - средняя норма
  if (value >= 0.2) return '#f0ac2d';      // Желтый
  return '#e74f0d';                        // Красный - высокая норма
}

// Рассчитать норму удобрений на основе значения
function calculateFertilizerRates(value: number) {
  const nitrogenRate = Math.round(40 + value * 90);
  const phosphorusRate = Math.round(nitrogenRate * 0.7);
  const potassiumRate = Math.round(nitrogenRate * 0.6);
  
  let recommendation = '';
  if (value < 0.3) recommendation = 'Низкая норма';
  else if (value < 0.5) recommendation = 'Средняя норма';
  else if (value < 0.7) recommendation = 'Высокая норма';
  else recommendation = 'Очень высокая норма';
  
  return { nitrogenRate, phosphorusRate, potassiumRate, recommendation };
}

function styleForClass(cls: number, layerType: LayerType, customValue?: number) {
  if (layerType === 'pnc') {
    switch (cls) {
      case 0:
        return {
          fillColor: "rgba(102, 215, 113, 0.15)", // Салатовый
          fillOpacity: 1,
          stroke: false,
          color: undefined,
          weight: 0,
          opacity: 0,
        };
      case 1:
        return {
          fillColor: "rgba(240, 172, 45, 0.25)", // Желтый
          fillOpacity: 1,
          stroke: false,
          color: undefined,
          weight: 0,
          opacity: 0,
        };
      case 2:
        return {
          fillColor: "rgba(240, 172, 45, 0.35)", // Желтый более насыщенный
          fillOpacity: 1,
          stroke: false,
          color: undefined,
          weight: 0,
          opacity: 0,
        };
      default:
        return {
          fillColor: "rgba(231, 79, 13, 0.35)", // Красный
          fillOpacity: 1,
          stroke: true,
          color: "rgba(231, 79, 13, 0.60)",
          weight: 1.2,
          opacity: 1,
        };
    }
  }
  
  if (layerType === 'ndvi' && customValue !== undefined) {
    const fillColor = getNdviColor(customValue);
    const opacity = 0.3 + (customValue * 0.7);
    return {
      fillColor,
      fillOpacity: Math.min(opacity, 0.9),
      stroke: true,
      color: customValue < 0.3 ? '#ffffff' : '#f0f0f0',
      weight: customValue < 0.3 ? 1 : 0.5,
      opacity: 0.8,
    };
  }
  
  if (layerType === 'fertilizer' && customValue !== undefined) {
    const fillColor = getFertilizerColor(customValue);
    return {
      fillColor,
      fillOpacity: 0.7,
      stroke: true,
      color: '#ffffff',
      weight: 0.5,
      opacity: 0.8,
    };
  }
  
  return {
    fillColor: "rgba(102, 215, 113, 0.15)",
    fillOpacity: 1,
    stroke: false,
    color: undefined,
    weight: 0,
    opacity: 0,
  };
}

export default function InteractiveMap({ field, pnc }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapVersion, setMapVersion] = useState(0);
  
  // Состояния для меню
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('pnc');
  const [searchQuery, setSearchQuery] = useState('');

  // Основной useEffect для карты
  useEffect(() => {
    if (!mapContainerRef.current || !field.boundary || field.boundary.length < 3) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Отключаем стандартные кнопки масштаба
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      tap: true,
      touchZoom: true,
    });

    try {
      map.fitBounds(L.latLngBounds(field.boundary), { padding: [40, 40] });
    } catch {
      map.setView([55.7558, 37.6173], 15);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Границы поля
    L.polygon(field.boundary, {
      color: "#66d771",
      weight: 2,
      fillColor: "#0f2411",
      fillOpacity: 0.1,
      opacity: 0.7,
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

  // useEffect для отрисовки слоев
  useEffect(() => {
    const map = mapRef.current;
    const layer = gridLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (activeLayer === 'culture') {
      return;
    }

    if (!pnc || !pnc.lon?.length || !pnc.lat?.length || !pnc.pred?.length) return;

    const preds = pnc.pred;
    const sorted = [...preds].sort((a, b) => a - b);
    const lo = quantile(sorted, 0.05);
    const hi = quantile(sorted, 0.95);
    const denom = (hi - lo) || 1;

    const cellSizeM = pnc.cell_size_m ?? 10;
    const predMin = Math.min(...preds);
    const predMax = Math.max(...preds);

    for (let i = 0; i < pnc.lon.length; i++) {
      const lon = pnc.lon[i];
      const lat = pnc.lat[i];
      const pred = pnc.pred[i];

      const t = clamp01((pred - lo) / denom);
      const cls = classifyNeed(t);
      
      let style;
      let popupContent = '';
      let customValue: number | undefined;

      if (activeLayer === 'ndvi') {
        customValue = normalizeForNdvi(pred, predMin, predMax);
        style = styleForClass(cls, 'ndvi', customValue);
        popupContent = `
          <div style="padding: 12px; min-width: 200px; font-family: sans-serif; background-color: #0f2411; color: #ffffff;">
            <h4 style="margin: 0 0 8px 0; color: #66d771;">Квадрат ${i + 1}</h4>
            <div><strong>NDVI: ${customValue.toFixed(3)}</strong></div>
            <div>Значение: ${pred.toFixed(3)}</div>
            <div>Состояние: ${getNdviStatus(customValue)}</div>
          </div>
        `;
      } else if (activeLayer === 'fertilizer') {
        customValue = clamp01((pred - predMin) / (predMax - predMin));
        const rates = calculateFertilizerRates(customValue);
        style = styleForClass(cls, 'fertilizer', customValue);
        popupContent = `
          <div style="padding: 12px; min-width: 220px; font-family: sans-serif; background-color: #0f2411; color: #ffffff;">
            <h4 style="margin: 0 0 8px 0; color: #66d771;">Квадрат ${i + 1}</h4>
            <div><strong>Рекомендация: ${rates.recommendation}</strong></div>
            <div>Азот (N): ${rates.nitrogenRate} кг/га</div>
            <div>Фосфор (P): ${rates.phosphorusRate} кг/га</div>
            <div>Калий (K): ${rates.potassiumRate} кг/га</div>
          </div>
        `;
      } else {
        style = styleForClass(cls, 'pnc');
        popupContent = `
          <div style="padding: 12px; min-width: 200px; font-family: sans-serif; background-color: #0f2411; color: #ffffff;">
            <h4 style="margin: 0 0 8px 0; color: #66d771;">Квадрат ${i + 1}</h4>
            <div><strong>Статус: ${getPncStatus(cls)}</strong></div>
            <div>Значение: ${pred.toFixed(3)}</div>
            <div>Категория: ${getPncCategory(cls)}</div>
          </div>
        `;
      }

      const center = L.latLng(lat, lon);
      const bounds = center.toBounds(cellSizeM / 2);

      const rect = L.rectangle(bounds, {
        ...style,
        className: "pnc-cell",
      });

      if (popupContent) {
        rect.bindPopup(popupContent);
      }

      rect.addTo(layer);
    }

    toast.success(`Отрисовано клеток: ${pnc.lon.length} (слой: ${activeLayer})`);
  }, [pnc, mapVersion, activeLayer]);

  const getPncStatus = (cls: number): string => {
    switch (cls) {
      case 0: return 'OK';
      case 1: return 'Наблюдать';
      case 2: return 'Удобрять';
      case 3: return 'Срочно';
      default: return 'Неизвестно';
    }
  };

  const getPncCategory = (cls: number): string => {
    switch (cls) {
      case 0: return 'Состояние хорошее';
      case 1: return 'Требует наблюдения';
      case 2: return 'Требуется удобрение';
      case 3: return 'Требует срочного внимания';
      default: return 'Неизвестно';
    }
  };

  const getNdviStatus = (ndvi: number): string => {
    if (ndvi >= 0.8) return 'Отличное состояние';
    if (ndvi >= 0.6) return 'Хорошее состояние';
    if (ndvi >= 0.4) return 'Умеренное состояние';
    if (ndvi >= 0.2) return 'Слабое состояние';
    return 'Очень слабое состояние';
  };

  // Функции для кнопок
  const handleRefresh = () => {
    setMapVersion((v) => v + 1);
    toast.info("Карта обновлена");
  };

  const handleExport = () => {
    toast.success("Экспорт начат...");
    // Здесь будет логика экспорта
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  if (!field.boundary || field.boundary.length < 3) {
    return (
      <div className="relative h-full bg-[#0f2411] flex items-center justify-center">
        <Card className="bg-[#0c0e0c] border-[#66d771]/20 w-96">
          <CardContent className="p-6">
            <h2 className="text-white text-xl mb-4">Ошибка</h2>
            <p className="text-[#b2b3b2] mb-4">У поля "{field.name}" нет определенных границ.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#0f2411]">
      {/* КОНТЕЙНЕР КАРТЫ */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ height: "100%", width: "100%" }} />

      {/* ВЕРХНЯЯ ПАНЕЛЬ МЕНЮ */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent z-[1000]">
        
        {/* ЛЕВАЯ ЧАСТЬ - Слои карты */}
        <div className="flex items-start space-x-4">
          <Card className="bg-[#0c0e0c] border-[#66d771]/20 w-[240px]">
            <CardContent className="p-0">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#66d771]/10 transition-colors"
                onClick={() => setLayerMenuOpen(!layerMenuOpen)}
              >
                <Layers className="size-5 text-[#66d771]" />
                <p className="text-[#66d771] text-lg font-medium">Слои карты</p>
              </div>

              {layerMenuOpen && (
                <div className="flex flex-col">
                  <button
                    onClick={() => {
                      setActiveLayer('pnc');
                      setLayerMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      activeLayer === 'pnc'
                        ? 'bg-[#66d771] text-[#0c0e0c]'
                        : 'bg-[#0f2411] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    PNC (основной)
                  </button>
                  <button
                    onClick={() => {
                      setActiveLayer('ndvi');
                      setLayerMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      activeLayer === 'ndvi'
                        ? 'bg-[#66d771] text-[#0c0e0c]'
                        : 'bg-[#0f2411] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    Растительность (NDVI)
                  </button>
                  <button
                    onClick={() => {
                      setActiveLayer('fertilizer');
                      setLayerMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      activeLayer === 'fertilizer'
                        ? 'bg-[#66d771] text-[#0c0e0c]'
                        : 'bg-[#0f2411] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    Удобрения
                  </button>
                  <button
                    onClick={() => {
                      setActiveLayer('culture');
                      setLayerMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left text-sm transition-colors ${
                      activeLayer === 'culture'
                        ? 'bg-[#66d771] text-[#0c0e0c]'
                        : 'bg-[#0f2411] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                    }`}
                  >
                    Культура
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ - Поиск */}
        <Card className="bg-[#0c0e0c] border-[#66d771]/20 w-[300px]">
          <CardContent className="p-0 flex items-center gap-2 px-3 py-2">
            <Search className="size-5 text-[#b2b3b2]" />
            <input
              type="text"
              placeholder="Поиск"
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-[#b2b3b2]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      



      <style jsx global>{`
        .pnc-cell {
          mix-blend-mode: normal;
          transition: fill-opacity 0.2s ease;
        }
        .pnc-cell:hover {
          fill-opacity: 0.9 !important;
          stroke-width: 2px !important;
        }
        /* Отключаем стандартные кнопки масштаба */
        .leaflet-control-zoom {
          display: none !important;
        }
        /* Стили для всплывающих окон */
        .leaflet-popup-content-wrapper {
          background-color: #0f2411 !important;
          color: #ffffff !important;
          border-radius: 8px !important;
          border: 1px solid #66d771 !important;
        }
        .leaflet-popup-tip {
          background-color: #0f2411 !important;
          border: 1px solid #66d771 !important;
        }
        .leaflet-popup-close-button {
          color: #ffffff !important;
        }
        .leaflet-popup-close-button:hover {
          color: #66d771 !important;
        }
        /* Стили для контролов карты */
        .leaflet-control-attribution {
          background-color: rgba(12, 14, 12, 0.8) !important;
          color: #b2b3b2 !important;
        }
        .leaflet-control-attribution a {
          color: #66d771 !important;
        }
      `}</style>
    </div>
  );
}