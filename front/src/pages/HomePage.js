import React, { useState, useEffect } from 'react';
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
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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


const DrawPolygon = ({ polygonPoints, setPolygonPoints, isDrawing, isAuthenticated }) => {
  useMapEvents({
    click(e) {
      if (isDrawing && isAuthenticated) {
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

const HomePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [fields, setFields] = useState([]);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const [openAddFieldDialog, setOpenAddFieldDialog] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  useEffect(() => {
    if (user) {
      fetchUserFields();
    } else {
      setFields([]);
    }
  }, [user]);

  const fetchUserFields = async () => {
    try {
      const response = await axios.get('http://localhost:8000/fields/my-fields', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFields(response.data);
    } catch (err) {
      console.log('Ошибка при загрузке полей:', err);
      setFields([]);
    }
  };

  const handleStartDrawing = () => {
    if (!user) {
      setOpenLoginDialog(true);
      return;
    }
    setIsDrawing(true);
    setPolygonPoints([]);
  };

  const handleGenerateMap = (fieldId) => {
    if (!user) {
      setOpenLoginDialog(true);
      return;
    }
    navigate(`/fertilizer-map/${fieldId}`);
  };

  const handleAddFieldClick = () => {
    if (!user) {
      setOpenLoginDialog(true);
      return;
    }
    setOpenAddFieldDialog(true);
  };

  const handleAddField = async () => {
    if (!fieldName.trim() || polygonPoints.length < 3) {
      setError('Введите название поля и выберите минимум 3 точки на карте');
      return;
    }

    setLoading(true);
    try {
      const boundary = {
        type: "Polygon",
        coordinates: [[
          ...polygonPoints.map(p => [p[1], p[0]]),
          [polygonPoints[0][1], polygonPoints[0][0]]
        ]]
      };

      await axios.post('http://localhost:8000/fields/', {
        name: fieldName,
        boundary,
        area_hectares: 10
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setOpenAddFieldDialog(false);
      setFieldName('');
      setPolygonPoints([]);
      setIsDrawing(false);
      setError('');
      fetchUserFields();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении поля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      {/* Шапка */}
      <Box sx={{ mb: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              🌾 HarvestAI - Карта сельскохозяйственных полей
            </Typography>
            <Typography color="text.secondary">
              {user 
                ? `Добро пожаловать, ${user.full_name}!`
                : 'Помогаем малым и средним хозяйствам с расчетом удобрений. Авторизуйтесь для добавления своих полей.'
              }
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            {user ? (
              <>
                <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
                  Личный кабинет
                </Button>
                <Button variant="contained" onClick={handleAddFieldClick}>
                  Добавить поле
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={() => navigate('/login')} sx={{ mr: 2 }}>
                  Войти
                </Button>
                <Button variant="contained" onClick={() => navigate('/register')}>
                  Регистрация
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Основной контент */}
      <Grid container spacing={3}>
        {/* Карта */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🗺️ Карта полей</span>
              {user && (
                <Button
                  variant={isDrawing ? "contained" : "outlined"}
                  onClick={handleStartDrawing}
                  size="small"
                  color="primary"
                >
                  {isDrawing ? 'Рисуем...' : 'Начать рисование поля'}
                </Button>
              )}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user 
                ? (isDrawing 
                    ? "Кликните на карте чтобы добавить точки полигона (минимум 3 точки)"
                    : "Нажмите 'Начать рисование поля' чтобы добавить новое поле")
                : "Авторизуйтесь, чтобы добавлять свои поля на карту"
              }
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
                  isAuthenticated={!!user}
                />
              </MapContainer>
            </Paper>

            {!user && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Для добавления полей на карту необходимо авторизоваться
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Список полей */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ваши поля ({fields.length})
            </Typography>
            
            {fields.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {user 
                    ? 'У вас пока нет полей. Добавьте первое поле на карте.'
                    : 'Авторизуйтесь, чтобы увидеть свои поля'
                  }
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

            {!user && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  Хотите анализировать свои поля?
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/register')}
                  fullWidth
                >
                  Зарегистрироваться
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Диалог входа */}
      <Dialog open={openLoginDialog} onClose={() => setOpenLoginDialog(false)}>
        <DialogTitle>Требуется авторизация</DialogTitle>
        <DialogContent>
          <Typography>
            Для добавления полей и создания карт удобрений необходимо войти в систему
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginDialog(false)}>Отмена</Button>
          <Button 
            onClick={() => navigate('/login')} 
            variant="contained"
          >
            Войти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог добавления поля */}
      <Dialog 
        open={openAddFieldDialog} 
        onClose={() => setOpenAddFieldDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Добавить новое поле</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Название поля"
            fullWidth
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            required
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            На карте выбрано точек: {polygonPoints.length} 
            {polygonPoints.length >= 3 && ' ✓'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddFieldDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleAddField} 
            variant="contained"
            disabled={loading || !fieldName.trim() || polygonPoints.length < 3}
          >
            {loading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HomePage;