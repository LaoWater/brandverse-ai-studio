
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        toast({
          title: 'Sign in failed',
          description: error.message || 'Login failed. Please check your credentials.',
          variant: 'destructive',
        });
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
