
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Upload, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

const BrandSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    mission: "",
    toneOfVoice: "",
    platforms: [] as string[],
    primaryColor: "#5B5FEE",
    secondaryColor: "#00D4FF"
  });

  const platforms = [
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "facebook", label: "Facebook", icon: Facebook }
  ];

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platformId]
        : prev.platforms.filter(p => p !== platformId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a company.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    console.log("Creating company with data:", formData);

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          mission: formData.mission,
          tone_of_voice: formData.toneOfVoice,
          primary_color_1: formData.primaryColor,
          primary_color_2: formData.secondaryColor,
          user_id: user.id,
          other_info: {
            platforms: formData.platforms
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created successfully:', data);
      
      // Refresh companies list
      await refreshCompanies();
      
      toast({
        title: "Brand Setup Complete! 🚀",
        description: "Your brand identity has been saved. Ready to generate content!"
      });
      
      navigate("/content-generator");
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Set Up Your <span className="text-cosmic font-serif">Brand</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Tell us about your brand so we can create content that perfectly matches your voice
            </p>
          </div>

          <Card className="cosmic-card border-0 cosmic-glow">
            <CardHeader className="cosmic-card-header">
              <CardTitle className="text-white text-2xl font-bold">Brand Identity</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                This information helps our AI understand your unique brand personality
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="companyName" className="text-white font-medium">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter your company name"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mission" className="text-white font-medium">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                    placeholder="What is your company's mission or purpose?"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="toneOfVoice" className="text-white font-medium">Tone of Voice</Label>
                  <Textarea
                    id="toneOfVoice"
                    value={formData.toneOfVoice}
                    onChange={(e) => setFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                    placeholder="Describe your brand's personality (e.g., professional, friendly, innovative, casual)"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-medium">Target Platforms</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {platforms.map((platform) => {
                      const IconComponent = platform.icon;
                      return (
                        <div key={platform.id} className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
                          <Checkbox
                            id={platform.id}
                            checked={formData.platforms.includes(platform.id)}
                            onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                            className="border-white/20"
                          />
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-5 h-5 text-white" />
                            <label htmlFor={platform.id} className="text-white cursor-pointer">
                              {platform.label}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-white font-medium">Brand Assets</Label>
                  <div className="space-y-4">
                    <Button type="button" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-12">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="primaryColor" className="text-white font-medium">Primary Color</Label>
                        <input
                          type="color"
                          id="primaryColor"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 rounded border border-white/20 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <Label htmlFor="secondaryColor" className="text-white font-medium">Secondary Color</Label>
                        <input
                          type="color"
                          id="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10 rounded border border-white/20 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full cosmic-button text-white font-semibold h-12 mt-8"
                  disabled={loading || formData.platforms.length === 0}
                >
                  {loading ? 'Creating Company...' : 'Complete Setup'} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrandSetup;
