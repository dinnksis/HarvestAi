import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, RefreshCw, Info, Plus, Minus, Search, Layers } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type IndexType = 'ndvi' | 'ndvi-avg' | 'ndre' | 'pri';

interface Position {
  x: number;
  y: number;
}

interface FieldZone {
  id: string;
  positions: Position[];
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
  boundary?: [number, number][];
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

export default function InteractiveMap({ field }: InteractiveMapProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<IndexType>('ndvi');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [showVegetation, setShowVegetation] = useState(true);
  const [showFertilizer, setShowFertilizer] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  const [selectedZone, setSelectedZone] = useState<FieldZone | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fieldZones, setFieldZones] = useState<FieldZone[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Генерируем квадраты
  const generateZones = (): FieldZone[] => {
    const zones: FieldZone[] = [];
    const squareSize = 50;
    
    const gridCols = 12;
    const gridRows = 8;
    
    const healthStates = [
      'Отличное состояние',
      'Хорошее состояние',
      'Умеренное состояние',
      'Слабое состояние',
    ];

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = 100 + col * squareSize;
        const y = 100 + row * squareSize;
        
        const baseNdvi = Math.random() * 0.7 + 0.2;
        const ndvi = Math.min(0.95, Math.max(0.15, baseNdvi));
        
        const fertilizerRec = calculateFertilizerRecommendation(ndvi);
        
        zones.push({
          id: `zone-${row}-${col}`,
          positions: [
            { x, y },
            { x: x + squareSize, y },
            { x: x + squareSize, y: y + squareSize },
            { x, y: y + squareSize },
          ],
          ndvi: ndvi,
          ndre: ndvi * 0.85,
          pri: ndvi * 0.75,
          area: 0.0001,
          health: healthStates[Math.min(Math.floor(ndvi / 0.25), 3)],
          ...fertilizerRec,
        });
      }
    }
    
    return zones;
  };

  // Инициализация Leaflet карты
  useEffect(() => {
    if (!mapContainerRef.current || !field.boundary) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Создаем карту с ВСЕМИ отключенными функциями
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      bounceAtZoomLimits: false,
      zoomSnap: 0,
      zoomDelta: 0,
    });

    // ВАЖНО: Принудительно блокируем события мыши на контейнере Leaflet
    const container = map.getContainer();
    container.style.pointerEvents = 'none';
    container.style.userSelect = 'none';
    container.style.touchAction = 'none';

    // Центрируем карту
    try {
      const bounds = L.latLngBounds(field.boundary);
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      map.setView([55.7558, 37.6173], 15);
    }

    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Добавляем границы поля
    L.polygon(field.boundary, {
      color: '#66d771',
      weight: 3,
      fillColor: '#2b8d35',
      fillOpacity: 0.1,
      opacity: 0.8,
    }).addTo(map);

    mapInstance.current = map;

    // Генерируем квадраты
    const zones = generateZones();
    setFieldZones(zones);
    
    toast.success(`Карта загружена. Квадратов: ${zones.length}`);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [field.boundary, field.id]);

  // Рисуем Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры Canvas
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Очищаем Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Применяем трансформации
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Рисуем квадраты если они есть
    if (fieldZones.length > 0 && !showCulture) {
      fieldZones.forEach((zone) => {
        let color: string;
        let label: string;
        
        if (showFertilizer) {
          color = getFertilizerColor(zone.nitrogenRate);
          label = `${zone.nitrogenRate}`;
        } else if (showVegetation) {
          const value = getIndexValue(zone);
          color = getIndexColor(value, selectedIndex);
          label = `${value.toFixed(2)}`;
        } else {
          return;
        }
        
        // Рисуем квадрат
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(zone.positions[0].x, zone.positions[0].y);
        zone.positions.forEach((pos) => {
          ctx.lineTo(pos.x, pos.y);
        });
        ctx.closePath();
        ctx.fill();

        // Обводка
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();

        // Подпись внутри квадрата
        if (zoom > 1.2) {
          const centerX = zone.positions.reduce((sum, pos) => sum + pos.x, 0) / zone.positions.length;
          const centerY = zone.positions.reduce((sum, pos) => sum + pos.y, 0) / zone.positions.length;
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#000000';
          ctx.font = `${10 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, centerX, centerY);
        }
      });
    }

    // Если слой культуры
    if (showCulture && fieldZones.length > 0) {
      const minX = Math.min(...fieldZones.flatMap(z => z.positions.map(p => p.x)));
      const maxX = Math.max(...fieldZones.flatMap(z => z.positions.map(p => p.x)));
      const minY = Math.min(...fieldZones.flatMap(z => z.positions.map(p => p.y)));
      const maxY = Math.max(...fieldZones.flatMap(z => z.positions.map(p => p.y)));
      
      ctx.fillStyle = '#66d771';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#2b8d35';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      const centerX = minX + (maxX - minX) / 2;
      const centerY = minY + (maxY - minY) / 2;
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = `${32 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(field.cropType, centerX, centerY);
    }

    ctx.restore();
    
  }, [fieldZones, zoom, panOffset, showVegetation, showFertilizer, showCulture, selectedIndex]);

  const handleUpdateData = async () => {
    setIsUpdating(true);
    setTimeout(() => {
      const zones = generateZones();
      setFieldZones(zones);
      setIsUpdating(false);
      toast.success('Данные квадратов обновлены');
    }, 2000);
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    for (const zone of fieldZones) {
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.beginPath();
      ctx.moveTo(zone.positions[0].x, zone.positions[0].y);
      zone.positions.forEach((pos) => {
        ctx.lineTo(pos.x, pos.y);
      });
      ctx.closePath();

      if (ctx.isPointInPath(x, y)) {
        setSelectedZone(zone);
        return;
      }
    }

    setSelectedZone(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  if (!field.boundary || field.boundary.length < 3) {
    return (
      <div className="relative h-full bg-[#131613] flex items-center justify-center">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-96">
          <CardContent className="p-6">
            <h2 className="text-white text-xl mb-4">Ошибка</h2>
            <p className="text-[#b2b3b2] mb-4">
              У поля "{field.name}" нет определенных границ.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-[#131613]">
      {/* Leaflet карта (ТОЛЬКО ФОН) */}
      <div 
        ref={mapContainerRef}
        className="absolute inset-0 z-0 leaflet-container-blocked"
        style={{ 
          height: '100%', 
          width: '100%',
        }}
      />

      {/* Canvas (ОСНОВНОЕ ВЗАИМОДЕЙСТВИЕ) */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10 canvas-active"
        style={{
          display: 'block',
          background: 'transparent',
          pointerEvents: 'auto',
          border: '2px solid red', // ВРЕМЕННО: чтобы видеть границы
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.deltaY < 0) handleZoomIn();
          else handleZoomOut();
        }}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex gap-0 z-20">
        <Button
          onClick={handleZoomIn}
          className="bg-[rgba(12,14,12,0.9)] hover:bg-[rgba(12,14,12,0.95)] text-[#b2b3b2] hover:text-white rounded-r-none border border-[#2b8d35]/20 size-[60px] p-0"
        >
          <Plus className="size-[30px]" />
        </Button>
        <Button
          onClick={handleZoomOut}
          className="bg-[rgba(12,14,12,0.9)] hover:bg-[rgba(12,14,12,0.95)] text-[#b2b3b2] hover:text-white rounded-l-none border border-[#2b8d35]/20 size-[60px] p-0"
        >
          <Minus className="size-[30px]" />
        </Button>
      </div>

      {/* Добавим глобальные стили для блокировки Leaflet */}
      <style jsx global>{`
        .leaflet-container-blocked,
        .leaflet-container-blocked * {
          pointer-events: none !important;
          user-select: none !important;
          touch-action: none !important;
        }
        
        .canvas-active {
          pointer-events: auto !important;
        }
      `}</style>

      {/* Остальной UI (панели, кнопки и т.д.) */}
      <div className="absolute left-5 top-5 z-20">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[240px]">
          <CardContent className="p-6">
            <h3 className="text-white mb-4">Управление</h3>
            <Button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
            >
              {isUpdating ? 'Обновление...' : 'Обновить данные'}
            </Button>
            <div className="mt-4 text-white">
              Квадратов: {fieldZones.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}