
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
        console.log('Login successful!');
        toast({
          title: 'Welcome back! ✨',
          description: 'You have successfully signed in.',
        });
        navigate('/');
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

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('Login button clicked!');
    e.preventDefault();
    handleSubmit(e as any);
  };

  return (
    <Card className="cosmic-card border-0 cosmic-glow">
      <CardHeader className="text-center cosmic-card-header">
        <CardTitle className="text-white text-2xl font-bold">Sign In</CardTitle>
        <CardDescription className="text-gray-300 text-base">
          Welcome back to the Creators Multiverse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/20 text-white focus:border-primary focus:ring-primary placeholder:text-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleButtonClick}
            className="w-full cosmic-button text-white font-semibold py-3 text-base"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="text-center">
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
