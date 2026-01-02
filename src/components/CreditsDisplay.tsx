
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Coins, CreditCard, Crown, ChevronDown, Clock, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserCredits, UserCredits } from "@/services/creditsService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CreditsDisplayProps {
  /**
   * Cost of current operation (e.g., for generation preview)
   */
  operationCost?: number;
}

const CreditsDisplay = ({ operationCost }: CreditsDisplayProps) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      .channel('credits-display-updates')
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
  const maxDailyCredits = 10;
  const isLowCredits = creditsCount <= 3;
  const remainingAfterOperation = operationCost ? Math.max(0, creditsCount - operationCost) : creditsCount;
  const cannotAfford = operationCost ? creditsCount < operationCost : false;

  const progressPercentage = Math.min((creditsCount / maxDailyCredits) * 100, 100);
  const remainingPercentage = Math.min((remainingAfterOperation / maxDailyCredits) * 100, 100);

  // Calculate time until midnight for reset
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const hoursUntilReset = Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor(((midnight.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg group transition-all"
        >
          {/* Gradient glow effect */}
          <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
            isLowCredits
              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
              : 'bg-gradient-to-r from-accent/20 to-primary/20'
          }`} />

          <div className="flex items-center space-x-2 relative z-10">
            <div className="relative">
              <Coins className={`w-5 h-5 ${isLowCredits ? 'text-yellow-400 animate-pulse' : 'text-accent'}`} />
              {operationCost && operationCost > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
              )}
            </div>
            <Badge
              className={`font-semibold bg-gradient-to-r ${
                cannotAfford
                  ? 'from-red-500/30 to-red-600/30 text-red-400 border-red-500/40'
                  : isLowCredits
                  ? 'from-yellow-500/30 to-orange-500/30 text-yellow-400 border-yellow-500/40'
                  : 'from-accent/30 to-primary/30 text-accent border-accent/40'
              }`}
            >
              {creditsCount}
            </Badge>
          </div>
          <ChevronDown className="w-4 h-4 relative z-10" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-card/95 backdrop-blur-sm border-primary/20 p-0">
        {/* Header with gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
          <div className="relative px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
                  <Coins className={`w-5 h-5 ${isLowCredits ? 'text-yellow-400' : 'text-accent'}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Available Credits</h3>
                  <p className="text-gray-400 text-xs">Daily free tier</p>
                </div>
              </div>
              <Badge
                className={`text-xl font-bold px-3 py-1 bg-gradient-to-r ${
                  cannotAfford
                    ? 'from-red-500/30 to-red-600/30 text-red-400 border-red-500/40'
                    : isLowCredits
                    ? 'from-yellow-500/30 to-orange-500/30 text-yellow-400 border-yellow-500/40'
                    : 'from-accent/30 to-primary/30 text-accent border-accent/40'
                }`}
              >
                {creditsCount}
              </Badge>
            </div>

            {/* Progress bar with gradient */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Daily limit</span>
                <span className="text-gray-300 font-medium">{creditsCount} / {maxDailyCredits}</span>
              </div>
              <div className="relative">
                <Progress
                  value={progressPercentage}
                  className="h-2 bg-gray-800"
                />
                {/* Gradient overlay on progress */}
                <div
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-accent via-primary to-accent transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operation Cost Preview */}
        {operationCost !== undefined && operationCost > 0 && (
          <>
            <DropdownMenuSeparator className="bg-primary/20 my-0" />
            <div className={`px-4 py-3 ${cannotAfford ? 'bg-red-500/5' : 'bg-accent/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className={`w-4 h-4 ${cannotAfford ? 'text-red-400' : 'text-accent'}`} />
                  <span className={`font-medium ${cannotAfford ? 'text-red-400' : 'text-white'}`}>
                    {location.pathname.includes('media-studio') ? 'Image Generation' : 'Next Action'}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    cannotAfford
                      ? 'text-red-400 border-red-500/40'
                      : 'text-accent border-accent/40'
                  }`}
                >
                  -{operationCost} credits
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">After action</span>
                  <span className={`font-semibold ${cannotAfford ? 'text-red-400' : 'text-white'}`}>
                    {remainingAfterOperation} remaining
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={remainingPercentage}
                    className={`h-1.5 ${cannotAfford ? 'bg-red-900/30' : 'bg-gray-800'}`}
                  />
                  <div
                    className={`absolute top-0 left-0 h-1.5 rounded-full transition-all ${
                      cannotAfford
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-accent/70 to-primary/70'
                    }`}
                    style={{ width: `${remainingPercentage}%` }}
                  />
                </div>
              </div>

              {cannotAfford && (
                <div className="flex items-start gap-2 mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-xs leading-tight">
                    Need {operationCost - creditsCount} more credits
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Info Section */}
        <DropdownMenuSeparator className="bg-primary/20 my-0" />
        <div className="px-4 py-3 space-y-2">
          {/* Reset Timer */}
          {creditsCount < maxDailyCredits && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/30 cursor-help hover:bg-blue-500/15 transition-colors">
                    <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-blue-400 text-xs font-medium">Resets in {hoursUntilReset}h {minutesUntilReset}m</p>
                      <p className="text-blue-300/80 text-xs mt-0.5">Back to {maxDailyCredits} credits at midnight</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card border-primary/20">
                  <p className="text-xs">Credits reset daily at 00:00</p>
                  <p className="text-xs text-gray-400 mt-1">Free tier: {maxDailyCredits} credits/day</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Unlimited Credits Promo */}
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
               onClick={() => navigate('/pricing')}>
            <TrendingUp className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-accent text-xs font-medium">Want unlimited?</p>
              <p className="text-gray-300 text-xs mt-0.5">Upgrade for unlimited credits</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenuSeparator className="bg-primary/20 my-0" />
        <div className="p-2">
          <DropdownMenuItem
            onClick={() => navigate('/my-plan')}
            className="text-white hover:bg-white/10 cursor-pointer rounded-lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            My Plan & Usage
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/pricing')}
            className="text-accent hover:bg-accent/10 cursor-pointer rounded-lg font-medium"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreditsDisplay;
