import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Star, Zap, Target, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface EmailConfirmationUIProps {
  email: string;
  onBackToSignIn: () => void;
}

export const EmailConfirmationUI = ({ email, onBackToSignIn }: EmailConfirmationUIProps) => {
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setResending(true);
    // Simulate API call
    setTimeout(() => {
      setResending(false);
      toast({
        title: 'Email Sent! 📧',
        description: 'We\'ve sent another confirmation email to your inbox.',
      });
    }, 1000);
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
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-white text-2xl font-bold mb-2">Check Your Email</CardTitle>
          <CardDescription className="text-gray-300 text-base">
            We've sent a confirmation link to <br />
            <span className="text-accent font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="text-center space-y-4">
            <p className="text-gray-300 text-sm">
              Click the link in the email to verify your account and start creating amazing content!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleResendEmail}
                disabled={resending}
                variant="outline"
                className="cosmic-button-outline"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </Button>
              <Button
                onClick={onBackToSignIn}
                variant="ghost"
                className="text-accent hover:text-accent/80"
              >
                Back to Sign In
              </Button>
            </div>
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