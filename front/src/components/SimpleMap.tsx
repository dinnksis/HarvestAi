// src/components/SimpleMap.tsx
import { useEffect, useRef } from 'react';
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

interface SimpleMapProps {
  field: Field;
}

export default function SimpleMap({ field }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Уничтожаем предыдущую карту
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Создаем новую карту
    const center = field.boundary && field.boundary.length > 0 
      ? [field.boundary[0][0], field.boundary[0][1]]
      : [55.7558, 37.6173];
    
    const map = L.map(mapRef.current).setView(center as [number, number], 15);
    mapInstance.current = map;

    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Добавляем границы поля если есть
    if (field.boundary && field.boundary.length >= 3) {
      L.polygon(field.boundary, {
        color: '#66d771',
        weight: 3,
        fillColor: '#2b8d35',
        fillOpacity: 0.2,
      }).addTo(map);
    }

    // Очистка при размонтировании
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [field]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={mapRef} 
        className="absolute inset-0 z-0"
        style={{ height: '100%', width: '100%' }}
      />
      <div className="absolute top-4 left-4 z-[1000] bg-black/70 text-white p-2 rounded">
        Карта поля: {field.name}
      </div>
    </div>
  );
}