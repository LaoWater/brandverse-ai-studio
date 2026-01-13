import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Building2,
  Trash2,
  Plus,
  Bell,
  Shield,
  Mail,
  Upload,
  X,
  Crown,
  LogOut,
  Palette,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { CompanySelector } from "@/components/CompanySelector";
import { useNavigate } from "react-router-dom";
import { uploadCompanyLogo, deleteCompanyLogo, updateCompanyLogoPath } from "@/services/companyService";

type TabId = 'profile' | 'company' | 'preferences' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'preferences', label: 'Preferences', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { selectedCompany, refreshCompanies } = useCompany();

  const [activeTab, setActiveTab] = useState<TabId>('company');

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
    primary_color_2: "#00D4FF",
    logo_path: null as string | null
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    newsletter: true,
    marketingEmails: false,
    productUpdates: true,
    automaticBilling: false
  });

  const [saving, setSaving] = useState(false);

  const [security, setSecurity] = useState({
    twoFactorEnabled: false
  });

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
        primary_color_2: selectedCompany.primary_color_2 || "#00D4FF",
        logo_path: selectedCompany.logo_path || null
      });
      // Reset logo upload state when company changes
      setLogoFile(null);
      setLogoPreview(null);
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
        title: "Profile Updated",
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

  const handleRemoveLogo = async () => {
    if (!selectedCompany) return;

    // If there's an existing logo in the database, delete it
    if (companyData.logo_path) {
      const deleted = await deleteCompanyLogo(companyData.logo_path);
      if (deleted) {
        await updateCompanyLogoPath(selectedCompany.id, null);
        setCompanyData(prev => ({ ...prev, logo_path: null }));
        await refreshCompanies();
        toast({
          title: "Logo Removed",
          description: "Company logo has been removed successfully.",
        });
      }
    }

    // Clear upload state
    setLogoFile(null);
    setLogoPreview(null);
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

      // Upload new logo if one was selected
      let logoPath = companyData.logo_path;
      if (logoFile) {
        // Delete old logo if it exists
        if (companyData.logo_path) {
          await deleteCompanyLogo(companyData.logo_path);
        }

        // Upload new logo
        logoPath = await uploadCompanyLogo(logoFile, user!.id, selectedCompany.id);
        if (!logoPath) {
          toast({
            title: "Logo Upload Failed",
            description: "Company will be updated without a new logo.",
            variant: "default",
          });
          logoPath = companyData.logo_path; // Keep existing logo
        }
      }

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          mission: companyData.mission,
          tone_of_voice: companyData.tone_of_voice,
          primary_color_1: companyData.primary_color_1,
          primary_color_2: companyData.primary_color_2,
          logo_path: logoPath
        })
        .eq('id', selectedCompany.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Clear logo upload state after successful save
      setLogoFile(null);
      setLogoPreview(null);

      await refreshCompanies();

      toast({
        title: "Company Updated",
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

  const handleDeactivateAccount = () => {
    if (confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
      toast({
        title: "Account Deactivated",
        description: "Your account has been scheduled for deactivation.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleTwoFactorToggle = (checked: boolean) => {
    if (checked) {
      toast({
        title: "Coming Soon",
        description: "Two-factor authentication will be available soon!",
        variant: "default"
      });
      return;
    }
    setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }));
  };

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="settings-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-xl font-semibold">Profile Information</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your personal account details
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      className="settings-input"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="settings-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground font-semibold">Subscription Plan</p>
                        <p className="text-muted-foreground text-sm capitalize">{profile.subscription_type}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/my-plan')}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
                    >
                      Manage Plan
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
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
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'company':
        return (
          <motion.div
            key="company"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {selectedCompany ? (
              <Card className="settings-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground text-xl font-semibold">Company Settings</CardTitle>
                      <CardDescription className="text-muted-foreground">
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
                    <Label htmlFor="companyName" className="text-foreground font-medium">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                      className="settings-input"
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Logo Upload Section */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Company Logo</Label>
                    {logoPreview || companyData.logo_path ? (
                      <div className="relative w-full p-5 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
                              <img
                                src={logoPreview || companyData.logo_path || ''}
                                alt="Logo preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-foreground font-medium">
                                {logoFile?.name || 'Current logo'}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Click X to remove'}
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
                          id="company-logo-upload"
                        />
                        <Label
                          htmlFor="company-logo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 cursor-pointer transition-all"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-3 rounded-full bg-primary/10">
                              <Upload className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="text-foreground font-medium">Upload Company Logo</p>
                              <p className="text-muted-foreground text-xs mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mission" className="text-foreground font-medium">Mission Statement</Label>
                    <Textarea
                      id="mission"
                      value={companyData.mission}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, mission: e.target.value }))}
                      className="settings-input min-h-[100px]"
                      placeholder="Describe your company's mission..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-foreground font-medium">Tone of Voice</Label>
                    <Textarea
                      id="tone"
                      value={companyData.tone_of_voice}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, tone_of_voice: e.target.value }))}
                      className="settings-input min-h-[80px]"
                      placeholder="Describe your brand's communication style..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      <Label className="text-foreground text-base font-semibold">Brand Colors</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <Label htmlFor="primaryColor1" className="text-foreground font-medium">Primary Color</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            id="primaryColor1"
                            value={companyData.primary_color_1}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_1: e.target.value }))}
                            className="w-14 h-10 rounded-lg border border-primary/20 bg-transparent cursor-pointer"
                          />
                          <Input
                            value={companyData.primary_color_1}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_1: e.target.value }))}
                            className="settings-input flex-1"
                            placeholder="#5B5FEE"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="primaryColor2" className="text-foreground font-medium">Secondary Color</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            id="primaryColor2"
                            value={companyData.primary_color_2}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_2: e.target.value }))}
                            className="w-14 h-10 rounded-lg border border-primary/20 bg-transparent cursor-pointer"
                          />
                          <Input
                            value={companyData.primary_color_2}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, primary_color_2: e.target.value }))}
                            className="settings-input flex-1"
                            placeholder="#00D4FF"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                      <p className="text-foreground text-sm font-medium mb-3">Color Preview</p>
                      <div className="flex space-x-3">
                        <div
                          className="w-12 h-12 rounded-lg border border-primary/20 shadow-sm"
                          style={{ backgroundColor: companyData.primary_color_1 }}
                        />
                        <div
                          className="w-12 h-12 rounded-lg border border-primary/20 shadow-sm"
                          style={{ backgroundColor: companyData.primary_color_2 }}
                        />
                        <div
                          className="flex-1 h-12 rounded-lg border border-primary/20 shadow-sm"
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
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Company
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="settings-card">
                <CardContent className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Company Selected</h3>
                  <p className="text-muted-foreground mb-6">Create or select a company to manage its settings</p>
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
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="settings-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-xl font-semibold">Preferences</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Choose what notifications and emails you'd like to receive
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-primary" />
                    <h4 className="text-foreground font-semibold">Email Preferences</h4>
                  </div>

                  {[
                    { key: 'newsletter', label: 'Newsletter', description: 'Monthly newsletter with tips and updates' },
                    { key: 'marketingEmails', label: 'Marketing Emails', description: 'Promotional offers and new feature announcements' },
                    { key: 'productUpdates', label: 'Product Updates', description: 'Important product updates and security notices' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-foreground font-medium">{item.label}</div>
                        <div className="text-muted-foreground text-sm">{item.description}</div>
                      </div>

                      <Switch
                        checked={preferences[item.key as keyof typeof preferences]}
                        onCheckedChange={(checked) =>
                          setPreferences(prev => ({ ...prev, [item.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => toast({ title: "Preferences Saved" })}
                  className="cosmic-button text-white"
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="settings-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-xl font-semibold">Security Settings</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <div className="text-foreground font-medium">Two-Factor Authentication</div>
                      <div className="text-muted-foreground text-sm">Add an extra layer of security to your account</div>
                    </div>

                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={handleTwoFactorToggle}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-red-500/20">
                  <h4 className="text-red-500 font-semibold">Danger Zone</h4>
                  <div className="p-5 border border-red-500/20 rounded-xl bg-red-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">Deactivate Account</p>
                        <p className="text-muted-foreground text-sm">Permanently deactivate your account and delete all data</p>
                      </div>
                      <Button
                        onClick={handleDeactivateAccount}
                        variant="outline"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => toast({ title: "Security Settings Saved" })}
                  className="cosmic-button text-white"
                >
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      {/* Subtle ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-[300px] h-[300px] bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[5%] w-[250px] h-[250px] bg-accent/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[200px] h-[200px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-cosmic font-serif">Settings</span>
                <span className="text-foreground"> & Management</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your profile, companies, and preferences
              </p>
            </div>
            <CompanySelector />
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="settings-tab-nav relative flex p-1.5 rounded-2xl backdrop-blur-sm">
              {/* Sliding indicator */}
              <motion.div
                className="settings-tab-indicator absolute top-1.5 bottom-1.5 rounded-xl shadow-md"
                layoutId="activeTab"
                initial={false}
                animate={{
                  left: `calc(${tabs.findIndex(t => t.id === activeTab) * 25}% + 6px)`,
                  width: 'calc(25% - 6px)',
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30
                }}
              />

              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4
                      rounded-xl font-medium text-sm transition-colors duration-200
                      ${isActive
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
