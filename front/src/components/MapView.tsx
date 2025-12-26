import { useState } from 'react';
import InteractiveMap from './InteractiveMap';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
}

interface MapViewProps {
  field: Field;
}

export default function MapView({ field }: MapViewProps) {
  return (
    <div className="relative h-full">
      <InteractiveMap field={field} />
    </div>
  );
}