import { useState } from 'react';
import { Bot, ArrowRight, Users, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/i18n/LanguageContext';

export interface ClarifyQuestion {
  dimension: 'when' | 'who' | 'what' | 'where' | 'budget';
  question: string;
  answerType: 'chips' | 'text' | 'chips+text';
  chips?: string[];
}

interface SparkClarifyProps {
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onDone: () => void;
}

const dimensionIcons: Record<string, string> = {
  when: '📅',
  who: '👥',
  what: '🎯',
  where: '📍',
  budget: '💶',
};

const WHO_CONSTRAINTS = ['kids', 'dietary', 'mobility'];

export const SparkClarify = ({ questions, answers, onAnswersChange, onDone }: SparkClarifyProps) => {
  const { language } = useLanguage();
  const [headcount, setHeadcount] = useState(6);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);

  const constraintLabels: Record<string, string> = language === 'fr'
    ? { kids: 'Enfants', dietary: 'Régime alimentaire', mobility: 'Mobilité réduite', none: 'Aucune' }
    : { kids: 'Kids', dietary: 'Dietary needs', mobility: 'Limited mobility', none: 'None' };

  const allAnswered = questions.every(q => answers[q.dimension]?.trim());
  const doneLabel = language === 'fr' ? 'Continuer' : 'Continue';

  const setAnswer = (dim: string, val: string) => {
    onAnswersChange({ ...answers, [dim]: val });
  };

  const handleWhoChange = (count: number, constraints: string[]) => {
    const constraintStr = constraints.length > 0
      ? ` (${constraints.map(c => constraintLabels[c]).join(', ')})`
      : '';
    setAnswer('who', `~${count} people${constraintStr}`);
  };

  const renderQuestionInput = (q: ClarifyQuestion) => {
    if (q.dimension === 'who') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => { const v = Math.max(2, headcount - 1); setHeadcount(v); handleWhoChange(v, selectedConstraints); }}
            ><Minus className="w-3 h-3" /></Button>
            <span className="text-lg font-semibold w-8 text-center">{headcount}</span>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => { const v = Math.min(50, headcount + 1); setHeadcount(v); handleWhoChange(v, selectedConstraints); }}
            ><Plus className="w-3 h-3" /></Button>
            <div className="flex gap-1">
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => { setHeadcount(n); handleWhoChange(n, selectedConstraints); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${headcount === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                >{n}{n === 20 ? '+' : ''}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {WHO_CONSTRAINTS.map(c => (
              <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedConstraints.includes(c)}
                  onCheckedChange={(checked) => {
                    const next = checked ? [...selectedConstraints, c] : selectedConstraints.filter(x => x !== c);
                    setSelectedConstraints(next);
                    handleWhoChange(headcount, next);
                  }}
                />
                {constraintLabels[c]}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {q.chips && q.chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {q.chips.map(chip => (
              <button
                key={chip}
                onClick={() => setAnswer(q.dimension, chip)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  answers[q.dimension] === chip
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background hover:bg-muted'
                }`}
              >{chip}</button>
            ))}
          </div>
        )}
        {(q.answerType === 'text' || q.answerType === 'chips+text') && (
          <Input
            value={q.chips?.includes(answers[q.dimension] || '') ? '' : (answers[q.dimension] || '')}
            onChange={(e) => setAnswer(q.dimension, e.target.value)}
            placeholder={language === 'fr' ? 'Ou tapez votre réponse...' : 'Or type your answer...'}
            className="text-sm"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {questions.map((q, i) => (
        <div key={q.dimension} className="flex gap-3 items-start" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm font-medium">
                {dimensionIcons[q.dimension]} {q.question}
              </p>
            </div>
            <div className="pl-1">
              {renderQuestionInput(q)}
            </div>
          </div>
        </div>
      ))}

      <div className="pt-4 flex justify-end">
        <Button onClick={onDone} disabled={!allAnswered} className="gap-2">
          {doneLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
