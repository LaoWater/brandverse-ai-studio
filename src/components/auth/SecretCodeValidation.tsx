import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecretCodeValidationProps {
  onValidated: () => void;
  onCancel: () => void;
}

export const SecretCodeValidation = ({ onValidated, onCancel }: SecretCodeValidationProps) => {
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);

      // Scroll to top on component load
      useEffect(() => {
        window.scrollTo(0, 0);
      }, []);

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter your partner access code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // For now, accept any code - in production this would validate against database
      // TODO: Replace with actual validation once database functions are created
      if (secretCode == 'DODO') {
        toast({
          title: "Access Granted ✓",
          description: "Welcome to the partner program!",
          className: "bg-green-600/90 border-green-500 text-white"
        });
        onValidated();
      } else {
        toast({
          title: "Invalid Code",
          description: "Please check your partner access code and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Unable to validate code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="cosmic-card max-w-md mx-auto border border-slate-600 animate-scale-in">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full border border-slate-600">
          <Shield className="w-8 h-8 text-slate-300" />
        </div>
        <CardTitle className="text-xl text-white">
          Partner Access <span className="text-slate-400 font-serif">Required</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Enter your exclusive partner code to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleValidation} className="space-y-6">
          <div>
            <Label htmlFor="secretCode" className="text-white">
              Access Code
            </Label>
            <Input
              id="secretCode"
              type="text"
              placeholder="Enter your partner code..."
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              required
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-slate-400 mt-2"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-400">
              Partner codes are provided exclusively to approved influencers and content creators.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 cosmic-button"
            >
              {loading ? 'Validating...' : 'Verify Code'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};