import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import Dashboard from '@/pages/Dashboard';
import Carteira from '@/pages/Carteira';
import Simulador from '@/pages/Simulador';
import Analise from '@/pages/Analise';
import Alertas from '@/pages/Alertas';
import Configuracoes from '@/pages/Configuracoes';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import DetalhesAtivo from '@/pages/DetalhesAtivo';
import RelatorioInvestidores from '@/pages/RelatorioInvestidores'; // <--- IMPORT NOVO
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertScheduler } from '@/services/AlertScheduler';
import { YieldScheduler } from '@/services/YieldScheduler';
import AlertNotification from '@/components/alertas/AlertNotification';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  return user ? children : <Navigate to={ROUTES.LOGIN} />;
};

const AuthLayout = ({ children }) => {
  const { user, loading } = useAuth();
   if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  return !user ? children : <Navigate to={ROUTES.DASHBOARD} />;
};

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 pb-20 md:pb-0 transition-all duration-300">
        <Header />
        <main className="p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    AlertScheduler.init();
    YieldScheduler.init();
    return () => {
      AlertScheduler.stop();
      YieldScheduler.stop();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<AuthLayout><Login /></AuthLayout>} />
        <Route path={ROUTES.REGISTER} element={<AuthLayout><Register /></AuthLayout>} />
        
        <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path={ROUTES.CARTEIRA} element={<ProtectedRoute><AppLayout><Carteira /></AppLayout></ProtectedRoute>} />
        <Route path={ROUTES.SIMULADOR} element={<ProtectedRoute><AppLayout><Simulador /></AppLayout></ProtectedRoute>} />
        <Route path={ROUTES.ANALISE} element={<ProtectedRoute><AppLayout><Analise /></AppLayout></ProtectedRoute>} />
        <Route path={ROUTES.ALERTAS} element={<ProtectedRoute><AppLayout><Alertas /></AppLayout></ProtectedRoute>} />
        <Route path={ROUTES.CONFIGURACOES} element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />
        
        <Route path="/ativo/:ticker" element={<ProtectedRoute><AppLayout><DetalhesAtivo /></AppLayout></ProtectedRoute>} />
        
        {/* --- ROTA NOVA --- */}
        <Route path="/investidores" element={<ProtectedRoute><AppLayout><RelatorioInvestidores /></AppLayout></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AlertNotification />
    </Router>
  );
}

export default App;