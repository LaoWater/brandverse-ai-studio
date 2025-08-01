
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SignUpFormProps {
  onToggleMode: () => void;
  onInfluencerMode: () => void;
  onSignUpSuccess: (email: string) => void;
  initialReferralCode?: string;
}

export const SignUpForm = ({ onToggleMode, onInfluencerMode, onSignUpSuccess, initialReferralCode }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !confirmEmail || !password || !confirmPassword || !fullName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    if (email !== confirmEmail) {
      toast({
        title: 'Email Mismatch',
        description: 'Email addresses do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('Attempting signup with:', email, fullName);

    try {
      const { error } = await signUp(email, password, fullName, referralCode || undefined);

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: 'Sign up failed',
          description: error.message || 'Registration failed. Please try again.',
          variant: 'destructive',
        });
      } else {
        console.log('Signup successful!');
        onSignUpSuccess(email);
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="cosmic-card border-0 cosmic-glow">
      <CardHeader className="text-center cosmic-card-header p-8">
        <CardTitle className="text-white text-2xl font-bold mb-2">Create Account</CardTitle>
        <CardDescription className="text-gray-300 text-base">
          Join the Creators Multiverse today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="fullName" className="text-white font-medium text-sm">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Enter your full name"
              required
            />
          </div>
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
            <Label htmlFor="confirmEmail" className="text-white font-medium text-sm">Confirm Email</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Confirm your email"
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
              placeholder="Create a password (min. 6 characters)"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="confirmPassword" className="text-white font-medium text-sm">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          {/* Referral Code Field */}
          <div className="space-y-3">
            <Label htmlFor="referralCode" className="text-white font-medium text-sm">
              Referral Code <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Enter referral code if you have one"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full cosmic-button text-white font-semibold py-4 text-base h-12 mt-8"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={onToggleMode}
            className="text-accent hover:text-accent/80 text-sm transition-colors font-medium"
          >
            Already have an account? Sign in
          </button>
          <div className="text-center">
            <button
              onClick={onInfluencerMode}
              className="group relative px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/20 hover:-translate-y-0.5"
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
        </div>
      </CardContent>
    </Card>
  );
};
