import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Calculator, TrendingUp, Bell, Settings } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { path: ROUTES.CARTEIRA, icon: Wallet, label: 'Carteira' },
    { path: ROUTES.SIMULADOR, icon: Calculator, label: 'Simulador' },
    { path: ROUTES.ANALISE, icon: TrendingUp, label: 'Análise' },
    { path: ROUTES.ALERTAS, icon: Bell, label: 'Alertas' },
    { path: ROUTES.CONFIGURACOES, icon: Settings, label: 'Config' },
  ];

  return (
    <>
      {/* --- VERSÃO DESKTOP (Lateral Esquerda) --- */}
      {/* Aparece apenas em telas médias ou maiores (md:flex) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 pt-20 z-40 transition-all duration-300">
        <div className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {/* --- VERSÃO MOBILE (Barra Inferior) --- */}
      {/* Aparece apenas em telas pequenas (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive(item.path)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <item.icon 
                className={`h-6 w-6 transition-all duration-200 ${isActive(item.path) ? 'scale-110' : ''}`} 
                strokeWidth={isActive(item.path) ? 2.5 : 2} 
              />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;