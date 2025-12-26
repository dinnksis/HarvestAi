import { AlertCircle, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
  status: 'healthy' | 'warning' | 'attention';
  hasRecommendations: boolean;
}

interface FieldsListProps {
  fields: Field[];
  onFieldSelect: (fieldId: string) => void;
  onRequestData: (fieldId: string) => void;
}

export default function FieldsList({ fields, onFieldSelect, onRequestData }: FieldsListProps) {
  const getStatusColor = (status: Field['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-[#2b8d35] text-[#0c0e0c]';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'attention':
        return 'bg-red-600 text-white';
    }
  };

  const getStatusText = (status: Field['status']) => {
    switch (status) {
      case 'healthy':
        return 'Отлично';
      case 'warning':
        return 'Внимание';
      case 'attention':
        return 'Требует проверки';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => (
        <Card key={field.id} className="bg-[#0c0e0c] border-[#2b8d35]/20 hover:border-[#66d771] transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white text-xl mb-1">{field.name}</h3>
                <p className="text-[#b2b3b2] text-sm">{field.cropType}</p>
              </div>
              <Badge className={getStatusColor(field.status)}>
                {getStatusText(field.status)}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2] text-sm">Площадь:</span>
                <span className="text-white">{field.area} га</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2] text-sm">NDVI:</span>
                <span className="text-white">{field.ndvi.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#b2b3b2] text-sm">Обновлено:</span>
                <span className="text-white text-sm">{field.lastUpdate}</span>
              </div>
            </div>

            {field.hasRecommendations && (
              <div className="bg-[#2b8d35]/10 border border-[#2b8d35]/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="size-4 text-[#66d771] shrink-0 mt-0.5" />
                <p className="text-[#66d771] text-sm">
                  Доступны новые рекомендации по удобрениям
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => onFieldSelect(field.id)}
                className="flex-1 bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
              >
                <Eye className="size-4 mr-2" />
                Открыть
              </Button>
              <Button
                onClick={() => onRequestData(field.id)}
                variant="outline"
                className="border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}