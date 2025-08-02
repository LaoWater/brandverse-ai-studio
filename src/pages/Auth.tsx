
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { InfluencerSignUpForm } from '@/components/auth/InfluencerSignUpForm';
import { SecretCodeValidation } from '@/components/auth/SecretCodeValidation';
import { EmailConfirmationUI } from '@/components/auth/EmailConfirmationUI';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isInfluencerMode, setIsInfluencerMode] = useState(false);
  const [showSecretCodeCheck, setShowSecretCodeCheck] = useState(false);
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
              setShowSecretCodeCheck(false);
            }}
          />
        ) : (
          <div className="relative">
            {/* For Partners Button - Outside form, top-right of container */}
            {!isLoginMode && !isInfluencerMode && !showSecretCodeCheck && (
              <div className="hidden md:block absolute -top--22 right-0 z-10">
                <button
                  onClick={() => setShowSecretCodeCheck(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20 hover:-translate-y-0.5 animate-fade-in"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Partner Access</span>
                    <div className="w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              </div>
            )}

            <div className={isInfluencerMode || showSecretCodeCheck ? "max-w-2xl mx-auto" : "max-w-md mx-auto"}>
              {!isInfluencerMode && !showSecretCodeCheck && (
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

              {showSecretCodeCheck ? (
                <SecretCodeValidation 
                  onValidated={() => {
                    setShowSecretCodeCheck(false);
                    setIsInfluencerMode(true);
                  }}
                  onCancel={() => setShowSecretCodeCheck(false)}
                />
              ) : isInfluencerMode ? (
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
                  onInfluencerMode={() => setShowSecretCodeCheck(true)}
                  onSignUpSuccess={(email) => {
                    setSignUpEmail(email);
                    setShowEmailConfirmation(true);
                  }}
                  initialReferralCode={referralCode}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
