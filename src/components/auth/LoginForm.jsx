import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { toast } from '@/components/ui/use-toast';
import { validateEmail } from '@/utils/validators';

const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    console.log("Attempting to sign in with:", formData.email);
    const { error } = await signIn(formData.email, formData.password);
    setLoading(false);

    if (!error) {
      console.log("Sign in successful for:", formData.email);
      toast({
        title: 'Sucesso!',
        description: 'Login realizado com sucesso. Bem-vindo de volta!',
      });
      navigate(ROUTES.DASHBOARD);
    } else {
      console.error("Sign in error:", error.message);
    }
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha</Label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <Link to="#" onClick={() => toast({ title: 'Funcionalidade em breve!' })} className="text-sm text-green-600 hover:text-green-700">
            Esqueceu sua senha?
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to={ROUTES.REGISTER} className="text-green-600 hover:text-green-700 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;