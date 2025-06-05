
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BrandSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    mission: "",
    toneOfVoice: "",
    platforms: [] as string[],
    brandColors: "#5B5FEE"
  });

  const platforms = [
    { id: "instagram", label: "Instagram", icon: "📸" },
    { id: "linkedin", label: "LinkedIn", icon: "💼" },
    { id: "twitter", label: "Twitter", icon: "🐦" },
    { id: "facebook", label: "Facebook", icon: "👥" }
  ];

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platformId]
        : prev.platforms.filter(p => p !== platformId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Brand setup data:", formData);
    toast({
      title: "Brand Setup Complete! 🚀",
      description: "Your brand identity has been saved. Ready to generate content!"
    });
    navigate("/content-generator");
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

          <Card className="cosmic-card">
            <CardHeader>
              <CardTitle className="text-white">Brand Identity</CardTitle>
              <CardDescription className="text-gray-300">
                This information helps our AI understand your unique brand personality
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-white">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter your company name"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission" className="text-white">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                    placeholder="What is your company's mission or purpose?"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toneOfVoice" className="text-white">Tone of Voice</Label>
                  <Textarea
                    id="toneOfVoice"
                    value={formData.toneOfVoice}
                    onChange={(e) => setFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                    placeholder="Describe your brand's personality (e.g., professional, friendly, innovative, casual)"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-white">Target Platforms</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {platforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Checkbox
                          id={platform.id}
                          checked={formData.platforms.includes(platform.id)}
                          onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                          className="border-white/20"
                        />
                        <label htmlFor={platform.id} className="text-white cursor-pointer flex items-center space-x-2">
                          <span>{platform.icon}</span>
                          <span>{platform.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-white">Brand Assets</Label>
                  <div className="space-y-3">
                    <Button type="button" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="brandColors" className="text-white">Primary Color</Label>
                      <input
                        type="color"
                        id="brandColors"
                        value={formData.brandColors}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandColors: e.target.value }))}
                        className="w-16 h-10 rounded border border-white/20 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-white glow-effect"
                  disabled={formData.platforms.length === 0}
                >
                  Complete Setup <ArrowRight className="ml-2 w-5 h-5" />
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
