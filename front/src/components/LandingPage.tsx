import { CheckCircle, MapPin, TrendingUp, Download, BarChart3, Leaf } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#131613] to-[#1a1d1a]">
      {/* Header */}
      <header className="border-b border-[#2b8d35]/20 bg-[#131613]/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#66d771] p-2 rounded-lg">
              <Leaf className="size-6 text-[#0c0e0c]" />
            </div>
            <span className="text-white text-xl">AgroVision</span>
          </div>
          <nav className="hidden md:flex gap-8 text-[#b2b3b2]">
            <a href="#features" className="hover:text-[#66d771] transition-colors">Возможности</a>
            <a href="#how-it-works" className="hover:text-[#66d771] transition-colors">Как это работает</a>
            <a href="#pricing" className="hover:text-[#66d771] transition-colors">Цены</a>
          </nav>
          <Button onClick={onGetStarted} className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]">
            Начать
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-white text-5xl mb-6">
                Точное земледелие на основе данных
              </h1>
              <p className="text-[#b2b3b2] text-xl mb-8">
                Оптимизируйте внесение удобрений, увеличьте урожайность и снизьте затраты с помощью спутникового мониторинга и аналитики.
              </p>
              <div className="flex gap-4">
                <Button onClick={onGetStarted} size="lg" className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]">
                  Попробовать бесплатно
                </Button>
                <Button size="lg" variant="outline" className="border-[#66d771] text-[#66d771] hover:bg-[#66d771]/10">
                  Узнать больше
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-[#b2b3b2]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-[#66d771]" />
                  <span>14 дней бесплатно</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-[#66d771]" />
                  <span>Без кредитной карты</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#2b8d35]/20">
                <img 
                  src="https://images.unsplash.com/photo-1669830239215-4dca77c47f82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBmaWVsZCUyMGFlcmlhbHxlbnwxfHx8fDE3NjU1NjE3OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Aerial view of agricultural field"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0c0e0c]/40">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-white text-4xl text-center mb-4">Ключевые возможности</h2>
          <p className="text-[#b2b3b2] text-center mb-12 text-lg">
            Всё необходимое для точного земледелия в одной платформе
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <MapPin className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Управление полями</h3>
                <p className="text-[#b2b3b2]">
                  Простое добавление и управление вашими полями с помощью интерактивной карты. Определяйте границы полей и отслеживайте несколько участков.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <Leaf className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Спутниковый мониторинг</h3>
                <p className="text-[#b2b3b2]">
                  Получайте актуальные данные о состоянии растительности через индексы NDVI, NDRE и другие показатели здоровья культур.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <Download className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Карты удобрений</h3>
                <p className="text-[#b2b3b2]">
                  Создавайте карты переменного внесения удобрений, готовые к загрузке в бортовые компьютеры сельхозтехники.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <TrendingUp className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Анализ урожайности</h3>
                <p className="text-[#b2b3b2]">
                  Отслеживайте изменения урожайности по сезонам и измеряйте влияние ваших агрономических решений.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <BarChart3 className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Отчёты и аналитика</h3>
                <p className="text-[#b2b3b2]">
                  Получайте подробные отчёты о производительности, экономии затрат и рентабельности инвестиций по каждому полю.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-6">
                <div className="bg-[#2b8d35]/20 p-3 rounded-lg w-fit mb-4">
                  <CheckCircle className="size-8 text-[#66d771]" />
                </div>
                <h3 className="text-white text-xl mb-3">Простота использования</h3>
                <p className="text-[#b2b3b2]">
                  Интуитивный интерфейс, разработанный для фермеров. Без сложного технического жаргона, только практические рекомендации.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-white text-4xl text-center mb-12">Как это работает</h2>
          <div className="space-y-8">
            {[
              {
                step: 1,
                title: 'Добавьте свои поля',
                description: 'Используйте нашу интерактивную карту, чтобы определить границы ваших полей. Укажите тип культуры и площадь.'
              },
              {
                step: 2,
                title: 'Запросите анализ',
                description: 'Нажмите кнопку, чтобы получить последние спутниковые снимки и индексы вегетации вашего поля.'
              },
              {
                step: 3,
                title: 'Получите рекомендации',
                description: 'Изучите карты здоровья растений и создайте карты переменного внесения удобрений на основе данных.'
              },
              {
                step: 4,
                title: 'Примените в поле',
                description: 'Загрузите файлы карт в бортовой компьютер вашей техники и реализуйте точное внесение.'
              },
              {
                step: 5,
                title: 'Отслеживайте результаты',
                description: 'Оценивайте влияние через отчёты о производительности, экономии удобрений и увеличении урожайности.'
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="bg-[#2b8d35] text-[#0c0e0c] rounded-full size-12 flex items-center justify-center shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-white text-xl mb-2">{item.title}</h3>
                  <p className="text-[#b2b3b2]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[#0c0e0c]/40">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-white text-4xl text-center mb-4">Простые и прозрачные цены</h2>
          <p className="text-[#b2b3b2] text-center mb-12 text-lg">
            Начните с бесплатного пробного периода. Никаких скрытых платежей.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardContent className="p-8">
                <h3 className="text-white text-2xl mb-4">Бесплатно</h3>
                <div className="mb-6">
                  <span className="text-white text-4xl">14</span>
                  <span className="text-[#b2b3b2]">дней</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    До 50 га
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Спутниковые снимки и NDVI
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Базовые карты удобрений
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Email поддержка
                  </li>
                </ul>
                <Button onClick={onGetStarted} className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]">
                  Начать бесплатный пробный период
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#2b8d35]/10 border-[#66d771]">
              <CardContent className="p-8">
                <div className="bg-[#66d771] text-[#0c0e0c] px-3 py-1 rounded-full text-sm w-fit mb-4">
                  Популярный
                </div>
                <h3 className="text-white text-2xl mb-4">Подписка</h3>
                <div className="mb-6">
                  <span className="text-white text-4xl">₽2,500</span>
                  <span className="text-[#b2b3b2]">/месяц</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    До 200 га
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Все индексы (NDVI, NDRE, PRI)
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Расширенные карты удобрений
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Анализ влажности почвы
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Приоритетная поддержка
                  </li>
                  <li className="flex items-center gap-2 text-[#b2b3b2]">
                    <CheckCircle className="size-5 text-[#66d771] shrink-0" />
                    Отчёты по сезонам
                  </li>
                </ul>
                <Button onClick={onGetStarted} className="w-full bg-[#66d771] hover:bg-[#2b8d35] text-[#0c0e0c]">
                  Купить подписку
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-white text-4xl mb-6">Готовы повысить урожайность?</h2>
          <p className="text-[#b2b3b2] text-xl mb-8">
            Присоединяйтесь к сотням фермеров, которые уже оптимизировали свои операции с помощью AgroVision
          </p>
          <Button onClick={onGetStarted} size="lg" className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]">
            Начать бесплатный пробный период
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2b8d35]/20 py-8 px-6">
        <div className="container mx-auto text-center text-[#b2b3b2]">
          <p>© 2024 AgroVision. Точное земледелие на основе данных.</p>
        </div>
      </footer>
    </div>
  );
}
