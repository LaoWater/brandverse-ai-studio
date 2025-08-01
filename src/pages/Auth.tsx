
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { EmailConfirmationUI } from '@/components/auth/EmailConfirmationUI';

const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {showEmailConfirmation ? (
          <EmailConfirmationUI 
            email={signUpEmail}
            onBackToSignIn={() => {
              setShowEmailConfirmation(false);
              setIsLoginMode(true);
            }}
          />
        ) : (
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
              <SignUpForm 
                onToggleMode={() => setIsLoginMode(true)}
                onSignUpSuccess={(email) => {
                  setSignUpEmail(email);
                  setShowEmailConfirmation(true);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
