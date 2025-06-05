
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, Image, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "Alex Creator",
    email: "alex@creatorsverse.com",
    company: "Creators Multiverse"
  });

  const [brandSettings, setBrandSettings] = useState({
    companyName: "Creators Multiverse",
    mission: "Empowering creators to scale their content across the digital multiverse",
    toneOfVoice: "Professional, innovative, and inspiring with a touch of futuristic vision",
    primaryColor: "#5B5FEE"
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    contentReady: true,
    weeklyReports: false,
    platformAlerts: true
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved! ✅",
      description: "Your preferences have been updated successfully."
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-cosmic font-serif">Settings</span> & Profile
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your account, brand identity, and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="brand" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Image className="w-4 h-4 mr-2" />
                Brand
              </TabsTrigger>
              <TabsTrigger value="platforms" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Platforms
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="cosmic-card">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Update your personal account details
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-white">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brand Tab */}
            <TabsContent value="brand">
              <Card className="cosmic-card">
                <CardHeader>
                  <CardTitle className="text-white">Brand Identity</CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage your brand voice and visual identity
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-white">Company Name</Label>
                    <Input
                      id="brandName"
                      value={brandSettings.companyName}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mission" className="text-white">Mission Statement</Label>
                    <Textarea
                      id="mission"
                      value={brandSettings.mission}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, mission: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-white">Tone of Voice</Label>
                    <Textarea
                      id="tone"
                      value={brandSettings.toneOfVoice}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Label htmlFor="primaryColor" className="text-white">Primary Color</Label>
                    <input
                      type="color"
                      id="primaryColor"
                      value={brandSettings.primaryColor}
                      onChange={(e) => setBrandSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 rounded border border-white/20 bg-transparent"
                    />
                  </div>

                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
                    Update Brand
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platforms Tab */}
            <TabsContent value="platforms">
              <Card className="cosmic-card">
                <CardHeader>
                  <CardTitle className="text-white">Connected Platforms</CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage your social media platform connections
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {[
                    { name: "Instagram", icon: "📸", connected: true },
                    { name: "LinkedIn", icon: "💼", connected: true },
                    { name: "Twitter", icon: "🐦", connected: false },
                    { name: "Facebook", icon: "👥", connected: true }
                  ].map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <span className="text-white font-medium">{platform.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${platform.connected ? 'text-green-400' : 'text-gray-400'}`}>
                          {platform.connected ? 'Connected' : 'Not Connected'}
                        </span>
                        <Button 
                          variant={platform.connected ? "outline" : "default"}
                          size="sm"
                          className={platform.connected ? "border-white/20 text-white hover:bg-white/10" : "bg-primary hover:bg-primary/90 text-white"}
                        >
                          {platform.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="cosmic-card">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                  <CardDescription className="text-gray-300">
                    Choose what notifications you'd like to receive
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {[
                    { key: 'emailUpdates', label: 'Email Updates', description: 'Receive product updates and announcements' },
                    { key: 'contentReady', label: 'Content Ready', description: 'Get notified when generated content is ready' },
                    { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance summaries' },
                    { key: 'platformAlerts', label: 'Platform Alerts', description: 'Important alerts about connected platforms' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="space-y-1">
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-gray-400 text-sm">{item.description}</div>
                      </div>
                      
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => 
                          setNotifications(prev => ({ ...prev, [item.key]: checked }))
                        }
                      />
                    </div>
                  ))}

                  <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
