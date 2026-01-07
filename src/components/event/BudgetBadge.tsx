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
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    iconColor: 'text-green-600'
  },
  moderate: { 
    icon: Minus, 
    label: 'Moderate',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600'
  },
  premium: { 
    icon: TrendingUp, 
    label: 'Premium',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600'
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
