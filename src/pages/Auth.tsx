
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {isLoginMode ? 'Welcome Back' : 'Join the'} <span className="text-cosmic font-serif">Multiverse</span>
            </h1>
            <p className="text-gray-300 text-lg">
              {isLoginMode 
                ? 'Sign in to continue your creative journey' 
                : 'Start your journey as a Creator today'
              }
            </p>
          </div>

          {isLoginMode ? (
            <LoginForm onToggleMode={() => setIsLoginMode(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsLoginMode(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
