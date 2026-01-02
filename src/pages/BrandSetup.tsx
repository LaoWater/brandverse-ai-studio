
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Upload, Instagram, Facebook, Twitter, Linkedin, X, ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { uploadCompanyLogo } from "@/services/companyService";

const BrandSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
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
      // Upload logo if provided
      let logoPath = null;
      if (logoFile) {
        logoPath = await uploadCompanyLogo(logoFile, user.id);
        if (!logoPath) {
          toast({
            title: "Logo Upload Failed",
            description: "Company will be created without a logo. You can add it later.",
            variant: "default",
          });
        }
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          mission: formData.mission,
          tone_of_voice: formData.toneOfVoice,
          primary_color_1: formData.primaryColor,
          primary_color_2: formData.secondaryColor,
          logo_path: logoPath,
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
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label className="text-white font-medium text-sm">Company Logo</Label>
                      {logoPreview ? (
                        <div className="relative w-full p-6 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium">{logoFile?.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveLogo}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <div className="p-3 rounded-full bg-white/10">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="text-white font-medium">Upload Company Logo</p>
                                <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 5MB</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      )}
                    </div>
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
