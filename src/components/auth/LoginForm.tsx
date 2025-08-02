
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FcGoogle } from 'react-icons/fc';


interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted!', { email, password: '***' });
    
    if (!email || !password) {
      console.log('Missing email or password');
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('Attempting login with:', email);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        
        // Check if it's an email not confirmed error
        if (error.message?.includes('email not confirmed')) {
          // Automatically resend confirmation email
          await handleResendConfirmation();
          toast({
            title: 'Email not confirmed',
            description: 'Please check your email for a confirmation link. We\'ve sent you a new one.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign in failed',
            description: error.message || 'Login failed. Please check your credentials.',
            variant: 'destructive',
          });
        }
      } else {
        console.log('Login successful! Navigating to home...');
        toast({
          title: 'Welcome back! ✨',
          description: 'You have successfully signed in.',
        });
        // Add a small delay to ensure toast shows before navigation
        setTimeout(() => {
          navigate('/');
        }, 100);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Email Sent',
          description: 'Check your email for password reset instructions.',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: 'Resend Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Confirmation Email Sent',
          description: 'Check your email for a new confirmation link.',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // This error handling is for immediate issues before the redirect.
      // Most OAuth errors are handled on the callback page.
      if (error) {
        console.error('Google login error:', error);
        // Corrected toast call to match the other function's style
        toast({
          title: 'Google Login Failed',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false); // Stop loading on immediate error
        return;
      }

    } catch (err) {
      toast({
        title: 'An Unexpected Error Occurred',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Card className="cosmic-card border-0 cosmic-glow">
      <CardHeader className="text-center cosmic-card-header p-8">
        <CardTitle className="text-white text-2xl font-bold mb-2">Sign In</CardTitle>
        <CardDescription className="text-gray-300 text-base">
          Welcome back to the Creators Multiverse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-white font-medium text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="password" className="text-white font-medium text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Enter your password"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full cosmic-button text-white font-semibold py-4 text-base h-12 mt-8"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Additional buttons */}
        <div className="space-y-4">
          {/* Google Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 hover:text-white transition-all"
            >
            <FcGoogle className="w-5 h-5 mr-3" />
            Continue with Google
          </Button>

          {/* Reset Password and Resend Confirmation */}
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="flex-1 text-accent hover:text-accent/80 transition-colors font-medium py-2"
            >
              {resetLoading ? 'Sending...' : 'Reset Password'}
            </button>
            <span className="text-gray-400">•</span>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="flex-1 text-accent hover:text-accent/80 transition-colors font-medium py-2"
            >
              {resendLoading ? 'Sending...' : 'Resend Confirmation'}
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={onToggleMode}
            className="text-accent hover:text-accent/80 text-sm transition-colors font-medium"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
