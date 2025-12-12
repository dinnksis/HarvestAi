import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  Paper,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DrawPolygon = ({ polygonPoints, setPolygonPoints, isDrawing }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        const { lat, lng } = e.latlng;
        setPolygonPoints([...polygonPoints, [lat, lng]]);
      }
    },
  });

  return polygonPoints.length > 0 ? (
    <Polygon
      positions={
        polygonPoints.length >= 3 
          ? [...polygonPoints, polygonPoints[0]]
          : polygonPoints
      }
      color="blue"
      fillColor="blue"
      fillOpacity={0.2}
    />
  ) : null;
};

const Dashboard = () => {
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [manualCoords, setManualCoords] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await axios.get('http://localhost:8000/fields/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFields(response.data);
    } catch (err) {
      console.error('Failed to fetch fields:', err);
      if (err.response?.status === 401) logout();
    }
  };

  const handleAddField = async () => {
    if (!fieldName.trim()) {
      setError('Введите название поля');
      return;
    }

    let boundary;
    
    if (activeTab === 0) {
      if (polygonPoints.length < 3) {
        setError('Выберите минимум 3 точки на карте');
        return;
      }
      boundary = {
        type: "Polygon",
        coordinates: [[
          ...polygonPoints.map(p => [p[1], p[0]]),
          [polygonPoints[0][1], polygonPoints[0][0]]
        ]]
      };
    } else {
      if (!manualCoords.trim()) {
        setError('Введите координаты');
        return;
      }
      
      try {
        const coords = manualCoords.split(',').map(Number);
        if (coords.length !== 4) throw new Error();
        
        const [minLon, minLat, maxLon, maxLat] = coords;
        boundary = {
          type: "Polygon",
          coordinates: [[
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat]
          ]]
        };
      } catch {
        setError('Введите координаты в формате: мин.долгота,мин.широта,макс.долгота,макс.широта');
        return;
      }
    }

    setLoading(true);
    try {
      const area = calculateArea(polygonPoints.length >= 3 ? polygonPoints : [
        [manualCoords.split(',')[1], manualCoords.split(',')[0]],
        [manualCoords.split(',')[3], manualCoords.split(',')[0]],
        [manualCoords.split(',')[3], manualCoords.split(',')[2]],
        [manualCoords.split(',')[1], manualCoords.split(',')[2]],
      ]);

      await axios.post('http://localhost:8000/fields/', {
        name: fieldName,
        boundary,
        area_hectares: area || 10
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setSuccess(`Поле "${fieldName}" успешно добавлено!`);
      setFieldName('');
      setPolygonPoints([]);
      setManualCoords('');
      setError('');
      setIsDrawing(false);
      fetchFields();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении поля');
      console.error('Add field error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateArea = (coords) => {
    if (coords.length < 3) return 0;
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i][1] * coords[j][0];
      area -= coords[j][1] * coords[i][0];
    }
    area = Math.abs(area) / 2.0;
    return Math.round(area * 10000 * 111 * 111 * Math.cos((coords[0][0] || 55) * Math.PI / 180));
  };

  const handleGenerateMap = (fieldId) => {
    navigate(`/fertilizer-map/${fieldId}`);
  };

  const handleClearMap = () => {
    setPolygonPoints([]);
    setIsDrawing(false);
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setPolygonPoints([]);
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      {/* Заголовок и уведомления */}
      <Box sx={{ mb: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              🌾 HarvestAI - Панель управления
            </Typography>
            <Typography color="text.secondary">
              Управляйте вашими полями
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Button variant="outlined" onClick={logout} color="primary">
              Выйти
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
      </Box>

      {/* Основной контент - 2 колонки */}
      <Grid container spacing={3}>
        {/* Левая колонка - Карта и добавление поля */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              🗺️ Добавить новое поле
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Нарисовать на карте" />
                <Tab label="Ввести координаты вручную" />
              </Tabs>
            </Box>

            {activeTab === 0 ? (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant={isDrawing ? "contained" : "outlined"}
                    onClick={handleStartDrawing}
                    size="small"
                    color="primary"
                  >
                    {isDrawing ? 'Рисуем...' : 'Начать рисование'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleStopDrawing}
                    size="small"
                    disabled={!isDrawing}
                  >
                    Завершить
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearMap}
                    size="small"
                  >
                    Очистить
                  </Button>
                  <Chip 
                    label={`Точек: ${polygonPoints.length}`} 
                    color={polygonPoints.length >= 3 ? "success" : "default"}
                    size="small"
                  />
                  {polygonPoints.length >= 3 && (
                    <Chip 
                      label={`Площадь: ~${calculateArea(polygonPoints)} га`} 
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isDrawing 
                    ? "Кликните на карте чтобы добавить точки полигона (минимум 3 точки)"
                    : "Нажмите 'Начать рисование' чтобы добавить поле на карте"}
                </Typography>

                <Paper sx={{ height: 500, width: '100%', mb: 3, overflow: 'hidden' }}>
                  <MapContainer
                    center={[55.7558, 37.6176]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <DrawPolygon 
                      polygonPoints={polygonPoints}
                      setPolygonPoints={setPolygonPoints}
                      isDrawing={isDrawing}
                    />
                  </MapContainer>
                </Paper>

                {polygonPoints.length > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Выбранные точки:
                    </Typography>
                    <Box sx={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {polygonPoints.map((point, index) => (
                        <Chip
                          key={index}
                          label={`${index + 1}: ${point[0].toFixed(4)}, ${point[1].toFixed(4)}`}
                          size="small"
                          onDelete={() => {
                            const newPoints = [...polygonPoints];
                            newPoints.splice(index, 1);
                            setPolygonPoints(newPoints);
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <TextField
                  label="Координаты (мин.долгота, мин.широта, макс.долгота, макс.широта)"
                  fullWidth
                  value={manualCoords}
                  onChange={(e) => setManualCoords(e.target.value)}
                  placeholder="37.0,55.0,37.5,55.5"
                  helperText="Пример: 37.0,55.0,37.5,55.5 (площадь ~25 га)"
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Формат: минимальная долгота, минимальная широта, максимальная долгота, максимальная широта
                </Typography>
              </Box>
            )}

            {/* Форма добавления поля */}
            <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Завершить добавление поля
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Название поля"
                    fullWidth
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    onClick={handleAddField}
                    disabled={loading || !fieldName.trim()}
                    fullWidth
                    size="large"
                  >
                    {loading ? 'Добавление...' : 'Добавить поле'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - Список полей */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ваши поля ({fields.length})
            </Typography>
            
            {fields.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  У вас пока нет полей. Добавьте первое поле используя карту слева.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {fields.map((field) => (
                  <Card key={field.id} sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {field.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Площадь: {field.area_hectares ? `${field.area_hectares} га` : 'не указана'}
                      </Typography>
                      <Chip 
                        label={`ID: ${field.id}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label="Готово к анализу" 
                        size="small" 
                        color="success"
                        variant="outlined"
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleGenerateMap(field.id)}
                        variant="contained"
                        fullWidth
                      >
                        Создать карту удобрений
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;