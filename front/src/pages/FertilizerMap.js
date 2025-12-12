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
  const [gridSize, setGridSize] = useState(100); // Размер ячейки сетки в метрах
  const [opacity, setOpacity] = useState(0.7); // Прозрачность полигонов

  useEffect(() => {
    fetchFertilizerData();
  }, [fieldId]);

  const fetchFertilizerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching fertilizer data for field:', fieldId);
      
      // Получаем данные удобрений
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
      setFertilizerData(response.data);
      
      // Если в ответе есть данные поля
      if (response.data.field_name) {
        setFieldData({
          field_name: response.data.field_name,
          field_id: response.data.field_id
        });
      }
      
    } catch (err) {
      console.error('Failed to fetch fertilizer data:', err);
      // Если нет реальных данных, создаем демо-данные с зонами
      generateDemoGridData();
    } finally {
      setLoading(false);
    }
  };

  // Функция для генерации демо-данных в виде сетки
  const generateDemoGridData = () => {
    console.log('Generating demo grid data...');
    
    // Создаем сетку 5x5 полигонов
    const gridCells = [];
    const baseLat = 55.7558;
    const baseLng = 37.6176;
    const cellSize = 0.001; // Примерный размер ячейки в градусах
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const lat = baseLat + (row * cellSize);
        const lng = baseLng + (col * cellSize);
        
        // Создаем квадратную ячейку
        const cell = {
          id: `${row}-${col}`,
          coordinates: [
            [lat, lng],
            [lat + cellSize, lng],
            [lat + cellSize, lng + cellSize],
            [lat, lng + cellSize]
          ],
          value: Math.floor(Math.random() * 80), // Случайное значение 0-79
          center: [lat + cellSize/2, lng + cellSize/2]
        };
        
        gridCells.push(cell);
      }
    }
    
    setFertilizerData({
      field_name: "Демо поле",
      field_id: fieldId,
      fertilizer_map: gridCells,
      grid_size: gridSize
    });
    
    setFieldData({
      field_name: "Демо поле",
      field_id: fieldId
    });
  };

  // Функция для определения цвета зоны на основе значения
  const getColor = (value) => {
    if (value === undefined || value === null) return '#cccccc'; // серый для отсутствующих данных
    
    // Градиент от зеленого к красному
    const hue = ((100 - Math.min(value, 100)) * 120) / 100; // 120° (зеленый) -> 0° (красный)
    return `hsl(${hue}, 100%, 50%)`;
  };

  // Функция для получения цветовой шкалы для легенды
  const getColorScale = () => {
    const colors = [];
    for (let i = 0; i <= 100; i += 20) {
      colors.push({
        value: i,
        color: getColor(i)
      });
    }
    return colors;
  };

  // Функция для получения рекомендации
  const getRecommendation = (value) => {
    if (value === undefined || value === null) return 'Нет данных';
    
    if (value <= 20) return 'Минимальное внесение (0-20 кг/га)';
    if (value <= 40) return 'Стандартное внесение (20-40 кг/га)';
    if (value <= 60) return 'Усиленное внесение (40-60 кг/га)';
    return 'Интенсивное внесение (60+ кг/га)';
  };

  // Расчет центра карты
  const calculateCenter = () => {
    if (!fertilizerData?.fertilizer_map || fertilizerData.fertilizer_map.length === 0) {
      return [55.7558, 37.6176]; // Москва по умолчанию
    }
    
    // Используем первый полигон для центра
    const firstCell = fertilizerData.fertilizer_map[0];
    if (firstCell.center) {
      return firstCell.center;
    }
    
    // Или вычисляем из координат
    const coordinates = firstCell.coordinates;
    const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    
    return [avgLat, avgLng];
  };

  // Обработчик изменения размера сетки
  const handleGridSizeChange = (event, newValue) => {
    setGridSize(newValue);
    // Здесь можно добавить логику пересчета сетки
    if (fertilizerData) {
      setFertilizerData({
        ...fertilizerData,
        grid_size: newValue
      });
    }
  };

  // Обработчик изменения прозрачности
  const handleOpacityChange = (event, newValue) => {
    setOpacity(newValue / 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Загрузка карты удобрений...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/dashboard')}>
              Назад
            </Button>
          }
        >
          {error}
        </Alert>
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
          🗺️ Карта удобрений (Зональная карта)
        </Typography>
        <Typography color="text.secondary">
          {fieldData?.field_name ? `Поле: "${fieldData.field_name}"` : 'Анализ потребности в удобрениях'}
          {fieldId && ` (ID: ${fieldId})`}
        </Typography>
      </Box>

      {/* Панель управления */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Размер ячейки сетки: {gridSize} м</Typography>
            <Slider
              value={gridSize}
              onChange={handleGridSizeChange}
              min={50}
              max={200}
              step={10}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Прозрачность зон: {Math.round(opacity * 100)}%</Typography>
            <Slider
              value={opacity * 100}
              onChange={handleOpacityChange}
              min={30}
              max={100}
              step={5}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Левая колонка - Карта */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ height: 600, width: '100%', position: 'relative' }}>
              <MapContainer
                center={calculateCenter()}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Градиентные полигоны (зоны) */}
                {fertilizerData?.fertilizer_map?.map((cell) => (
                  <Polygon
                    key={cell.id}
                    positions={cell.coordinates}
                    pathOptions={{
                      fillColor: getColor(cell.value),
                      color: '#000',
                      weight: 1,
                      fillOpacity: opacity,
                      opacity: 0.8
                    }}
                  >
                    <Popup>
                      <Box sx={{ p: 1, minWidth: 200 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Зона анализа
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {cell.value !== undefined ? `${cell.value} кг/га` : 'Нет данных'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Рекомендация:</strong> {getRecommendation(cell.value)}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          <strong>Размер ячейки:</strong> {gridSize} м
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                          ID: {cell.id}
                        </Typography>
                      </Box>
                    </Popup>
                  </Polygon>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - Легенда и информация */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Градиентная легенда
            </Typography>
            
            {/* Градиентная шкала */}
            <Box sx={{ mb: 3, position: 'relative', height: 30, borderRadius: 1, overflow: 'hidden' }}>
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to right, hsl(120, 100%, 50%), hsl(60, 100%, 50%), hsl(30, 100%, 50%), hsl(0, 100%, 50%))'
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  left: 5, 
                  top: 5, 
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                0 кг/га
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  right: 5, 
                  top: 5, 
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                100+ кг/га
              </Typography>
            </Box>

            {/* Числовая легенда */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Числовая шкала:
              </Typography>
              {getColorScale().map((colorItem, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    bgcolor: colorItem.color, 
                    mr: 2, 
                    border: '1px solid #000',
                    borderRadius: 1
                  }} />
                  <Typography variant="body2">
                    {colorItem.value} кг/га
                  </Typography>
                  <Box sx={{ ml: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      {getRecommendation(colorItem.value)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Статистика */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Статистика анализа
              </Typography>
              
              {fertilizerData?.fertilizer_map && (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Всего зон: {fertilizerData.fertilizer_map.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Размер ячейки: {gridSize} м
                  </Typography>
                  
                  {/* Расчет средней потребности */}
                  {fertilizerData.fertilizer_map.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Средняя потребность:
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {Math.round(
                          fertilizerData.fertilizer_map.reduce((sum, cell) => sum + (cell.value || 0), 0) / 
                          fertilizerData.fertilizer_map.length
                        )} кг/га
                      </Typography>
                    </>
                  )}
                </>
              )}
            </Box>

            {/* Действия */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ mb: 1 }}
                onClick={() => {
                  fetchFertilizerData();
                }}
              >
                Обновить данные
              </Button>
              
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => {
                  // Экспорт данных
                  if (fertilizerData) {
                    const dataStr = JSON.stringify(fertilizerData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = `fertilizer-map-${fieldId}.json`;
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }
                }}
              >
                Экспорт данных
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Таблица с данными */}
      {fertilizerData?.fertilizer_map && fertilizerData.fertilizer_map.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Детальные данные по зонам
            </Typography>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID зоны</TableCell>
                    <TableCell>Центр (широта)</TableCell>
                    <TableCell>Центр (долгота)</TableCell>
                    <TableCell>Удобрений (кг/га)</TableCell>
                    <TableCell>Рекомендация</TableCell>
                    <TableCell>Цвет</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fertilizerData.fertilizer_map.slice(0, 15).map((cell) => (
                    <TableRow key={cell.id}>
                      <TableCell>{cell.id}</TableCell>
                      <TableCell>{cell.center?.[0]?.toFixed(6) || 'N/A'}</TableCell>
                      <TableCell>{cell.center?.[1]?.toFixed(6) || 'N/A'}</TableCell>
                      <TableCell>
                        <strong>{cell.value !== undefined ? `${cell.value} кг/га` : 'N/A'}</strong>
                      </TableCell>
                      <TableCell>{getRecommendation(cell.value)}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          width: 15, 
                          height: 15, 
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
            
            {fertilizerData.fertilizer_map.length > 15 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Показано 15 из {fertilizerData.fertilizer_map.length} зон
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default FertilizerMap;