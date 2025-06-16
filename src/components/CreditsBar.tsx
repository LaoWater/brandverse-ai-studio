
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { getUserCredits, UserCredits } from "@/services/creditsService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreditsBar = () => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const userCredits = await getUserCredits();
      setCredits(userCredits);
      setLoading(false);
    };

    fetchCredits();

    // Set up real-time subscription for credits updates
    const channel = supabase
      .channel('credits-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'available_credits',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Credits updated:', payload);
          if (payload.new && typeof payload.new === 'object' && 'available_credits' in payload.new) {
            setCredits(payload.new as UserCredits);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || loading) return null;

  const creditsCount = credits?.available_credits ?? 0;
  const maxCredits = 10; // Daily limit for free tier
  const progressPercentage = Math.min((creditsCount / maxCredits) * 100, 100);
  const isLowCredits = creditsCount <= 3;

  return (
    <div className="px-4 py-3 border-b border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Coins className={`w-4 h-4 ${isLowCredits ? 'text-yellow-400' : 'text-accent'}`} />
          <span className="text-white text-sm font-medium">Available Credits</span>
        </div>
        <Badge 
          className={`font-semibold ${
            isLowCredits 
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
              : 'bg-accent/20 text-accent border-accent/30'
          }`}
        >
          {creditsCount}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-700"
        />
        <p className="text-gray-400 text-xs">
          {creditsCount < 10 ? 'Resets daily to 10 credits' : 'Daily limit reached'}
        </p>
      </div>
    </div>
  );
};

export default CreditsBar;