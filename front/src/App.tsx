import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage onGetStarted={() => setCurrentView('auth')} />
        <Toaster />
      </>
    );
  }

  if (currentView === 'auth') {
    return (
      <>
        <AuthPage onLogin={handleLogin} onBack={() => setCurrentView('landing')} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Dashboard onLogout={handleLogout} />
      <Toaster />
    </>
  );
}