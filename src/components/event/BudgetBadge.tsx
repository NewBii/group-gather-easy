import { Euro, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BudgetInfo {
  accommodation_per_night?: number;
  meals_per_day?: number;
  total_weekend?: number;
  budget_tier?: 'budget' | 'moderate' | 'premium';
}

interface BudgetBadgeProps {
  budget: BudgetInfo;
  className?: string;
  showDetails?: boolean;
}

const budgetTierConfig = {
  budget: { 
    icon: TrendingDown, 
    label: 'Budget-Friendly',
    color: 'bg-muted text-muted-foreground border-border',
    iconColor: 'text-muted-foreground'
  },
  moderate: { 
    icon: Minus, 
    label: 'Moderate',
    color: 'bg-muted text-muted-foreground border-border',
    iconColor: 'text-muted-foreground'
  },
  premium: { 
    icon: TrendingUp, 
    label: 'Premium',
    color: 'bg-muted text-muted-foreground border-border',
    iconColor: 'text-muted-foreground'
  },
};

export const BudgetBadge = ({ budget, className, showDetails = false }: BudgetBadgeProps) => {
  if (!budget?.total_weekend && !budget?.budget_tier) return null;

  const tier = budget.budget_tier || 'moderate';
  const config = budgetTierConfig[tier];
  const TierIcon = config.icon;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Badge 
        variant="outline" 
        className={cn('gap-1.5 font-medium', config.color)}
      >
        <Euro className="h-3 w-3" />
        {budget.total_weekend ? (
          <span>~€{budget.total_weekend}/person</span>
        ) : (
          <span>{config.label}</span>
        )}
        <TierIcon className={cn('h-3 w-3 ml-0.5', config.iconColor)} />
      </Badge>
      
      {showDetails && (budget.accommodation_per_night || budget.meals_per_day) && (
        <div className="text-xs text-muted-foreground pl-1">
          {budget.accommodation_per_night && (
            <span>🏨 €{budget.accommodation_per_night}/night</span>
          )}
          {budget.accommodation_per_night && budget.meals_per_day && ' • '}
          {budget.meals_per_day && (
            <span>🍽️ €{budget.meals_per_day}/day</span>
          )}
        </div>
      )}
    </div>
  );
};
