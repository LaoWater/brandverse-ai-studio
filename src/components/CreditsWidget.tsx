import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Coins,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Crown,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserCredits, UserCredits } from "@/services/creditsService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CreditsWidgetProps {
  /**
   * The cost of the current operation (e.g., generation cost)
   * If provided, shows a preview of the deduction
   */
  operationCost?: number;

  /**
   * Label for the operation (e.g., "This Generation", "Selected Model")
   */
  operationLabel?: string;

  /**
   * If true, shows expanded view with more details
   */
  expanded?: boolean;

  /**
   * Callback when user wants to upgrade
   */
  onUpgrade?: () => void;

  /**
   * Compact mode - minimal UI for navigation bars
   */
  compact?: boolean;
}

const CreditsWidget = ({
  operationCost,
  operationLabel = "This Generation",
  expanded = false,
  onUpgrade,
  compact = false,
}: CreditsWidgetProps) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(expanded);
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
      .channel("credits-widget-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "available_credits",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Credits updated:", payload);
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "available_credits" in payload.new
          ) {
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
  const remainingAfterOperation = operationCost
    ? Math.max(0, creditsCount - operationCost)
    : creditsCount;
  const maxDailyCredits = 10; // Free tier daily limit
  const isLowCredits = creditsCount <= 3;
  const cannotAfford = operationCost ? creditsCount < operationCost : false;

  const progressPercentage = Math.min(
    (creditsCount / maxDailyCredits) * 100,
    100
  );
  const remainingPercentage = Math.min(
    (remainingAfterOperation / maxDailyCredits) * 100,
    100
  );

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/pricing");
    }
  };

  // Compact mode for navigation bar
  if (compact) {
    return (
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="relative flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-all"
      >
        <Coins
          className={`w-5 h-5 ${
            isLowCredits ? "text-yellow-400 animate-pulse" : "text-accent"
          }`}
        />
        <Badge
          className={`font-semibold ${
            isLowCredits
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-accent/20 text-accent border-accent/30"
          }`}
        >
          {creditsCount}
        </Badge>
        {operationCost && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ArrowRight className="w-3 h-3" />
            <span
              className={cannotAfford ? "text-red-400 font-semibold" : ""}
            >
              {remainingAfterOperation}
            </span>
          </div>
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>
    );
  }

  // Full card view
  return (
    <Card
      className={`border-0 overflow-hidden transition-all ${
        cannotAfford
          ? "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30"
          : isLowCredits
          ? "bg-gradient-to-br from-yellow-500/10 to-orange-600/5 border-yellow-500/20"
          : "cosmic-card"
      }`}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isLowCredits
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-accent/20 text-accent"
              }`}
            >
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                Available Credits
              </h3>
              <p className="text-gray-400 text-xs">Resets daily at midnight</p>
            </div>
          </div>
          <Badge
            className={`text-2xl font-bold px-4 py-2 ${
              isLowCredits
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-accent/20 text-accent border-accent/30"
            }`}
          >
            {creditsCount}
          </Badge>
        </div>

        {/* Progress Bar - Current Credits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Daily Limit</span>
            <span className="text-gray-400">
              {creditsCount} / {maxDailyCredits}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-700" />
        </div>

        {/* Operation Cost Preview */}
        {operationCost !== undefined && operationCost > 0 && (
          <div
            className={`p-4 rounded-lg border ${
              cannotAfford
                ? "bg-red-500/10 border-red-500/30"
                : "bg-primary/10 border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-white font-medium">
                <Sparkles className="w-4 h-4 text-accent" />
                {operationLabel}
              </div>
              <Badge
                variant="outline"
                className={`font-semibold ${
                  cannotAfford
                    ? "text-red-400 border-red-500/30"
                    : "text-accent border-accent/30"
                }`}
              >
                -{operationCost} credits
              </Badge>
            </div>

            {/* Deduction Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">After Generation</span>
                <span
                  className={`font-semibold ${
                    cannotAfford ? "text-red-400" : "text-white"
                  }`}
                >
                  {remainingAfterOperation} credits remaining
                </span>
              </div>
              <Progress
                value={remainingPercentage}
                className={`h-2 ${
                  cannotAfford ? "bg-red-900/50" : "bg-gray-700"
                }`}
              />
            </div>

            {/* Insufficient Credits Warning */}
            {cannotAfford && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 text-xs font-medium">
                    Insufficient Credits
                  </p>
                  <p className="text-red-300/80 text-xs mt-1">
                    You need {operationCost - creditsCount} more credits for
                    this generation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Reset Info */}
        {creditsCount < maxDailyCredits && !cannotAfford && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-400 text-xs font-medium">
                Free Daily Credits
              </p>
              <p className="text-blue-300/80 text-xs mt-1">
                Get up to {maxDailyCredits} free credits daily. Resets at
                midnight.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {(isLowCredits || cannotAfford) && (
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-lg group transition-all"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade for Unlimited Credits
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}

        {/* Quick Links */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => navigate("/my-plan")}
            variant="ghost"
            className="flex-1 text-gray-400 hover:text-white hover:bg-white/10 text-xs py-2"
          >
            My Plan
          </Button>
          <Button
            onClick={handleUpgrade}
            variant="ghost"
            className="flex-1 text-accent hover:text-accent/80 hover:bg-accent/10 text-xs py-2"
          >
            Pricing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditsWidget;
