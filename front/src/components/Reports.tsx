import { useState } from 'react';
import { TrendingUp, DollarSign, Leaf, BarChart3, Download, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner@2.0.3';

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
}

interface ReportsProps {
  fields: Field[];
}

export default function Reports({ fields }: ReportsProps) {
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);

  // Mock data for charts
  const ndviData = [
    { date: 'Май', field1: 0.45, field2: 0.42, field3: 0.40 },
    { date: 'Июнь', field1: 0.58, field2: 0.55, field3: 0.52 },
    { date: 'Июль', field1: 0.72, field2: 0.68, field3: 0.62 },
    { date: 'Авг', field1: 0.75, field2: 0.72, field3: 0.65 },
    { date: 'Сент', field1: 0.68, field2: 0.65, field3: 0.60 },
  ];

  const yieldData = [
    { name: 'Поле №1', planned: 50, actual: 54, previous: 45 },
    { name: 'Поле №2', planned: 48, actual: 52, previous: 44 },
    { name: 'Поле №3', planned: 45, actual: 47, previous: 42 },
  ];

  const costSavings = [
    { category: 'Удобрения', savings: 125000 },
    { category: 'Топливо', savings: 45000 },
    { category: 'Трудозатраты', savings: 30000 },
    { category: 'Семена', savings: 20000 },
  ];

  const totalSavings = costSavings.reduce((sum, item) => sum + item.savings, 0);
  const totalArea = fields.reduce((sum, field) => sum + field.area, 0);
  const averageYieldIncrease = 8.5; // percentage
  const subscriptionCost = 60000; // annual
  const roi = ((totalSavings - subscriptionCost) / subscriptionCost) * 100;

  const handleExportReport = () => {
    toast.success('Отчёт экспортирован', {
      description: 'Полный отчёт сохранён в формате PDF',
    });
  };

  const handleSubmitFeedback = () => {
    toast.success('Спасибо за отзыв!', {
      description: 'Ваше мнение помогает нам улучшать сервис',
    });
    setShowFeedback(false);
    setRating(0);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-3xl mb-2">Отчёты и аналитика</h1>
            <p className="text-[#b2b3b2]">
              Оценка производительности и экономической эффективности
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-40 bg-[#1a1d1a] border-[#2b8d35]/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#131613] border-[#2b8d35]/20">
                <SelectItem value="2024">Сезон 2024</SelectItem>
                <SelectItem value="2023">Сезон 2023</SelectItem>
                <SelectItem value="2022">Сезон 2022</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportReport}
              className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
            >
              <Download className="size-4 mr-2" />
              Экспорт отчёта
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Leaf className="size-8 text-[#66d771]" />
                <span className="text-[#66d771] text-sm">+{averageYieldIncrease}%</span>
              </div>
              <p className="text-2xl text-white mb-1">53 ц/га</p>
              <p className="text-[#b2b3b2] text-sm">Средняя урожайность</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="size-8 text-[#66d771]" />
                <span className="text-[#66d771] text-sm">Экономия</span>
              </div>
              <p className="text-2xl text-white mb-1">{(totalSavings / 1000).toFixed(0)}K ₽</p>
              <p className="text-[#b2b3b2] text-sm">Снижение затрат</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="size-8 text-[#66d771]" />
                <span className="text-[#66d771] text-sm">ROI</span>
              </div>
              <p className="text-2xl text-white mb-1">{roi.toFixed(0)}%</p>
              <p className="text-[#b2b3b2] text-sm">Рентабельность</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="size-8 text-[#66d771]" />
                <span className="text-[#66d771] text-sm">Всего</span>
              </div>
              <p className="text-2xl text-white mb-1">{totalArea} га</p>
              <p className="text-[#b2b3b2] text-sm">Под управлением</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-[#0c0e0c] border border-[#2b8d35]/20">
            <TabsTrigger value="performance" className="data-[state=active]:bg-[#2b8d35] data-[state=active]:text-white text-[#b2b3b2]">Производительность</TabsTrigger>
            <TabsTrigger value="economics" className="data-[state=active]:bg-[#2b8d35] data-[state=active]:text-white text-[#b2b3b2]">Экономика</TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-[#2b8d35] data-[state=active]:text-white text-[#b2b3b2]">Сравнение</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Динамика NDVI по сезону</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ndviData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b8d35" opacity={0.2} />
                    <XAxis dataKey="date" stroke="#b2b3b2" />
                    <YAxis stroke="#b2b3b2" domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#131613',
                        border: '1px solid #2b8d35',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="field1" stroke="#66d771" name="Поле №1" strokeWidth={2} />
                    <Line type="monotone" dataKey="field2" stroke="#2b8d35" name="Поле №2" strokeWidth={2} />
                    <Line type="monotone" dataKey="field3" stroke="#eeff06" name="Поле №3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Урожайность: План vs Факт</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yieldData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b8d35" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#b2b3b2" />
                    <YAxis stroke="#b2b3b2" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#131613',
                        border: '1px solid #2b8d35',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="previous" fill="#b2b3b2" name="Прошлый сезон" />
                    <Bar dataKey="planned" fill="#2b8d35" name="Плановая" />
                    <Bar dataKey="actual" fill="#66d771" name="Фактическая" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Economics Tab */}
          <TabsContent value="economics" className="space-y-6">
            <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Экономия по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costSavings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b8d35" opacity={0.2} />
                    <XAxis type="number" stroke="#b2b3b2" />
                    <YAxis dataKey="category" type="category" stroke="#b2b3b2" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#131613',
                        border: '1px solid #2b8d35',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `${value.toLocaleString()} ₽`}
                    />
                    <Bar dataKey="savings" fill="#66d771" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
                <CardHeader>
                  <CardTitle className="text-white">Расходы на сервис</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#b2b3b2]">Подписка (год):</span>
                      <span className="text-white">{subscriptionCost.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b2b3b2]">На 1 га:</span>
                      <span className="text-white">
                        {(subscriptionCost / totalArea).toFixed(0)} ₽/га
                      </span>
                    </div>
                    <div className="border-t border-[#2b8d35]/20 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#66d771]">Общая экономия:</span>
                        <span className="text-[#66d771]">{totalSavings.toLocaleString()} ₽</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#66d771]">Чистая прибыль:</span>
                      <span className="text-[#66d771]">
                        {(totalSavings - subscriptionCost).toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2b8d35]/10 border-[#2b8d35]/20">
                <CardHeader>
                  <CardTitle className="text-white">Прогноз на следующий сезон</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#b2b3b2]">Ожидаемая экономия:</span>
                      <span className="text-white">
                        {(totalSavings * 1.15).toFixed(0).toLocaleString()} ₽
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b2b3b2]">Рост урожайности:</span>
                      <span className="text-white">+12%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#b2b3b2]">ROI:</span>
                      <span className="text-white">{((totalSavings * 1.15 - subscriptionCost) / subscriptionCost * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card className="bg-[#0c0e0c] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Сравнение сезонов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b8d35]/20">
                        <th className="text-left text-[#b2b3b2] py-3 px-4">По��азатель</th>
                        <th className="text-right text-[#b2b3b2] py-3 px-4">2022</th>
                        <th className="text-right text-[#b2b3b2] py-3 px-4">2023</th>
                        <th className="text-right text-[#b2b3b2] py-3 px-4">2024</th>
                        <th className="text-right text-[#b2b3b2] py-3 px-4">Изменение</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#2b8d35]/10">
                        <td className="text-white py-3 px-4">Средняя урожайность (ц/га)</td>
                        <td className="text-white text-right py-3 px-4">43</td>
                        <td className="text-white text-right py-3 px-4">47</td>
                        <td className="text-white text-right py-3 px-4">53</td>
                        <td className="text-[#66d771] text-right py-3 px-4">+23%</td>
                      </tr>
                      <tr className="border-b border-[#2b8d35]/10">
                        <td className="text-white py-3 px-4">Расход удобрений (т)</td>
                        <td className="text-white text-right py-3 px-4">15.2</td>
                        <td className="text-white text-right py-3 px-4">14.8</td>
                        <td className="text-white text-right py-3 px-4">12.5</td>
                        <td className="text-[#66d771] text-right py-3 px-4">-18%</td>
                      </tr>
                      <tr className="border-b border-[#2b8d35]/10">
                        <td className="text-white py-3 px-4">Затраты (тыс. ₽)</td>
                        <td className="text-white text-right py-3 px-4">850</td>
                        <td className="text-white text-right py-3 px-4">780</td>
                        <td className="text-white text-right py-3 px-4">630</td>
                        <td className="text-[#66d771] text-right py-3 px-4">-26%</td>
                      </tr>
                      <tr>
                        <td className="text-white py-3 px-4">Средний NDVI (пик сезона)</td>
                        <td className="text-white text-right py-3 px-4">0.65</td>
                        <td className="text-white text-right py-3 px-4">0.68</td>
                        <td className="text-white text-right py-3 px-4">0.75</td>
                        <td className="text-[#66d771] text-right py-3 px-4">+15%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Section */}
        {!showFeedback ? (
          <Card className="bg-[#2b8d35]/10 border-[#66d771] mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white text-xl mb-2">Оцените сезон</h3>
                  <p className="text-[#b2b3b2]">
                    Помогите нам улучшить сервис. Поделитесь своим опытом использования AgroVision
                  </p>
                </div>
                <Button
                  onClick={() => setShowFeedback(true)}
                  className="bg-[#66d771] hover:bg-[#2b8d35] text-[#0c0e0c]"
                >
                  <Star className="size-4 mr-2" />
                  Оставить отзыв
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0c0e0c] border-[#2b8d35]/20 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Оцените ваш опыт</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-[#b2b3b2] mb-3">Насколько вы довольны результатами?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-colors"
                      >
                        <Star
                          className={`size-8 ${
                            star <= rating ? 'fill-[#66d771] text-[#66d771]' : 'text-[#b2b3b2]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0}
                    className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                  >
                    Отправить отзыв
                  </Button>
                  <Button
                    onClick={() => setShowFeedback(false)}
                    variant="outline"
                    className="border-[#2b8d35] text-[#66d771]"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}