import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/constants';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>Página não encontrada - FII Analyzer</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-green-600 dark:text-green-400">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Página não encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">
            A página que você está procurando não existe.
          </p>
          <Button onClick={() => navigate(ROUTES.DASHBOARD)} className="bg-green-600 hover:bg-green-700">
            <Home className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFound;