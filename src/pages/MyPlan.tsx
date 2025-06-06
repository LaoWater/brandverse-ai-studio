
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  FileText, 
  Zap,
  Crown,
  Star,
  Check,
  ArrowRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const MyPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [planData, setPlanData] = useState({
    plan: "free",
    renewalDate: "2024-01-15",
    contentGenerated: 15,
    contentLimit: 50,
    companiesCreated: 2,
    companiesLimit: 3
  });

  const [billingHistory] = useState([
    { date: "2023-12-15", amount: "$19.99", status: "Paid", invoice: "INV-001" },
    { date: "2023-11-15", amount: "$19.99", status: "Paid", invoice: "INV-002" },
    { date: "2023-10-15", amount: "$19.99", status: "Paid", invoice: "INV-003" },
  ]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription will remain active until the end of the current billing period."
    });
  };

  const getPlanInfo = (planType: string) => {
    switch (planType) {
      case "pro":
        return {
          name: "Pro Plan",
          icon: <Star className="w-5 h-5" />,
          color: "bg-primary",
          features: ["Unlimited content generation", "5 companies", "Priority support"]
        };
      case "enterprise":
        return {
          name: "Enterprise Plan",
          icon: <Crown className="w-5 h-5" />,
          color: "bg-accent",
          features: ["Unlimited everything", "Unlimited companies", "24/7 support", "Custom integrations"]
        };
      default:
        return {
          name: "Free Plan",
          icon: <Zap className="w-5 h-5" />,
          color: "bg-gray-500",
          features: ["50 content generations/month", "3 companies", "Email support"]
        };
    }
  };

  const currentPlan = getPlanInfo(planData.plan);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="text-cosmic font-serif">My Plan</span> & Usage
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your subscription and track your usage
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Current Plan Card */}
            <Card className="cosmic-card border-0 lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${currentPlan.color} text-white`}>
                      {currentPlan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{currentPlan.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {planData.plan === "free" ? "Free forever" : `Renews on ${planData.renewalDate}`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${currentPlan.color} text-white`}>
                    Current
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-accent" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {planData.plan === "free" && (
                  <div className="pt-4 border-t border-primary/20">
                    <Button 
                      onClick={handleUpgrade}
                      className="cosmic-button text-white w-full"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card className="cosmic-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-accent" />
                    <div>
                      <p className="text-white font-semibold">Content Generated</p>
                      <p className="text-gray-400 text-sm">This month</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{planData.contentGenerated} / {planData.contentLimit}</span>
                      <span className="text-gray-400">{Math.round((planData.contentGenerated / planData.contentLimit) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(planData.contentGenerated / planData.contentLimit) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="cosmic-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-white font-semibold">Companies</p>
                      <p className="text-gray-400 text-sm">{planData.companiesCreated} / {planData.companiesLimit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="billing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 cosmic-card border-0">
              <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing History
              </TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
                <TrendingUp className="w-4 h-4 mr-2" />
                Usage Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing">
              <Card className="cosmic-card border-0">
                <CardHeader>
                  <CardTitle className="text-white">Billing History</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your payment history and invoices
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {billingHistory.map((bill, index) => (
                      <div key={index} className="flex items-center justify-between p-4 cosmic-card border-0 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Calendar className="w-5 h-5 text-accent" />
                          <div>
                            <p className="text-white font-medium">{bill.date}</p>
                            <p className="text-gray-400 text-sm">{bill.invoice}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{bill.amount}</p>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {bill.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {planData.plan !== "free" && (
                    <div className="mt-6 pt-6 border-t border-primary/20">
                      <Button 
                        onClick={handleCancelSubscription}
                        variant="outline" 
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card className="cosmic-card border-0">
                <CardHeader>
                  <CardTitle className="text-white">Usage Analytics</CardTitle>
                  <CardDescription className="text-gray-300">
                    Track your content generation and platform performance
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 cosmic-card border-0 rounded-lg">
                        <h4 className="text-white font-semibold mb-2">Content by Platform</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Instagram</span>
                            <span className="text-white">6 posts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">LinkedIn</span>
                            <span className="text-white">4 posts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Twitter</span>
                            <span className="text-white">3 posts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Facebook</span>
                            <span className="text-white">2 posts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 cosmic-card border-0 rounded-lg">
                        <h4 className="text-white font-semibold mb-2">This Month's Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Content Generated</span>
                            <span className="text-accent font-semibold">+15</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Companies Active</span>
                            <span className="text-primary font-semibold">2</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Avg. Time Saved</span>
                            <span className="text-white">4.2 hours</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MyPlan;
