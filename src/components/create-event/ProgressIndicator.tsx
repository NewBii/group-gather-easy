import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
  optional?: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressIndicator = ({ steps, currentStep }: ProgressIndicatorProps) => {
  return (
    <div className="w-full mb-8 md:mb-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          
          return (
            <div key={step.number} className="flex flex-1 items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  )}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
