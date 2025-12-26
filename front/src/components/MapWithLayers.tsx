import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  boundary?: [number, number][];
}

interface FertilizerZone {
  id: string;
  coordinates: [number, number][];
  nitrogenRate: number;
  phosphorusRate: number;
  potassiumRate: number;
  recommendation: string;
}

interface MapWithLayersProps {
  field: Field;
  fertilizerZones: FertilizerZone[];
  opacity: number;
  onZoneClick?: (zone: FertilizerZone) => void;
  selectedZoneId?: string | null;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function MapWithLayers({
  field,
  fertilizerZones,
  opacity,
  onZoneClick,
  selectedZoneId
}: MapWithLayersProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(15);

  // Центр карты - центр поля или дефолтный
  const getCenter = (): [number, number] => {
    if (field.boundary && field.boundary.length > 0) {
      const lats = field.boundary.map(c => c[0]);
      const lngs = field.boundary.map(c => c[1]);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2
      ];
    }
    return [55.7558, 37.6173];
  };

  // Цвет для зоны удобрений
  const getZoneColor = (nitrogenRate: number): string => {
    if (nitrogenRate >= 80) return '#ff6b6b';
    if (nitrogenRate >= 60) return '#ffa500';
    if (nitrogenRate >= 40) return '#ffd700';
    if (nitrogenRate >= 20) return '#90ee90';
    return '#4CAF50';
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0 z-0">
        <MapContainer
          center={getCenter()}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="leaflet-container"
          scrollWheelZoom={true}
        >
          <MapController center={getCenter()} zoom={zoom} />
          
          {/* Фоновая карта OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {/* Границы поля */}
          {field.boundary && field.boundary.length >= 3 && (
            <Polygon
              positions={field.boundary}
              pathOptions={{
                color: '#66d771',
                weight: 3,
                fillColor: '#2b8d35',
                fillOpacity: 0.1,
                opacity: 0.8
              }}
            />
          )}
          
          {/* Сетка удобрений */}
          {fertilizerZones.map(zone => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                fillColor: getZoneColor(zone.nitrogenRate),
                color: '#000',
                weight: 0.3,
                fillOpacity: opacity,
                opacity: 0.8
              }}
              eventHandlers={{
                click: () => onZoneClick && onZoneClick(zone),
                mouseover: (e) => {
                  e.target.setStyle({ weight: 1.5 });
                },
                mouseout: (e) => {
                  e.target.setStyle({ weight: 0.3 });
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-bold mb-2">Зона удобрений</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Азот (N):</span>
                      <span className="font-bold">{zone.nitrogenRate} кг/га</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Фосфор (P):</span>
                      <span>{zone.phosphorusRate} кг/га</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Калий (K):</span>
                      <span>{zone.potassiumRate} кг/га</span>
                    </div>
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <p className="text-sm">{zone.recommendation}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}