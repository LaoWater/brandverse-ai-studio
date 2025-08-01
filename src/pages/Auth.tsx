
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { InfluencerSignUpForm } from '@/components/auth/InfluencerSignUpForm';
import { EmailConfirmationUI } from '@/components/auth/EmailConfirmationUI';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isInfluencerMode, setIsInfluencerMode] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsLoginMode(false); // Switch to signup mode when there's a referral
    }
  }, [searchParams]);

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
              setIsInfluencerMode(false);
            }}
          />
        ) : (
          <div className={isInfluencerMode ? "max-w-4xl mx-auto" : "max-w-md mx-auto"}>
            {!isInfluencerMode && (
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
            )}

            {isInfluencerMode ? (
              <InfluencerSignUpForm 
                onToggleMode={() => {
                  setIsInfluencerMode(false);
                  setIsLoginMode(false);
                }}
                onInfluencerSignUpSuccess={(email) => {
                  setSignUpEmail(email);
                  setShowEmailConfirmation(true);
                }}
              />
            ) : isLoginMode ? (
              <LoginForm onToggleMode={() => setIsLoginMode(false)} />
            ) : (
              <SignUpForm 
                onToggleMode={() => setIsLoginMode(true)}
                onInfluencerMode={() => setIsInfluencerMode(true)}
                onSignUpSuccess={(email) => {
                  setSignUpEmail(email);
                  setShowEmailConfirmation(true);
                }}
                initialReferralCode={referralCode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
