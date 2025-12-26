import { useMemo } from "react";
import InteractiveMap from "./InteractiveMap";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Download, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
}

type PncResponse = {
  lon: number[];
  lat: number[];
  pred: number[];
  cell_size_m?: number;
  meta?: any;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function MapView({ field, pnc }: { field: Field; pnc: PncResponse | null }) {
  const stats = useMemo(() => {
    const preds = pnc?.pred ?? [];
    if (!preds.length) return null;

    let min = preds[0];
    let max = preds[0];
    let sum = 0;

    for (const v of preds) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    return {
      cells: preds.length,
      min,
      max,
      avg: sum / preds.length,
      cellSize: pnc?.cell_size_m ?? null,
    };
  }, [pnc]);

  const handleRefresh = () => {
    // Тут можно потом дернуть бэкенд заново.
    toast.info("Обновление данных пока не подключено", { position: "top-right" });
  };

  const handleDownload = () => {
    // Если meta содержит GeoTIFF/PNG ссылку — можно будет сделать реальный экспорт.
    toast.info("Экспорт пока не подключен", { position: "top-right" });
  };

  const ndviLabel = `${Math.round(clamp01(field.ndvi) * 100)}%`;

  return (
    <div className="relative h-full w-full bg-[#131613]">
      {/* Карта как фон */}
      <InteractiveMap field={field} pnc={pnc} />

      {/* Оверлей: верхняя панель */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-auto">
        <div className="flex items-start justify-between gap-3">
          <Card className="bg-[rgba(12,14,12,0.94)] border-[#2b8d35]/30 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <div
                    className="text-white text-lg font-semibold"
                    style={{ textShadow: "0 2px 10px rgba(0,0,0,0.65)" }}
                  >
                    {field.name}
                  </div>

                  <div
                    className="text-[#cfd2cf] text-sm"
                    style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
                  >
                    {field.cropType} • {field.area.toFixed(2)} га • обновлено {field.lastUpdate}
                  </div>
                </div>

                <div className="ml-2 px-3 py-1 rounded-full bg-[#2b8d35]/25 border border-[#2b8d35]/35">
                  <span
                    className="text-[#a7ffb0] text-sm"
                    style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
                  >
                    NDVI: {ndviLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
            >
              <RefreshCw className="size-4 mr-2" />
              Обновить
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-[#2b8d35] text-[#66d771]"
            >
              <Download className="size-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>
      </div>

      {/* Оверлей: правая карточка статистики */}
      <div className="absolute top-24 right-4 z-[1000] w-[320px] pointer-events-auto">
        <Card className="bg-[rgba(12,14,12,0.85)] border-[#2b8d35]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="size-4 text-[#66d771]" />
              <div className="text-white font-medium">Статистика PNC</div>
            </div>

            {!stats ? (
              <div className="text-sm text-[#b2b3b2]">
                Нет данных сетки. Нарисуйте поле и дождитесь расчёта.
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">Клеток</span>
                  <span className="text-white">{stats.cells}</span>
                </div>

                {stats.cellSize != null && (
                  <div className="flex justify-between">
                    <span className="text-[#b2b3b2]">Размер клетки</span>
                    <span className="text-white">{stats.cellSize} м</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">min</span>
                  <span className="text-white">{stats.min.toFixed(3)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">avg</span>
                  <span className="text-white">{stats.avg.toFixed(3)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#b2b3b2]">max</span>
                  <span className="text-white">{stats.max.toFixed(3)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
