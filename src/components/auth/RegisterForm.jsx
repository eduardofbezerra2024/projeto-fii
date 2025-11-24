import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { toast } from '@/components/ui/use-toast';
import { validateEmail, validatePassword } from '@/utils/validators';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (!validatePassword(formData.password)) {
      toast({
        title: 'Senha Inválida',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro de Validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    console.log("Attempting to sign up with:", formData.email);

    const { error } = await signUp(formData.email, formData.password, {
      data: {
        name: formData.name,
      }
    });
    
    setLoading(false);

    if (!error) {
      console.log("Sign up successful for:", formData.email);
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você já pode fazer o login com suas credenciais.',
      });
      navigate(ROUTES.LOGIN);
    } else {
      console.error("Sign up error:", error.message);
    }
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Comece a analisar seus FIIs</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
            />
          </div>
          
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
          
          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Criar Conta'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <Link to={ROUTES.LOGIN} className="text-green-600 hover:text-green-700 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;