
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings as SettingsIcon, Building2, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanySelector } from "@/components/CompanySelector";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { selectedCompany, refreshCompanies } = useCompany();
  
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    subscription_type: "free"
  });

  const [companyData, setCompanyData] = useState({
    name: "",
    mission: "",
    tone_of_voice: "",
    primary_color_1: "#5B5FEE",
    primary_color_2: "#00D4FF"
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    contentReady: true,
    weeklyReports: false,
    platformAlerts: true
  });

  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Load user profile
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Load company data when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      console.log('Loading company data:', selectedCompany);
      setCompanyData({
        name: selectedCompany.name || "",
        mission: selectedCompany.mission || "",
        tone_of_voice: selectedCompany.tone_of_voice || "",
        primary_color_1: selectedCompany.primary_color_1 || "#5B5FEE",
        primary_color_2: selectedCompany.primary_color_2 || "#00D4FF"
      });
    }
  }, [selectedCompany]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for:', user?.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Loaded user profile:', data);
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          subscription_type: data.subscription_type || "free"
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('Saving profile:', profile);
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          email: profile.email
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated! ✅",
        description: "Your profile has been saved successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!selectedCompany) {
      toast({
        title: "No Company Selected",
        description: "Please select a company to update.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Saving company:', companyData, 'for company ID:', selectedCompany.id);
      
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          mission: companyData.mission,
          tone_of_voice: companyData.tone_of_voice,
          primary_color_1: companyData.primary_color_1,
          primary_color_2: companyData.primary_color_2
        })
        .eq('id', selectedCompany.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      await refreshCompanies();
      
      toast({
        title: "Company Updated! ✅",
        description: "Your company settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedCompany.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', selectedCompany.id);

      if (error) throw error;

      await refreshCompanies();
      
      toast({
        title: "Company Deleted",
        description: "The company has been removed successfully."
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-cosmic font-serif">Settings</span> & Management
              </h1>
              <p className="text-gray-300 text-lg">
                Manage your profile, companies, and preferences
              </p>
            </div>
            <CompanySelector />
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 cosmic-card border-0">
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="company" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
                <Building2 className="w-4 h-4 mr-2" />
                Company
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="cosmic-card border-0">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Update your personal account details
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="p-4 cosmic-card border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Subscription Plan</p>
                        <p className="text-gray-400 text-sm capitalize">{profile.subscription_type}</p>
                      </div>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={saving}
                      className="cosmic-button text-white"
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                    <Button 
                      onClick={handleSignOut} 
                      variant="outline" 
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company">
              {selectedCompany ? (
                <Card className="cosmic-card border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Company Settings</CardTitle>
                        <CardDescription className="text-gray-300">
                          Manage your brand identity and voice
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => navigate('/brand-setup')}
                        size="sm"
                        className="cosmic-button text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Company
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mission" className="text-white">Mission Statement</Label>
                      <Textarea
                        id="mission"
                        value={companyData.mission}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, mission: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white min-h-[100px] focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tone" className="text-white">Tone of Voice</Label>
                      <Textarea
                        id="tone"
                        value={companyData.tone_of_voice}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, tone_of_voice: e.target.value }))}
                        className="bg-white/5 border-white/20 text-white min-h-[80px] focus:border-primary"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white text-lg font-semibold">Brand Colors</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="primaryColor1" className="text-white">Primary Brand Color</Label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              id="primaryColor1"
                              value={companyData.primary_color_1}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_1: e.target.value }))}
                              className="w-20 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                            />
                            <div className="flex-1">
                              <Input
                                value={companyData.primary_color_1}
                                onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_1: e.target.value }))}
                                className="bg-white/5 border-white/20 text-white focus:border-primary"
                                placeholder="#5B5FEE"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="primaryColor2" className="text-white">Secondary Brand Color</Label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              id="primaryColor2"
                              value={companyData.primary_color_2}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_2: e.target.value }))}
                              className="w-20 h-12 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer"
                            />
                            <div className="flex-1">
                              <Input
                                value={companyData.primary_color_2}
                                onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_2: e.target.value }))}
                                className="bg-white/5 border-white/20 text-white focus:border-primary"
                                placeholder="#00D4FF"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 cosmic-card border-0 rounded-lg">
                        <p className="text-white text-sm font-medium mb-2">Color Preview</p>
                        <div className="flex space-x-4">
                          <div 
                            className="w-16 h-16 rounded-lg border-2 border-white/20"
                            style={{ backgroundColor: companyData.primary_color_1 }}
                          />
                          <div 
                            className="w-16 h-16 rounded-lg border-2 border-white/20"
                            style={{ backgroundColor: companyData.primary_color_2 }}
                          />
                          <div 
                            className="flex-1 h-16 rounded-lg border-2 border-white/20"
                            style={{ 
                              background: `linear-gradient(135deg, ${companyData.primary_color_1} 0%, ${companyData.primary_color_2} 100%)` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        onClick={handleSaveCompany} 
                        disabled={saving}
                        className="cosmic-button text-white"
                      >
                        {saving ? 'Saving...' : 'Save Company'}
                      </Button>
                      <Button 
                        onClick={handleDeleteCompany}
                        variant="outline" 
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Company
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="cosmic-card border-0">
                  <CardContent className="p-8 text-center">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Company Selected</h3>
                    <p className="text-gray-300 mb-6">Create or select a company to manage its settings</p>
                    <Button 
                      onClick={() => navigate('/brand-setup')}
                      className="cosmic-button text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Company
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="cosmic-card border-0">
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
                    <div key={item.key} className="flex items-center justify-between p-4 cosmic-card border-0">
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

                  <Button 
                    onClick={() => toast({ title: "Preferences Saved! ✅" })} 
                    className="cosmic-button text-white"
                  >
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
