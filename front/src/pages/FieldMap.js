import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Компонент для рисования полигонов
function PolygonDrawer({ onPolygonComplete }) {
  const [polygonPoints, setPolygonPoints] = useState([]);
  
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      const newPoint = [lng, lat]; // GeoJSON формат: [lng, lat]
      const newPolygonPoints = [...polygonPoints, newPoint];
      setPolygonPoints(newPolygonPoints);
      
      // Если есть 3 или больше точек, создаем полигон
      if (newPolygonPoints.length >= 3) {
        onPolygonComplete([[...newPolygonPoints, newPolygonPoints[0]]]); // Замыкаем полигон
      }
    },
  });

  return polygonPoints.length > 0 ? (
    <Polygon
      positions={polygonPoints.map(p => [p[1], p[0]])} // Leaflet формат: [lat, lng]
      color="blue"
      fillOpacity={0.2}
    />
  ) : null;
}

const FieldMap = () => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [center, setCenter] = useState([55.7558, 37.6173]); // Москва

  const handlePolygonComplete = (coordinates) => {
    setPolygonCoordinates(coordinates);
    setOpenDialog(true);
  };

  const handleSaveField = () => {
    if (!fieldName || polygonCoordinates.length === 0) {
      alert('Введите название поля и нарисуйте полигон на карте');
      return;
    }

    // Здесь будет запрос к API для сохранения поля
    console.log('Сохранение поля:', {
      name: fieldName,
      boundary: {
        type: "Polygon",
        coordinates: polygonCoordinates
      }
    });

    alert(`Поле "${fieldName}" сохранено!`);
    setOpenDialog(false);
    setFieldName('');
    setPolygonCoordinates([]);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          ← Назад к дашборду
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Карта для добавления полей
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, height: '600px' }}>
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <PolygonDrawer onPolygonComplete={handlePolygonComplete} />
              </MapContainer>
            </Paper>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body1">
                <strong>Инструкция:</strong> Кликайте на карте чтобы нарисовать границы поля. 
                Для завершения полигона кликните на первую точку или добавьте 3+ точек.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Управление картой
                </Typography>
                
                <Typography paragraph>
                  Используйте эту карту для добавления новых полей. Просто кликайте на карте 
                  чтобы нарисовать границы вашего поля.
                </Typography>
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setCenter([55.7558, 37.6173])}
                  sx={{ mb: 1 }}
                >
                  Центрировать на Москве
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setPolygonCoordinates([]);
                    setFieldName('');
                  }}
                >
                  Очистить рисунок
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Сохранение поля</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название поля"
            fullWidth
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Например: Поле №1"
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Координаты полигона: {JSON.stringify(polygonCoordinates)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button onClick={handleSaveField} variant="contained">
            Сохранить поле
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FieldMap;