import { useState, useEffect, useRef } from 'react';
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
  // Fertilizer recommendations
  nitrogenRate: number; // kg/ha
  phosphorusRate: number; // kg/ha
  potassiumRate: number; // kg/ha
  recommendation: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
}

interface InteractiveMapProps {
  field: Field;
}

// Function to calculate fertilizer recommendation based on NDVI
function calculateFertilizerRecommendation(ndvi: number): {
  nitrogenRate: number;
  phosphorusRate: number;
  potassiumRate: number;
  recommendation: string;
} {
  // Lower NDVI = more nitrogen needed, higher NDVI = less nitrogen needed
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

// Function to generate grid-based field zones (simulating Landsat 8-9 30m pixels)
function generateLandsatGrid(): FieldZone[] {
  const zones: FieldZone[] = [];
  
  // Landsat pixel size (30m x 30m represented in canvas pixels)
  const pixelSize = 40; // canvas pixels per Landsat pixel
  
  // Grid dimensions (create a field area)
  const gridCols = 15; // 15 pixels wide
  const gridRows = 10; // 10 pixels tall
  
  // Starting position (centered in canvas)
  const startX = 200;
  const startY = 100;
  
  const healthStates = [
    'Отличное состояние',
    'Хорошее состояние',
    'Умеренное состояние',
    'Слабое состояние',
  ];

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const x = startX + col * pixelSize;
      const y = startY + row * pixelSize;
      
      // Generate random NDVI value with some spatial correlation
      const baseNdvi = Math.random() * 0.7 + 0.2; // 0.2 to 0.9
      const ndvi = Math.min(0.95, Math.max(0.15, baseNdvi));
      
      // Calculate fertilizer recommendations based on NDVI
      const fertilizerRec = calculateFertilizerRecommendation(ndvi);
      
      zones.push({
        id: `zone-${row}-${col}`,
        positions: [
          { x: x, y: y },
          { x: x + pixelSize, y: y },
          { x: x + pixelSize, y: y + pixelSize },
          { x: x, y: y + pixelSize },
        ],
        ndvi: ndvi,
        ndre: ndvi * 0.85,
        pri: ndvi * 0.75,
        area: 0.09, // 30m x 30m = 900m² = 0.09 hectares
        health: healthStates[Math.min(Math.floor(ndvi / 0.25), 3)],
        ...fertilizerRec,
      });
    }
  }
  
  return zones;
}

// Function to get color based on index value
function getIndexColor(value: number, indexType: IndexType): string {
  if (indexType === 'ndvi' || indexType === 'ndvi-avg') {
    if (value >= 0.8) return '#289f34'; // Отличное - темно-зеленый
    if (value >= 0.6) return '#66d771'; // Хорошее - зеленый
    if (value >= 0.4) return '#eeff06'; // Умеренное - желтый
    if (value >= 0.2) return '#f1b650'; // Слабое - оранжевый
    return '#f23939'; // Очень слабое - красный
  }
  // Similar logic for other indices
  if (value >= 0.6) return '#289f34';
  if (value >= 0.4) return '#66d771';
  if (value >= 0.25) return '#eeff06';
  if (value >= 0.15) return '#f1b650';
  return '#f23939';
}

// Function to get color based on fertilizer rate (nitrogen)
function getFertilizerColor(nitrogenRate: number): string {
  if (nitrogenRate >= 120) return '#ff6b6b'; // Very high - red
  if (nitrogenRate >= 90) return '#ffa500'; // High - orange
  if (nitrogenRate >= 60) return '#ffd700'; // Medium - gold
  return '#90ee90'; // Low - light green
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
  const [fieldBoundaries, setFieldBoundaries] = useState<FieldZone[]>(generateLandsatGrid());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpdateData = async () => {
    setIsUpdating(true);
    setTimeout(() => {
      // Generate new Landsat grid with updated values
      setFieldBoundaries(generateLandsatGrid());
      setIsUpdating(false);
      toast.success('Данные успешно обновлены', {
        description: 'Получены последние спутниковые снимки',
      });
    }, 2000);
  };

  const handleExportData = () => {
    toast.success('Данные экспортированы', {
      description: `Карта ${selectedIndex.toUpperCase()} сохранена в формате GeoTIFF`,
    });
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
    const sum = fieldBoundaries.reduce((acc, zone) => acc + getIndexValue(zone), 0);
    return (sum / fieldBoundaries.length).toFixed(2);
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

  // Draw the map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw simple dark green field background pattern
    // Base color
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle texture with random darker patches (simulating field variation)
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 100 + 50;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(15, 30, 15, 0.3)');
      gradient.addColorStop(1, 'rgba(15, 30, 15, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw subtle grid lines (representing Landsat pixel boundaries)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5 / zoom;
    const pixelSize = 40;
    const startX = 200;
    const startY = 100;
    const gridCols = 15;
    const gridRows = 10;
    
    // Vertical lines
    for (let i = 0; i <= gridCols; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * pixelSize, startY);
      ctx.lineTo(startX + i * pixelSize, startY + gridRows * pixelSize);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridRows; i++) {
      ctx.beginPath();
      ctx.moveTo(startX, startY + i * pixelSize);
      ctx.lineTo(startX + gridCols * pixelSize, startY + i * pixelSize);
      ctx.stroke();
    }

    // If culture layer is selected, fill entire field with one color and display crop name
    if (showCulture) {
      // Draw filled rectangle covering entire field area
      const fieldX = startX;
      const fieldY = startY;
      const fieldWidth = gridCols * pixelSize;
      const fieldHeight = gridRows * pixelSize;
      
      ctx.fillStyle = '#66d771';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);
      
      // Draw border
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#2b8d35';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);
      
      // Display crop type name in center
      const centerX = fieldX + fieldWidth / 2;
      const centerY = fieldY + fieldHeight / 2;
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = `${32 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(field.cropType, centerX, centerY);
    }

    // Draw field zones based on selected layer (if not culture layer)
    if (!showCulture) {
      fieldBoundaries.forEach((zone) => {
        let color: string;
        let label: string;
        
        if (showFertilizer) {
          // Show fertilizer recommendations
          color = getFertilizerColor(zone.nitrogenRate);
          label = `${zone.nitrogenRate}`;
        } else if (showVegetation) {
          // Show vegetation index
          color = getIndexColor(getIndexValue(zone), selectedIndex);
          label = `${getIndexValue(zone).toFixed(2)}`;
        } else {
          return; // Don't draw if no layer is selected
        }
        
        // Fill zone
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(zone.positions[0].x, zone.positions[0].y);
        zone.positions.forEach((pos) => {
          ctx.lineTo(pos.x, pos.y);
        });
        ctx.closePath();
        ctx.fill();

        // Draw border (subtle)
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();

        // Draw zone label (only if zoomed in enough)
        if (zoom > 1.5) {
          const centerX = zone.positions.reduce((sum, pos) => sum + pos.x, 0) / zone.positions.length;
          const centerY = zone.positions.reduce((sum, pos) => sum + pos.y, 0) / zone.positions.length;
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#ffffff';
          ctx.font = `${10 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, centerX, centerY);
        }
      });
    }

    ctx.restore();
  }, [selectedIndex, zoom, panOffset, fieldBoundaries, showVegetation, showFertilizer, showCulture, field.cropType]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    // Check if click is inside any zone
    for (const zone of fieldBoundaries) {
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
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  return (
    <div className="relative h-full bg-[#131613]">
      {/* Map Canvas */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex gap-0 z-[1000]">
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

      {/* Left Sidebar */}
      <div className="absolute left-5 top-5 flex flex-col gap-5 z-[1000]">
        {/* Layer Control Panel */}
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[240px]">
          <CardContent className="p-0">
            {/* Header */}
            <div
              className="flex items-center gap-5 px-5 py-[15px] cursor-pointer"
              onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            >
              <Layers className="size-[30px] text-[#66d771]" />
              <p className="text-[#66d771] text-[20px] font-medium">Слои карты</p>
            </div>

            {/* Layer Options */}
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
                  className={`px-[25px] py-[10px] text-left text-[20px] transition-colors ${
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
                  className={`px-[25px] py-[10px] text-left text-[20px] transition-colors ${
                    showVegetation
                      ? 'bg-[#2b8d35] text-[rgba(12,14,12,0.9)]'
                      : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                  }`}
                >
                  Растительность
                </button>
                <button
                  className="bg-[#131613] border border-[#1d201d] px-[25px] py-[10px] text-left text-white text-[20px] hover:bg-[#1d201d] transition-colors"
                  onClick={() => {
                    /* Moisture layer toggle */
                  }}
                >
                  Влажность
                </button>
                <button
                  onClick={() => {
                    setShowFertilizer(!showFertilizer);
                    if (!showFertilizer) {
                      setShowVegetation(false);
                      setShowCulture(false);
                    }
                  }}
                  className={`px-[25px] py-[10px] text-left text-[21px] transition-colors ${
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

        {/* Vegetation Index Submenu - Only show when layerMenuOpen is true and vegetation is shown */}
        {layerMenuOpen && showVegetation && (selectedIndex === 'ndvi' || selectedIndex === 'ndvi-avg' || selectedIndex === 'ndre' || selectedIndex === 'pri') && (
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[220px] ml-[249px] -mt-[280px]">
            <CardContent className="p-0 flex flex-col">
              <button
                onClick={() => setSelectedIndex('ndvi')}
                className={`px-[25px] py-[10px] text-left text-[20px] transition-colors ${
                  selectedIndex === 'ndvi'
                    ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                    : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                }`}
              >
                NDVI
              </button>
              <button
                onClick={() => setSelectedIndex('ndvi-avg')}
                className={`px-[25px] py-[10px] text-left text-[20px] transition-colors ${
                  selectedIndex === 'ndvi-avg'
                    ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                    : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                }`}
              >
                Средний NDVI
              </button>
              <button
                onClick={() => setSelectedIndex('ndre')}
                className={`px-[25px] py-[10px] text-left text-[20px] transition-colors ${
                  selectedIndex === 'ndre'
                    ? 'bg-[#66d771] text-[rgba(12,14,12,0.9)]'
                    : 'bg-[#131613] border border-[#1d201d] text-white hover:bg-[#1d201d]'
                }`}
              >
                NDRE
              </button>
              <button
                onClick={() => setSelectedIndex('pri')}
                className={`px-[25px] py-[10px] text-left text-[21px] transition-colors ${
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

      {/* NDVI Legend - Bottom left (show for vegetation layer) */}
      {showVegetation && (
        <div className="absolute left-5 bottom-5 z-[1000]">
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-fit">
            <CardContent className="flex gap-3 items-center p-3">
              <div
                className="h-[120px] w-4 rounded-[8px]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgb(40, 159, 52) 0%, rgb(102, 215, 113) 17.308%, rgb(238, 255, 6) 46.635%, rgb(241, 182, 80) 68.75%, rgb(242, 57, 57) 88.462%, rgb(158, 18, 18) 99.99%)',
                }}
              />
              <div className="flex flex-col justify-between h-[120px] text-white text-[16px]">
                <p>1.0</p>
                <p>0.0</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fertilizer Legend - Bottom left (show for fertilizer layer) */}
      {showFertilizer && (
        <div className="absolute left-5 bottom-5 z-[1000]">
          <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-fit">
            <CardContent className="p-3">
              <p className="text-white text-[14px] mb-2">Норма азота (N), кг/га</p>
              <div className="flex gap-3 items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#90ee90' }} />
                    <span className="text-white text-[12px]">40-60</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffd700' }} />
                    <span className="text-white text-[12px]">60-90</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffa500' }} />
                    <span className="text-white text-[12px]">90-120</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff6b6b' }} />
                    <span className="text-white text-[12px]">120+</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute top-[30px] right-[20px] z-[1000]">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20 w-[300px]">
          <CardContent className="p-0 flex items-center gap-[10px] px-[10px] py-[10px]">
            <Search className="size-[30.5px] text-[#b2b3b2]" />
            <input
              type="text"
              placeholder="Поиск"
              className="bg-transparent border-none outline-none text-[#b2b3b2] text-[20px] w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Field Info Panel - Top Right */}
      <div className="absolute top-[110px] right-[20px] w-80 space-y-4 z-[1000]">
        <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-white text-xl mb-4">{field.name}</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2]">Культура:</span>
                <span className="text-white">{field.cropType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2]">Площадь:</span>
                <span className="text-white">{field.area} га</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2]">{getIndexName(selectedIndex)}:</span>
                <span className="text-[#66d771]">{calculateAverageIndex()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2]">Последнее обновление:</span>
                <span className="text-white text-sm">{field.lastUpdate}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                onClick={handleUpdateData}
                disabled={isUpdating}
                className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
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
                className="w-full border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
              >
                <Download className="size-4 mr-2" />
                Экспортировать карту
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedZone && (
          <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-[#66d771] shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-white text-sm mb-2 font-medium">{selectedZone.health}</p>
                  
                  {showVegetation && (
                    <div className="mb-2">
                      <p className="text-[#b2b3b2] text-xs mb-1">Индексы растительности:</p>
                      <ul className="text-[#b2b3b2] text-xs space-y-1">
                        <li>NDVI: {selectedZone.ndvi.toFixed(2)}</li>
                        <li>NDRE: {selectedZone.ndre.toFixed(2)}</li>
                        <li>PRI: {selectedZone.pri.toFixed(2)}</li>
                      </ul>
                    </div>
                  )}
                  
                  {showFertilizer && (
                    <div className="mb-2">
                      <p className="text-[#b2b3b2] text-xs mb-1">Рекомендации по удобрениям:</p>
                      <ul className="text-[#b2b3b2] text-xs space-y-1">
                        <li>Азот (N): {selectedZone.nitrogenRate} кг/га</li>
                        <li>Фосфор (P): {selectedZone.phosphorusRate} кг/га</li>
                        <li>Калий (K): {selectedZone.potassiumRate} кг/га</li>
                        <li className="text-[#66d771]">{selectedZone.recommendation}</li>
                      </ul>
                    </div>
                  )}
                  
                  <ul className="text-[#b2b3b2] text-xs space-y-1">
                    <li>Площадь: {selectedZone.area} га</li>
                    <li>Пиксель: {selectedZone.id}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-[rgba(12,14,12,0.95)] border-[#2b8d35]/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-[#66d771] shrink-0 mt-0.5" />
              <div>
                {showVegetation && (
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
                )}
                {showFertilizer && (
                  <>
                    <p className="text-white text-sm mb-1">
                      О картах удобрений
                    </p>
                    <ul className="text-[#b2b3b2] text-xs space-y-1">
                      <li>Норма рассчитана на основе NDVI</li>
                      <li>Низкий NDVI = больше удобрений</li>
                      <li>Высокий NDVI = меньше удобрений</li>
                      <li>Дифференцированное внесение</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Display at bottom */}
      <div className="absolute bottom-[21px] left-1/2 -translate-x-1/2 z-[1000]">
        <Card className="bg-[rgba(12,14,12,0.9)] border-[#2b8d35]/20">
          <CardContent className="px-[19px] py-[8px]">
            <p className="text-white text-[20px] text-center whitespace-nowrap">
              Площадь: {field.area} га. | Разрешение: Landsat 8-9 (30м)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}