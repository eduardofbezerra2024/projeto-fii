import React from 'react';
import { Helmet } from 'react-helmet';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  return (
    <>
      <Helmet>
        <title>Login - FII Analyzer</title>
        <meta name="description" content="Entre na sua conta FII Analyzer" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <LoginForm />
      </div>
    </>
  );
};

export default Login;