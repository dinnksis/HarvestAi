import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Фикс иконок для leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const FertilizerMap = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldData, setFieldData] = useState(null);
  const [fertilizerData, setFertilizerData] = useState(null);
  const gridSize = 10;
  const [opacity, setOpacity] = useState(65);
  const [zoomLevel, setZoomLevel] = useState(15);

  useEffect(() => {
    fetchFertilizerData();
  }, [fieldId]);

  const fetchFertilizerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching fertilizer data for field:', fieldId);
      
      const response = await axios.get(
        `http://localhost:8000/fields/${fieldId}/fertilizer-map`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Fertilizer data received:', response.data);
      
      const processedData = processDataForGrid(response.data, gridSize);
      setFertilizerData(processedData);
      
      if (response.data.field_name) {
        setFieldData({
          field_name: response.data.field_name,
          field_id: response.data.field_id
        });
      }
      
    } catch (err) {
      console.error('Failed to fetch fertilizer data:', err);
      generateDetailedDemoGrid();
    } finally {
      setLoading(false);
    }
  };

  const processDataForGrid = (data, cellSizeMeters) => {
    if (data.grid_cells && Array.isArray(data.grid_cells)) {
      return {
        ...data,
        grid_size: cellSizeMeters
      };
    }
    
    if (data.fertilizer_map && Array.isArray(data.fertilizer_map)) {
      return createGridFromPoints(data.fertilizer_map, cellSizeMeters, data);
    }
    
    return generateDetailedDemoGrid(cellSizeMeters, data);
  };

  const createGridFromPoints = (points, cellSizeMeters, originalData) => {
    const lats = points.map(p => p.y || p.lat || 0);
    const lngs = points.map(p => p.x || p.lng || 0);
    
    if (lats.length === 0) {
      return generateDetailedDemoGrid(cellSizeMeters, originalData);
    }
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const metersPerDegreeLat = 111000;
    const metersPerDegreeLng = 111000 * Math.cos(centerLat * Math.PI / 180);
    
    const cellSizeLat = cellSizeMeters / metersPerDegreeLat;
    const cellSizeLng = cellSizeMeters / metersPerDegreeLng;
    
    const latSteps = Math.ceil((maxLat - minLat) / cellSizeLat);
    const lngSteps = Math.ceil((maxLng - minLng) / cellSizeLng);
    
    const maxCells = 1000;
    const totalCells = latSteps * lngSteps;
    
    let adjustedCellSizeLat = cellSizeLat;
    let adjustedCellSizeLng = cellSizeLng;
    
    if (totalCells > maxCells * 2) {
      const scaleFactor = Math.sqrt(totalCells / (maxCells * 2));
      adjustedCellSizeLat *= scaleFactor;
      adjustedCellSizeLng *= scaleFactor;
    }
    
    const finalLatSteps = Math.ceil((maxLat - minLat) / adjustedCellSizeLat);
    const finalLngSteps = Math.ceil((maxLng - minLng) / adjustedCellSizeLng);
    
    const gridCells = [];
    
    for (let row = 0; row < finalLatSteps; row++) {
      for (let col = 0; col < finalLngSteps; col++) {
        const lat = minLat + (row * adjustedCellSizeLat);
        const lng = minLng + (col * adjustedCellSizeLng);
        
        const cellPoints = points.filter(p => {
          const pLat = p.y || p.lat || 0;
          const pLng = p.x || p.lng || 0;
          return pLat >= lat && pLat < lat + adjustedCellSizeLat && 
                 pLng >= lng && pLng < lng + adjustedCellSizeLng;
        });
        
        let cellValue = null;
        if (cellPoints.length > 0) {
          cellValue = cellPoints.reduce((sum, p) => sum + (p.value || 0), 0) / cellPoints.length;
        } else {
          const nearestPoints = points
            .map(p => ({
              point: p,
              distance: Math.sqrt(
                Math.pow((p.y || p.lat || 0) - (lat + adjustedCellSizeLat/2), 2) +
                Math.pow((p.x || p.lng || 0) - (lng + adjustedCellSizeLng/2), 2)
              )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);
          
          if (nearestPoints.length > 0) {
            const totalWeight = nearestPoints.reduce((sum, np) => sum + (1 / (np.distance + 0.001)), 0);
            cellValue = nearestPoints.reduce((sum, np) => 
              sum + ((np.point.value || 0) * (1 / (np.distance + 0.001))), 0) / totalWeight;
          }
        }
        
        if (cellValue !== null) {
          const cell = {
            id: `${row}-${col}`,
            coordinates: [
              [lat, lng],
              [lat + adjustedCellSizeLat, lng],
              [lat + adjustedCellSizeLat, lng + adjustedCellSizeLng],
              [lat, lng + adjustedCellSizeLng]
            ],
            value: Math.round(cellValue * 10) / 10,
            center: [lat + adjustedCellSizeLat/2, lng + adjustedCellSizeLng/2],
            points_in_cell: cellPoints.length,
            cell_size_meters: cellSizeMeters
          };
          
          gridCells.push(cell);
        }
      }
    }
    
    return {
      ...originalData,
      grid_cells: gridCells,
      grid_size: cellSizeMeters,
      total_points: points.length,
      total_cells: gridCells.length
    };
  };

  const generateDetailedDemoGrid = (cellSize = gridSize, originalData = null) => {
    console.log('Generating detailed demo grid with cell size:', cellSize);
    
    const baseLat = 55.1558;
    const baseLng = 37.3176;
    
    const cellSizeDeg = cellSize / 111000;
    
    const rows = 40;
    const cols = 40;
    
    const gridCells = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const lat = baseLat + (row * cellSizeDeg);
        const lng = baseLng + (col * cellSizeDeg);
        
        const centerRow = rows / 2;
        const centerCol = cols / 2;
        const distance = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
        );
        
        const baseValue = Math.min(100, (distance / Math.max(centerRow, centerCol)) * 80);
        const randomFactor = (Math.random() - 0.5) * 10;
        const value = Math.max(0, Math.min(100, baseValue + randomFactor));
        
        const cell = {
          id: `${row}-${col}`,
          coordinates: [
            [lat, lng],
            [lat + cellSizeDeg, lng],
            [lat + cellSizeDeg, lng + cellSizeDeg],
            [lat, lng + cellSizeDeg]
          ],
          value: Math.round(value * 10) / 10,
          center: [lat + cellSizeDeg/2, lng + cellSizeDeg/2],
          points_in_cell: Math.floor(Math.random() * 2) + 1,
          cell_size_meters: cellSize
        };
        
        gridCells.push(cell);
      }
    }
    
    return {
      field_name: originalData?.field_name || "Детальная демо-карта",
      field_id: fieldId,
      grid_cells: gridCells,
      grid_size: cellSize,
      total_cells: gridCells.length,
      is_demo: true,
      ...originalData
    };
  };

  const getColor = (value) => {
    if (value === undefined || value === null) return '#cccccc';
    
    const normalizedValue = Math.min(value, 100) / 100;
    
    let hue;
    if (normalizedValue <= 0.5) {
      hue = 120 - (normalizedValue * 120);
    } else {
      hue = 60 - ((normalizedValue - 0.5) * 120);
    }
    
    const saturation = 85 + (normalizedValue * 15);
    const lightness = 50 - (normalizedValue * 10);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getRecommendation = (value) => {
    if (value === undefined || value === null) return 'Нет данных';
    
    if (value <= 20) return 'Минимальное внесение (0-20 кг/га)';
    if (value <= 40) return 'Стандартное внесение (20-40 кг/га)';
    if (value <= 60) return 'Усиленное внесение (40-60 кг/га)';
    return 'Интенсивное внесение (60+ кг/га)';
  };

  const calculateCenter = () => {
    if (!fertilizerData?.grid_cells || fertilizerData.grid_cells.length === 0) {
      return [55.1558, 37.3176];
    }
    
    const firstCell = fertilizerData.grid_cells[0];
    if (firstCell.center) {
      return firstCell.center;
    }
    
    return [55.1558, 37.3176];
  };

  const handleOpacityChange = (event, newValue) => {
    setOpacity(newValue);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 10));
  };

  const calculateStatistics = () => {
    if (!fertilizerData?.grid_cells) return null;
    
    const cells = fertilizerData.grid_cells;
    const values = cells.map(cell => cell.value).filter(v => v != null);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const zones = [
      { name: 'Низкая (0-20)', min: 0, max: 20, color: '#4CAF50' },
      { name: 'Средняя (20-40)', min: 20, max: 40, color: '#FFC107' },
      { name: 'Высокая (40-60)', min: 40, max: 60, color: '#FF9800' },
      { name: 'Очень высокая (60+)', min: 60, max: Infinity, color: '#F44336' },
    ];
    
    zones.forEach(zone => {
      zone.count = values.filter(v => v >= zone.min && v < zone.max).length;
      zone.percentage = Math.round((zone.count / values.length) * 100);
    });
    
    return {
      totalCells: cells.length,
      avg: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      zones
    };
  };

  const stats = calculateStatistics();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Загрузка детальной карты удобрений...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          ← Назад к панели управления
        </Button>
        
        <Typography variant="h4" gutterBottom>
          🗺️ Детальная карта удобрений
        </Typography>
        <Typography color="text.secondary">
          {fieldData?.field_name ? `Поле: "${fieldData.field_name}"` : 'Детальный анализ потребности в удобрениях'}
          {fieldId && ` • ID: ${fieldId}`}
          {fertilizerData?.is_demo && ' • Демо-данные'}
          {fertilizerData?.grid_cells && ` • ${fertilizerData.grid_cells.length} ячеек анализа`}
        </Typography>
        
        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                🔍 Прозрачность зон
              </Typography>
              <Tooltip title="Регулировка видимости цветных зон на карте">
                <Typography 
                  sx={{ 
                    ml: 1, 
                    fontSize: 14, 
                    color: 'text.secondary',
                    cursor: 'help',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ?
                </Typography>
              </Tooltip>
            </Box>
            <Box sx={{ px: 1 }}>
              <Slider
                value={opacity}
                onChange={handleOpacityChange}
                min={30}
                max={100}
                step={5}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                marks={[
                  { value: 30, label: '30%' },
                  { value: 65, label: '65%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Текущая прозрачность: {opacity}%
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                🗺️ Управление картой
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleZoomIn}
                  size="small"
                >
                  Приблизить
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleZoomOut}
                  size="small"
                >
                  Отдалить
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Левая колонка - Карта */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 1000,
              bgcolor: 'background.paper',
              p: 1,
              borderRadius: 1,
              boxShadow: 2
            }}>
              <Typography variant="caption">
                Зум: {zoomLevel} • Ячеек: {fertilizerData?.grid_cells?.length || 0}
              </Typography>
            </Box>
            
            <Box sx={{ height: 600, width: '100%' }}>
              <MapContainer
                center={calculateCenter()}
                zoom={zoomLevel}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {fertilizerData?.grid_cells?.map((cell) => (
                  <Polygon
                    key={cell.id}
                    positions={cell.coordinates}
                    pathOptions={{
                      fillColor: getColor(cell.value),
                      color: '#000',
                      weight: 0.3,
                      fillOpacity: opacity / 100,
                      opacity: 0.8
                    }}
                  >
                    <Popup>
                      <Box sx={{ p: 1.5, minWidth: 220 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary">
                          Зона анализа #{cell.id}
                        </Typography>
                        
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Потребность:
                            </Typography>
                            <Typography variant="h6" sx={{ color: getColor(cell.value) }}>
                              {cell.value !== undefined ? `${cell.value.toFixed(1)} кг/га` : 'Нет данных'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Размер ячейки:
                            </Typography>
                            <Typography variant="body2">
                              {gridSize} метров
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Card variant="outlined" sx={{ mb: 1.5 }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              Рекомендация:
                            </Typography>
                            <Typography variant="body2" color="primary">
                              {getRecommendation(cell.value)}
                            </Typography>
                          </CardContent>
                        </Card>
                        
                        <Typography variant="caption" color="text.secondary" display="block">
                          Координаты центра: 
                          {cell.center?.[0]?.toFixed(6)}, {cell.center?.[1]?.toFixed(6)}
                        </Typography>
                      </Box>
                    </Popup>
                  </Polygon>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - Легенда и кнопки */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* Цветовая шкала */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" paragraph>
                Маленькие квадраты (размером {gridSize} метров) представляют отдельные зоны анализа.
                Цвет каждой зоны указывает на потребность в удобрениях:
              </Typography>
              
              {/* Детальная цветовая шкала */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  height: 25, 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  background: 'linear-gradient(to right, #4CAF50, #8BC34A, #CDDC39, #FFEB3B, #FFC107, #FF9800, #FF5722)',
                  mb: 1,
                  position: 'relative'
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: 0, 
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    px: 0.5
                  }}>
                    {[0, 20, 40, 60, 80, 100].map((value) => (
                      <Typography 
                        key={value}
                        variant="caption" 
                        sx={{ 
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          textShadow: '0 0 2px white'
                        }}
                      >
                        {value}
                      </Typography>
                    ))}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                  кг/га удобрений (зелёный = мало, красный = много)
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                <strong>Наведите курсор на любую зону</strong> для получения подробной информации.
              </Typography>
            </Box>

            {/* Кнопка Обновить данные */}
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                onClick={fetchFertilizerData}
                fullWidth
                size="large"
              >
                Обновить данные
              </Button>
            </Box>

            {/* Статистика анализа */}
            {stats && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📊 Статистика анализа
                </Typography>
                
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Всего зон
                      </Typography>
                      <Typography variant="h5">
                        {stats.totalCells}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Средняя потребность
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {stats.avg} кг/га
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" gutterBottom>
                  Распределение по зонам:
                </Typography>
                
                {stats.zones.map((zone, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1,
                      bgcolor: 'grey.50',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: zone.color, 
                      mr: 2, 
                      borderRadius: 1,
                      border: '1px solid #000'
                    }} />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {zone.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {zone.count} зон ({zone.percentage}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Кнопки действий */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ mb: 1 }}
                onClick={() => {
                  if (fertilizerData) {
                    const dataStr = JSON.stringify(fertilizerData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fertilizer-map-detailed-${fieldId}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                📥 Скачать данные (JSON)
              </Button>
              
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => window.print()}
              >
                🖨️ Распечатать отчет
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Таблица с детальными данными */}
      {fertilizerData?.grid_cells && fertilizerData.grid_cells.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Детальные данные по зонам
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Топ-15 зон с наибольшей потребностью в удобрениях
            </Typography>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID зоны</TableCell>
                    <TableCell>Координаты центра</TableCell>
                    <TableCell>Потребность (кг/га)</TableCell>
                    <TableCell>Рекомендация</TableCell>
                    <TableCell>Цвет зоны</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...fertilizerData.grid_cells]
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 15)
                    .map((cell) => (
                    <TableRow key={cell.id} hover>
                      <TableCell>{cell.id}</TableCell>
                      <TableCell>
                        {cell.center?.[0]?.toFixed(6)}, {cell.center?.[1]?.toFixed(6)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: getColor(cell.value),
                            border: '1px solid #000',
                            borderRadius: 1,
                            mr: 1
                          }} />
                          <strong>{cell.value?.toFixed(1)} кг/га</strong>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getRecommendation(cell.value)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          bgcolor: getColor(cell.value),
                          border: '1px solid #000',
                          borderRadius: 1
                        }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {fertilizerData.grid_cells.length > 15 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Показаны 15 из {fertilizerData.grid_cells.length} зон
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default FertilizerMap;