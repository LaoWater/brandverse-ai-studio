
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, CreditCard, Crown, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserCredits, UserCredits } from "@/services/creditsService";
import { useAuth } from "@/contexts/AuthContext";

const CreditsDisplay = () => {
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
  }, [user]);

  const refreshCredits = async () => {
    if (!user) return;
    const userCredits = await getUserCredits();
    setCredits(userCredits);
  };

  if (!user || loading) return null;

  const creditsCount = credits?.available_credits ?? 0;
  const isLowCredits = creditsCount <= 3;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2"
        >
          <div className="flex items-center space-x-2">
            <Coins className={`w-5 h-5 ${isLowCredits ? 'text-yellow-400' : 'text-accent'}`} />
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
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-card border-primary/20">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Available Credits</span>
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
          <p className="text-gray-400 text-xs mt-1">
            Resets daily if under 10 credits
          </p>
        </div>
        
        <DropdownMenuSeparator className="bg-primary/20" />
        
        <DropdownMenuItem 
          onClick={() => navigate('/my-plan')}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          My Plan
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/pricing')}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreditsDisplay;
