import React from 'react';
import { Helmet } from 'react-helmet';
import RegisterForm from '@/components/auth/RegisterForm';

const Register = () => {
  return (
    <>
      <Helmet>
        <title>Cadastro - FII Analyzer</title>
        <meta name="description" content="Crie sua conta FII Analyzer" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <RegisterForm />
      </div>
    </>
  );
};

export default Register;