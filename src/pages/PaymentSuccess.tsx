
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, CreditCard, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const credits = searchParams.get('credits');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Payment Error",
          description: "No session ID found. Please contact support if you were charged.",
          variant: "destructive",
        });
        navigate('/pricing');
        return;
      }

      try {
        setPaymentType(type);
        setCreditsAdded(credits ? parseInt(credits) : null);

        // Verify payment and update database
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });
        
        if (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Verification Error",
            description: "Unable to verify payment. Please contact support if needed.",
            variant: "destructive",
          });
        } else {
          if (type === 'credits') {
            toast({
              title: "Credits Purchased!",
              description: `${credits} credits have been added to your account.`,
            });
          } else {
            toast({
              title: "Subscription Activated!",
              description: "Your subscription has been activated. Welcome aboard!",
            });
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Error",
          description: "Payment completed but verification failed. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, type, credits]);

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Card className="cosmic-card border-0 text-center">
            <CardHeader>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-4">
                Payment Successful!
              </CardTitle>
              <p className="text-gray-300 text-lg">
                {isVerifying 
                  ? "We're verifying your payment and updating your account..."
                  : paymentType === 'credits'
                    ? `${creditsAdded} credits have been added to your account!`
                    : "Your subscription has been activated and you're all set to create amazing content!"
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!isVerifying && (
                <>
                  <div className="bg-card/30 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">What's Next?</h3>
                    <div className="space-y-3 text-left">
                      {paymentType === 'credits' ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <Coins className="w-5 h-5 text-accent" />
                            <span className="text-gray-300">Use your new credits to generate content</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span className="text-gray-300">Text posts cost 1 credit each</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span className="text-gray-300">Images/videos cost 3 credits each</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span className="text-gray-300">Access your enhanced content generation tools</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span className="text-gray-300">Create multiple brand profiles</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span className="text-gray-300">Enjoy priority support and advanced features</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => navigate('/content-generator')}
                      className="cosmic-button text-white"
                    >
                      Start Creating Content
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/my-plan')}
                      variant="outline"
                      className="border-primary/30 text-white hover:bg-primary/10"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      View My Plan
                    </Button>
                  </div>
                </>
              )}
              
              {isVerifying && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
