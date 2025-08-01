import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Key, Sparkles, Users, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface InfluencerSignUpFormProps {
  onToggleMode: () => void;
  onInfluencerSignUpSuccess: (email: string) => void;
}

export const InfluencerSignUpForm = ({ onToggleMode, onInfluencerSignUpSuccess }: InfluencerSignUpFormProps) => {
  const { signUpInfluencer } = useAuth();
  const [formData, setFormData] = useState({
    secretCode: '',
    fullName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    bio: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: '',
      twitter: ''
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.secretCode.trim()) {
      toast({
        title: "Secret Code Required",
        description: "Please enter your influencer secret code.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.fullName.trim()) {
      toast({
        title: "Full Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (formData.email !== formData.confirmEmail) {
      toast({
        title: "Email Mismatch",
        description: "Email addresses do not match.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.password) {
      toast({
        title: "Password Required",
        description: "Please enter a password.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUpInfluencer(
        formData.email,
        formData.password,
        formData.fullName,
        formData.secretCode,
        {
          bio: formData.bio,
          social_links: formData.socialLinks
        }
      );

      if (error) {
        if (error.message.includes('Email rate limit exceeded')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many emails sent. Please wait a few minutes before trying again.",
            variant: "destructive"
          });
        } else if (error.message.includes('User already registered')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already associated with an account.",
            variant: "destructive"
          });
        } else if (error.message.includes('Invalid secret code')) {
          toast({
            title: "Invalid Secret Code",
            description: "The secret code you entered is invalid or expired.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      onInfluencerSignUpSuccess(formData.email);
      
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Card className="cosmic-card max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cosmic to-accent rounded-full">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-white">
          Join as an <span className="text-cosmic font-serif">Influencer</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Partner with us and start earning from your referrals
        </CardDescription>
        
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <Users className="w-6 h-6 mx-auto mb-2 text-cosmic" />
            <div className="text-sm text-white font-medium">Build Community</div>
            <div className="text-xs text-gray-400">Connect with creators</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-sm text-white font-medium">Earn Commission</div>
            <div className="text-xs text-gray-400">Get paid for referrals</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <Key className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-sm text-white font-medium">Exclusive Access</div>
            <div className="text-xs text-gray-400">Early features & tools</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Secret Code */}
          <div>
            <Label htmlFor="secretCode" className="text-white">
              Influencer Secret Code *
            </Label>
            <Input
              id="secretCode"
              type="text"
              placeholder="Enter your secret code"
              value={formData.secretCode}
              onChange={(e) => handleInputChange('secretCode', e.target.value.toUpperCase())}
              required
              className="bg-white/10 border-cosmic/30 text-white placeholder:text-gray-400 focus:border-cosmic"
            />
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-white">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Email Confirmation */}
          <div>
            <Label htmlFor="confirmEmail" className="text-white">Confirm Email *</Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Confirm your email address"
              value={formData.confirmEmail}
              onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password" className="text-white">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-white">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your content..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Social Links */}
          <div>
            <Label className="text-white mb-3 block">Social Media Links (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram" className="text-gray-300 text-sm">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="youtube" className="text-gray-300 text-sm">YouTube</Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/@username"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="tiktok" className="text-gray-300 text-sm">TikTok</Label>
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://tiktok.com/@username"
                  value={formData.socialLinks.tiktok}
                  onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="twitter" className="text-gray-300 text-sm">X (Twitter)</Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://x.com/username"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full cosmic-button h-12 text-lg font-semibold"
          >
            {loading ? 'Creating Account...' : 'Join as Influencer'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onToggleMode}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Regular Sign Up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};