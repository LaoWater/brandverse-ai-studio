import { Badge } from '@/components/ui/badge';
import { Zap, Building2, TrendingUp, Target } from 'lucide-react';
import type { MarketingPlan, MarketingPlanItem } from '@/services/seoService';

interface MarketingPlanSectionProps {
  plan: MarketingPlan;
}

const TIER_CONFIG = {
  quick_wins: {
    icon: Zap,
    title: 'Quick Wins',
    subtitle: 'Do this week',
    color: 'text-green-400',
    borderColor: 'border-green-500/20',
    bgColor: 'bg-green-500/5',
  },
  foundation: {
    icon: Building2,
    title: 'Foundation Fixes',
    subtitle: 'Build the base',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/5',
  },
  growth: {
    icon: TrendingUp,
    title: 'Growth Engines',
    subtitle: 'Scale up',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    bgColor: 'bg-purple-500/5',
  },
  long_term: {
    icon: Target,
    title: 'Long-Term Positioning',
    subtitle: 'Strategic moves',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/5',
  },
};

const EFFORT_BADGE: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-red-500/20 text-red-400',
};

const IMPACT_BADGE: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-green-500/20 text-green-400',
};

const PlanTier = ({ tier, items }: { tier: keyof typeof TIER_CONFIG; items: MarketingPlanItem[] }) => {
  if (!items || items.length === 0) return null;

  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.title}</span>
        <span className="text-xs text-gray-500 ml-1">{config.subtitle}</span>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="text-sm font-medium text-white flex-1">{item.action}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.effort && (
                  <Badge className={`text-[10px] px-1.5 py-0 ${EFFORT_BADGE[item.effort] || EFFORT_BADGE.medium}`}>
                    {item.effort} effort
                  </Badge>
                )}
                {item.impact && (
                  <Badge className={`text-[10px] px-1.5 py-0 ${IMPACT_BADGE[item.impact] || IMPACT_BADGE.medium}`}>
                    {item.impact} impact
                  </Badge>
                )}
              </div>
            </div>
            {item.details && (
              <p className="text-xs text-gray-400">{item.details}</p>
            )}
            {item.timeframe && (
              <span className="text-[10px] text-gray-500 mt-1 inline-block">{item.timeframe}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketingPlanSection: React.FC<MarketingPlanSectionProps> = ({ plan }) => {
  const hasPlan = plan && (
    (plan.quick_wins && plan.quick_wins.length > 0) ||
    (plan.foundation && plan.foundation.length > 0) ||
    (plan.growth && plan.growth.length > 0) ||
    (plan.long_term && plan.long_term.length > 0)
  );

  if (!hasPlan) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No marketing plan data available. Run a new analysis to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plan.quick_wins && <PlanTier tier="quick_wins" items={plan.quick_wins} />}
      {plan.foundation && <PlanTier tier="foundation" items={plan.foundation} />}
      {plan.growth && <PlanTier tier="growth" items={plan.growth} />}
      {plan.long_term && <PlanTier tier="long_term" items={plan.long_term} />}
    </div>
  );
};

export default MarketingPlanSection;
