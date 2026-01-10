
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles } from "lucide-react";
import { getUserCredits, UserCredits } from "@/services/creditsService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreditsBar = () => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="relative overflow-hidden border-b border-primary/20">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />

      <div className="relative px-4 py-3">
        {/* Header row with credits */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-md bg-gradient-to-br ${
              isLowCredits
                ? 'from-yellow-500/20 to-orange-500/20'
                : 'from-accent/20 to-primary/20'
            }`}>
              <Coins className={`w-4 h-4 ${isLowCredits ? 'text-yellow-400' : 'text-accent'}`} />
            </div>
            <span className="text-white text-sm font-medium">Credits</span>
          </div>
          <Badge
            className={`font-bold text-base px-2.5 py-0.5 bg-gradient-to-r ${
              isLowCredits
                ? 'from-yellow-500/25 to-orange-500/25 text-yellow-400 border-yellow-500/40'
                : 'from-accent/25 to-primary/25 text-accent border-accent/40'
            }`}
          >
            {creditsCount}
          </Badge>
        </div>

        {/* Progress bar with gradient overlay */}
        <div className="space-y-1.5 mb-3">
          <div className="relative">
            <Progress
              value={progressPercentage}
              className="h-1.5 bg-gray-800/60"
            />
            <div
              className={`absolute top-0 left-0 h-1.5 rounded-full transition-all bg-gradient-to-r ${
                isLowCredits
                  ? 'from-yellow-500 to-orange-500'
                  : 'from-accent via-primary to-accent'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-xs">
              {creditsCount < 10 ? 'Daily limit' : 'Limit reached'}
            </p>
            <p className="text-gray-500 text-xs">{creditsCount}/{maxCredits}</p>
          </div>
        </div>

        {/* Credit Packs quick link */}
        <button
          onClick={() => navigate('/pricing')}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md
                     bg-gradient-to-r from-accent/15 to-primary/15
                     hover:from-accent/25 hover:to-primary/25
                     border border-accent/30 hover:border-accent/50
                     text-accent text-xs font-medium
                     transition-all duration-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Credit Packs
        </button>
      </div>
    </div>
  );
};

export default CreditsBar;
