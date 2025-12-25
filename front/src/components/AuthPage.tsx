import { useState } from 'react';
import { ArrowLeft, Leaf } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';

interface AuthPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AuthPage({ onLogin, onBack }: AuthPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupFarmSize, setSignupFarmSize] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate credentials
    onLogin();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would create an account
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#131613] to-[#1a1d1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 text-[#b2b3b2] hover:text-[#66d771]"
        >
          <ArrowLeft className="size-4 mr-2" />
          Назад на главную
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-[#66d771] p-2 rounded-lg">
            <Leaf className="size-6 text-[#0c0e0c]" />
          </div>
          <span className="text-white text-2xl">AgroVision</span>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#131613]">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="signup">Регистрация</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Добро пожаловать</CardTitle>
                <CardDescription>
                  Войдите в свой аккаунт, чтобы продолжить
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-[#b2b3b2]">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="vasya@example.com"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-[#b2b3b2]">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <label htmlFor="remember" className="text-sm text-[#b2b3b2] cursor-pointer">
                        Запомнить меня
                      </label>
                    </div>
                    <a href="#" className="text-sm text-[#66d771] hover:underline">
                      Забыли пароль?
                    </a>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                  >
                    Войти
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card className="bg-[#131613] border-[#2b8d35]/20">
              <CardHeader>
                <CardTitle className="text-white">Создать аккаунт</CardTitle>
                <CardDescription>
                  14 дней бесплатно. Кредитная карта не требуется.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="text-[#b2b3b2]">Имя и фамилия</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Иван Петров"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="text-[#b2b3b2]">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="ivan@example.com"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone" className="text-[#b2b3b2]">Телефон</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-farm-size" className="text-[#b2b3b2]">
                      Площадь хозяйства (га)
                    </Label>
                    <Input
                      id="signup-farm-size"
                      type="number"
                      value={signupFarmSize}
                      onChange={(e) => setSignupFarmSize(e.target.value)}
                      placeholder="100"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-[#b2b3b2]">Пароль</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1a1d1a] border-[#2b8d35]/20 text-white"
                      required
                    />
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-[#b2b3b2] cursor-pointer">
                      Я принимаю условия использования и политику конфиденциальности. AgroVision не предназначен для сбора персональных данных или конфиденциальной информации.
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
                    disabled={!acceptTerms}
                  >
                    Создать аккаунт
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trust Indicators */}
        <div className="mt-6 text-center text-sm text-[#b2b3b2]">
          <p>Присоединяйтесь к 500+ фермерам, которые уже используют AgroVision</p>
        </div>
      </div>
    </div>
  );
}
