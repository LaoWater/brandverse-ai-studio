
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SignUpFormProps {
  onToggleMode: () => void;
}

export const SignUpForm = ({ onToggleMode }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('Attempting signup with:', email, fullName);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: 'Sign up failed',
          description: error.message || 'Registration failed. Please try again.',
          variant: 'destructive',
        });
      } else {
        console.log('Signup successful!');
        toast({
          title: 'Welcome to Creators Multiverse! 🚀',
          description: 'Please check your email to verify your account.',
        });
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
            <Label htmlFor="password" className="text-white font-medium text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 h-12 px-4"
              placeholder="Create a password"
              required
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
        <div className="text-center pt-4">
          <button
            onClick={onToggleMode}
            className="text-accent hover:text-accent/80 text-sm transition-colors font-medium"
          >
            Already have an account? Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
