'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the InteractiveMap to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#131613]">
      <div className="text-[#66d771] text-xl">Загрузка карты...</div>
    </div>
  ),
});

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
}

interface MapViewWrapperProps {
  field: Field;
}

export default function MapViewWrapper({ field }: MapViewWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[#131613]">
        <div className="text-[#66d771] text-xl">Загрузка карты...</div>
      </div>
    );
  }

  return <InteractiveMap field={field} />;
}
