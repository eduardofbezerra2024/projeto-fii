import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calculator, 
  TrendingUp, 
  Bell, 
  Settings 
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
    { icon: Briefcase, label: 'Carteira', path: ROUTES.CARTEIRA },
    { icon: Calculator, label: 'Simulador', path: ROUTES.SIMULADOR },
    { icon: TrendingUp, label: 'Análise', path: ROUTES.ANALISE },
    { icon: Bell, label: 'Alertas', path: ROUTES.ALERTAS },
    { icon: Settings, label: 'Configurações', path: ROUTES.CONFIGURACOES }
  ];
  
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white">FII Analyzer</span>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;