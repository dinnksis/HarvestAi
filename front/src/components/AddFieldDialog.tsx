import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddField: (fieldData: { 
    name: string; 
    cropType: string;
    skipSave?: boolean;
  }) => void;
  onDrawBoundary?: (fieldData: { name: string; cropType: string }) => void;
}

export default function AddFieldDialog({ 
  open, 
  onOpenChange, 
  onAddField,
  onDrawBoundary 
}: AddFieldDialogProps) {
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fieldData = {
      name,
      cropType,
    };
    
    if (onDrawBoundary) {
      onDrawBoundary(fieldData);
    } else {
      onAddField(fieldData);
    }
    
    // Сбрасываем форму
    setName('');
    setCropType('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131613] border-[#2b8d35]/20 text-white">
        <DialogHeader>
          <DialogTitle>Добавить новое поле</DialogTitle>
          <DialogDescription>
            {onDrawBoundary 
              ? "Заполните основную информацию. Площадь будет рассчитана автоматически после выбора границ."
              : "Заполните информацию о вашем поле."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="field-name" className="text-[#b2b3b2]">Название поля</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Поле №1"
              className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="crop-type" className="text-[#b2b3b2]">Тип культуры</Label>
            <Select value={cropType} onValueChange={setCropType} required>
              <SelectTrigger className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white">
                <SelectValue placeholder="Выберите культуру" />
              </SelectTrigger>
              <SelectContent className="bg-[#131613] border-[#2b8d35]/20">
                <SelectItem value="Пшеница">Пшеница</SelectItem>
                <SelectItem value="Кукуруза">Кукуруза</SelectItem>
                <SelectItem value="Соя">Соя</SelectItem>
                <SelectItem value="Подсолнечник">Подсолнечник</SelectItem>
                <SelectItem value="Ячмень">Ячмень</SelectItem>
                <SelectItem value="Рапс">Рапс</SelectItem>
                <SelectItem value="Другое">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-[#2b8d35]/10 border border-[#2b8d35]/20 rounded-lg p-3">
            <p className="text-[#b2b3b2] text-sm">
              {onDrawBoundary
                ? "Площадь будет автоматически рассчитана по границам поля."
                : "Вы сможете указать точные границы поля позже."}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#2b8d35] text-[#66d771]"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
            >
              {onDrawBoundary ? 'Далее: выбрать границы' : 'Добавить поле'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}