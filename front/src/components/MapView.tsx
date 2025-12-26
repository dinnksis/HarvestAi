import { useState } from 'react';
import InteractiveMap from './InteractiveMap';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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
type PncResponse = {
  lon: number[];
  lat: number[];
  pred: number[];
  cell_size_m?: number;
  meta?: any;
};

export default function MapView({ field, pnc }: { field: Field; pnc: PncResponse | null }) {
  return <InteractiveMap field={field} pnc={pnc} />;
}
