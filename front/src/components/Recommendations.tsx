import { useState } from 'react';
import { Download, AlertCircle, TrendingUp, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { toast } from 'sonner@2.0.3';

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  ndvi: number;
}

interface RecommendationsProps {
  field: Field;
}

export default function Recommendations({ field }: RecommendationsProps) {
  const [targetYield, setTargetYield] = useState(50);
  const [fertilizerType, setFertilizerType] = useState('NPK');
  const [applicationMethod, setApplicationMethod] = useState('variable');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Mock recommendations data
  const zones = [
    { id: 1, name: 'Зона 1', area: 3.5, rate: 180, color: '#289F34' },
    { id: 2, name: 'Зона 2', area: 5.2, rate: 220, color: '#66D771' },
    { id: 3, name: 'Зона 3', area: 2.1, rate: 280, color: '#EEFF06' },
    { id: 4, name: 'Зона 4', area: 1.2, rate: 320, color: '#F13939' },
  ];

  const handleGenerateMap = async () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      toast.success('Карта удобрений создана', {
        description: 'Готова к экспорту для бортового компьютера',
      });
    }, 2000);
  };

  const handleExport = (format: string) => {
    toast.success(`Экспорт в формате ${format}`, {
      description: 'Файл готов к загрузке в оборудование',
    });
  };

  const totalFertilizer = zones.reduce((sum, zone) => sum + (zone.area * zone.rate), 0);
  const averageRate = totalFertilizer / field.area;
  const uniformRate = 250; // Example uniform application rate
  const savings = (uniformRate * field.area) - totalFertilizer;
  const savingsPercent = (savings / (uniformRate * field.area)) * 100;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-white text-3xl mb-2">Рекомендации по удобрениям</h1>
          <p className="text-[#b2b3b2]">
            {field.name} • {field.cropType} • {field.area} га
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="size-5" />
                  Параметры расчёта
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="target-yield" className="text-[#b2b3b2]">
                    Целевая урожайность (ц/га)
                  </Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="target-yield"
                      value={[targetYield]}
                      onValueChange={(value) => setTargetYield(value[0])}
                      min={20}
                      max={80}
                      step={5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={targetYield}
                      onChange={(e) => setTargetYield(Number(e.target.value))}
                      className="w-20 bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fertilizer-type" className="text-[#b2b3b2]">
                    Тип удобрения
                  </Label>
                  <Select value={fertilizerType} onValueChange={setFertilizerType}>
                    <SelectTrigger className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131613] border-[#2b8d35]/20">
                      <SelectItem value="NPK">NPK комплекс</SelectItem>
                      <SelectItem value="nitrogen">Азотные</SelectItem>
                      <SelectItem value="phosphorus">Фосфорные</SelectItem>
                      <SelectItem value="potassium">Калийные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="application-method" className="text-[#b2b3b2]">
                    Метод внесения
                  </Label>
                  <Select value={applicationMethod} onValueChange={setApplicationMethod}>
                    <SelectTrigger className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131613] border-[#2b8d35]/20">
                      <SelectItem value="variable">Переменное внесение</SelectItem>
                      <SelectItem value="uniform">Равномерное внесение</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateMap}
                  disabled={isGenerating}
                  className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                >
                  {isGenerating ? 'Генерация...' : 'Создать карту удобрений'}
                </Button>
              </CardContent>
            </Card>

            {hasGenerated && (
              <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="size-5" />
                    Экспорт карты
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleExport('Shapefile')}
                    variant="outline"
                    className="w-full border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
                  >
                    Экспорт в Shapefile (.shp)
                  </Button>
                  <Button
                    onClick={() => handleExport('GeoJSON')}
                    variant="outline"
                    className="w-full border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
                  >
                    Экспорт в GeoJSON (.json)
                  </Button>
                  <Button
                    onClick={() => handleExport('ISO-XML')}
                    variant="outline"
                    className="w-full border-[#2b8d35] text-[#66d771] hover:bg-[#2b8d35]/10"
                  >
                    Экспорт в ISO-XML (ISOBUS)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {hasGenerated && (
              <>
                <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Зоны внесения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {zones.map((zone) => (
                        <div
                          key={zone.id}
                          className="flex items-center justify-between p-3 bg-[#131613] rounded-lg border border-[#2b8d35]/10"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: zone.color }}
                            />
                            <div>
                              <p className="text-white">{zone.name}</p>
                              <p className="text-[#b2b3b2] text-sm">{zone.area} га</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">{zone.rate} кг/га</p>
                            <p className="text-[#b2b3b2] text-sm">
                              {(zone.area * zone.rate).toFixed(0)} кг
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-[#2b8d35]/10 border border-[#2b8d35]/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#b2b3b2]">Всего удобрений:</span>
                        <span className="text-white">{totalFertilizer.toFixed(0)} кг</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#b2b3b2]">Средняя норма:</span>
                        <span className="text-white">{averageRate.toFixed(0)} кг/га</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="size-5 text-[#66d771]" />
                      Экономия и эффективность
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#b2b3b2]">При равномерном внесении:</span>
                        <span className="text-white">
                          {(uniformRate * field.area).toFixed(0)} кг
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#b2b3b2]">При переменном внесении:</span>
                        <span className="text-white">{totalFertilizer.toFixed(0)} кг</span>
                      </div>
                      <div className="border-t border-[#2b8d35]/20 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[#66d771]">Экономия удобрений:</span>
                          <span className="text-[#66d771]">
                            {savings.toFixed(0)} кг ({savingsPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#66d771]">Экономия средств:</span>
                          <span className="text-[#66d771]">
                            ≈ {(savings * 25).toFixed(0)} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#2b8d35]/10 border-[#2b8d35]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-4 text-[#66d771] shrink-0 mt-0.5" />
                      <p className="text-[#b2b3b2] text-sm">
                        Загрузите файл карты в бортовой компьютер вашей техники перед выездом в поле. 
                        Убедитесь, что система поддерживает выбранный формат файла.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!hasGenerated && (
              <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
                <CardContent className="p-12 text-center">
                  <div className="bg-[#2b8d35]/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Calculator className="size-8 text-[#66d771]" />
                  </div>
                  <h3 className="text-white text-xl mb-2">Создайте карту удобрений</h3>
                  <p className="text-[#b2b3b2]">
                    Настройте параметры слева и нажмите кнопку для генерации карты переменного внесения
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
