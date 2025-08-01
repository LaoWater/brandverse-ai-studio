import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Star, Zap, Target, ArrowRight, CreditCard, Loader2, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailConfirmationUIProps {
  email: string;
  onBackToSignIn: () => void;
}

export const EmailConfirmationUI = ({ email, onBackToSignIn }: EmailConfirmationUIProps) => {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const navigate = useNavigate();

  // Rate limiting: 2 emails per hour
  const RESEND_LIMIT = 2;
  const RESEND_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  // Check if user can resend email
  const canResend = () => {
    if (!lastResendTime) return true;
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    
    if (timeSinceLastResend >= RESEND_WINDOW) {
      // Reset count if window has passed
      return true;
    }
    
    return resendCount < RESEND_LIMIT;
  };

  // Check email confirmation status periodically
  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setIsEmailConfirmed(true);
          toast({
            title: 'Email Confirmed! ✅',
            description: 'Your email has been confirmed successfully. You can now proceed.',
          });
        }
      } catch (error) {
        console.error('Error checking email status:', error);
      }
    };

    // Check immediately
    checkEmailStatus();

    // Check every 10 seconds
    const interval = setInterval(checkEmailStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  // Reset resend success message after 5 seconds
  useEffect(() => {
    if (resendSuccess) {
      const timer = setTimeout(() => setResendSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [resendSuccess]);

  const handleResendEmail = async () => {
    if (!canResend()) {
      const timeLeft = Math.ceil((RESEND_WINDOW - (Date.now() - lastResendTime!)) / (60 * 1000));
      toast({
        title: 'Rate Limit Reached',
        description: `You can only resend ${RESEND_LIMIT} emails per hour. Try again in ${timeLeft} minutes.`,
        variant: 'destructive',
      });
      return;
    }

    if (!email) return;

    setResending(true);
    setResendSuccess(false);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      // Update rate limiting state
      const now = Date.now();
      if (!lastResendTime || (now - lastResendTime) >= RESEND_WINDOW) {
        setResendCount(1);
      } else {
        setResendCount(prev => prev + 1);
      }
      setLastResendTime(now);
      
      setResendSuccess(true);
      toast({
        title: 'Email Sent! 📧',
        description: 'We\'ve sent another confirmation email to your inbox.',
      });
    } catch (error: any) {
      console.error('Error resending confirmation email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend confirmation email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Content',
      description: 'Generate engaging posts in seconds'
    },
    {
      icon: Target,
      title: 'Multi-Platform',
      description: 'Post to all social media platforms'
    },
    {
      icon: Star,
      title: 'Advanced Analytics',
      description: 'Track performance and optimize'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Email Confirmation Card */}
      <Card className="cosmic-card border-0 cosmic-glow">
        <CardHeader className="text-center cosmic-card-header p-8">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            {isEmailConfirmed ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-white text-2xl font-bold mb-2">
            {isEmailConfirmed ? 'Email Confirmed!' : 'Check Your Email'}
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            {isEmailConfirmed ? (
              <span className="text-green-400">Your email has been confirmed successfully!</span>
            ) : (
              <>
                We've sent a confirmation link to <br />
                <span className="text-accent font-medium">{email}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="text-center space-y-4">
            {isEmailConfirmed ? (
              <>
                <p className="text-gray-300 text-sm">
                  You can now proceed to your dashboard and start creating amazing content!
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="cosmic-button w-full sm:w-auto"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue to Dashboard
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm">
                  Click the link in the email to verify your account and start creating amazing content!
                </p>
                
                {/* Rate limit warning */}
                {!canResend() && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    You've reached the limit of {RESEND_LIMIT} emails per hour. Please wait before trying again.
                  </div>
                )}
                
                {/* Tip about spam folder */}
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-md text-sm">
                  <strong>Tip:</strong> Don't forget to check your Spam or Junk folder!
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending || resendSuccess || !canResend()}
                    variant="outline"
                    className="cosmic-button-outline"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : resendSuccess ? (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Email Sent!
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Resend Email
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onBackToSignIn}
                    variant="ghost"
                    className="text-accent hover:text-accent/80"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <Card className="cosmic-card border-0 cosmic-glow">
        <CardHeader className="text-center p-6">
          <CardTitle className="text-white text-xl font-bold mb-2">
            While You Wait, Discover What's Possible
          </CardTitle>
          <CardDescription className="text-gray-300">
            Get a taste of how our AI system can save you time & money
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              onClick={handleViewPricing}
              className="cosmic-button w-full sm:w-auto"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Subscription & Credit Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-gray-400 text-xs mt-2">
              Once verified, explore all features with our free trial
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};