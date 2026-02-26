import { useState, useEffect, useCallback } from 'react';
import { Bot, ArrowRight, Users, Minus, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

export interface ClarifyQuestion {
  dimension: 'when' | 'who' | 'what' | 'where' | 'budget';
  subStep?: string;
  question: string;
  answerType: 'chips' | 'text' | 'chips+text';
  chips?: string[];
  multiSelect?: boolean;
}

interface SparkClarifyProps {
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onDone: () => void;
  totalQuestions?: number;
}

const dimensionIcons: Record<string, string> = {
  when: '📅',
  who: '👥',
  what: '🎯',
  where: '📍',
  budget: '💶',
};

const dimensionLabels: Record<string, Record<string, string>> = {
  fr: { when: 'Quand', who: 'Qui', what: 'Quoi', where: 'Où', budget: 'Budget' },
  en: { when: 'When', who: 'Who', what: 'What', where: 'Where', budget: 'Budget' },
};

const getAnswerKey = (q: ClarifyQuestion) => q.subStep || q.dimension;
const UNDECIDED = '__undecided__';

export const SparkClarify = ({ questions, answers, onAnswersChange, onDone, totalQuestions }: SparkClarifyProps) => {
  const { language } = useLanguage();
  const undecidedLabel = language === 'fr' ? 'Je ne sais pas encore' : "I don't know yet";
  const undecidedSummary = language === 'fr' ? 'À décider avec le groupe' : 'To decide with the group';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [headcount, setHeadcount] = useState(6);

  const total = totalQuestions || questions.length;
  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const key = current ? getAnswerKey(current) : '';
  const currentAnswer = answers[key] || '';

  // Typing indicator effect
  useEffect(() => {
    setIsTyping(true);
    setQuestionVisible(false);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setTimeout(() => setQuestionVisible(true), 50);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Pre-select defaults for who_needs
  useEffect(() => {
    if (current?.subStep === 'who_needs' && !answers[key]) {
      const defaultChip = language === 'fr' ? 'Rien de particulier' : 'Nothing specific';
      onAnswersChange({ ...answers, [key]: defaultChip });
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = useCallback((val: string) => {
    onAnswersChange({ ...answers, [key]: val });
  }, [answers, key, onAnswersChange]);

  const selectUndecided = useCallback(() => {
    setAnswer(UNDECIDED);
  }, [setAnswer]);

  const toggleMultiSelect = useCallback((chip: string) => {
    const current = answers[key] || '';
    // If currently undecided, clear and select this chip
    if (current === UNDECIDED) {
      setAnswer(chip);
      return;
    }
    const selected = current ? current.split(' · ') : [];
    
    // "Rien de particulier" logic
    const nothingChip = language === 'fr' ? 'Rien de particulier' : 'Nothing specific';
    if (chip === nothingChip) {
      setAnswer(chip);
      return;
    }
    
    const filtered = selected.filter(s => s !== nothingChip);
    const next = filtered.includes(chip)
      ? filtered.filter(s => s !== chip)
      : [...filtered, chip];
    setAnswer(next.length > 0 ? next.join(' · ') : '');
  }, [answers, key, setAnswer, language]);

  const isChipSelected = (chip: string) => {
    const selected = currentAnswer.split(' · ');
    return selected.includes(chip);
  };

  const handleNext = () => {
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleEditAnswer = (idx: number) => {
    setCurrentIndex(idx);
  };

  const hasAnswer = currentAnswer.trim().length > 0;

  // Count answered so far (for "Question X sur Y")
  const questionNumber = currentIndex + 1;

  const nextLabel = isLast
    ? (language === 'fr' ? 'Valider mon événement →' : 'Confirm my event →')
    : (language === 'fr' ? 'Suivant →' : 'Next →');

  const questionCountLabel = language === 'fr'
    ? `Question ${questionNumber} sur ${total}`
    : `Question ${questionNumber} of ${total}`;

  // Render answered summary chips
  const renderAnsweredSummaries = () => {
    if (currentIndex === 0) return null;
    return (
      <div className="space-y-1.5 mb-4">
        {questions.slice(0, currentIndex).map((q, i) => {
          const k = getAnswerKey(q);
          const val = answers[k] || '';
          const displayVal = val === UNDECIDED ? undecidedSummary : val;
          const icon = dimensionIcons[q.dimension];
          const label = dimensionLabels[language === 'fr' ? 'fr' : 'en'][q.dimension];
          return (
            <div
              key={k}
              className="flex items-center gap-2 text-sm text-muted-foreground group cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleEditAnswer(i)}
            >
              <span>{icon}</span>
              <span className="font-medium">{label} :</span>
              <span className="truncate">{displayVal}</span>
              <span className="text-primary">✓</span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          );
        })}
      </div>
    );
  };

  // Typing indicator
  const renderTypingIndicator = () => (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 160, 320].map((delay) => (
            <div
              key={delay}
              className="w-2 h-2 rounded-full bg-muted-foreground"
              style={{
                animation: 'pulse-dot 1.4s ease-in-out infinite',
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Render WHO headcount sub-step
  const renderHeadcountInput = () => {
    const isUndecidedSelected = currentAnswer === UNDECIDED;
    return (
      <div className="space-y-3">
        {!isUndecidedSelected && (
          <>
            <div className="flex items-center gap-3 justify-center">
              <Button
                variant="outline" size="icon" className="h-10 w-10"
                onClick={() => {
                  const v = Math.max(2, headcount - 1);
                  setHeadcount(v);
                  setAnswer(`~${v}`);
                }}
              ><Minus className="w-4 h-4" /></Button>
              <span className="text-2xl font-semibold w-12 text-center">{headcount}</span>
              <Button
                variant="outline" size="icon" className="h-10 w-10"
                onClick={() => {
                  const v = Math.min(50, headcount + 1);
                  setHeadcount(v);
                  setAnswer(`~${v}`);
                }}
              ><Plus className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {language === 'fr'
                ? 'Une estimation suffit, vous affinerez avec le groupe.'
                : "A rough estimate is fine, you'll refine with the group."}
            </p>
          </>
        )}
        <div className="pt-1 flex justify-center">
          <button
            onClick={selectUndecided}
            className={`px-4 py-2.5 text-sm rounded-full transition-all min-h-[44px] sm:min-h-0
              ${isUndecidedSelected
                ? 'border-2 border-primary bg-primary/10 text-primary font-medium'
                : 'border border-dashed border-border text-muted-foreground hover:bg-muted'
              }
            `}
          >
            {undecidedLabel}
          </button>
        </div>
      </div>
    );
  };

  // Determine if a question should use multi-select
  const isMultiSelect = (q: ClarifyQuestion): boolean => {
    if (q.multiSelect !== undefined) return q.multiSelect;
    // Default: multi-select for where, what, who_composition, who_needs; single for budget, when
    if (q.dimension === 'budget') return false;
    if (q.dimension === 'when') return false;
    if (q.dimension === 'where' || q.dimension === 'what') return true;
    if (q.subStep === 'who_composition' || q.subStep === 'who_needs') return true;
    return false;
  };

  // Render chips (single or multi-select)
  const renderChips = (q: ClarifyQuestion) => {
    const multi = isMultiSelect(q);
    const isUndecidedSelected = currentAnswer === UNDECIDED;
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {q.chips?.map(chip => {
            const selected = isUndecidedSelected ? false : (multi ? isChipSelected(chip) : currentAnswer === chip);
            const nothingChip = language === 'fr' ? 'Rien de particulier' : 'Nothing specific';
            const isNothing = chip === nothingChip;
            return (
              <button
                key={chip}
                onClick={() => {
                  if (multi) toggleMultiSelect(chip);
                  else setAnswer(chip);
                }}
                className={`px-4 py-2.5 text-sm rounded-full transition-all min-h-[44px] sm:min-h-0
                  ${selected
                    ? 'border-2 border-primary bg-primary/10 text-primary font-medium'
                    : `border border-border bg-background text-foreground hover:bg-muted ${isNothing ? 'font-medium' : ''}`
                  }
                  max-w-full sm:max-w-none
                `}
                style={{ flexBasis: q.chips && q.chips.length <= 2 ? '100%' : undefined }}
              >
                {chip}
              </button>
            );
          })}
        </div>
        {/* Undecided chip */}
        <div className="pt-1">
          <button
            onClick={selectUndecided}
            className={`px-4 py-2.5 text-sm rounded-full transition-all min-h-[44px] sm:min-h-0
              ${isUndecidedSelected
                ? 'border-2 border-primary bg-primary/10 text-primary font-medium'
                : 'border border-dashed border-border text-muted-foreground hover:bg-muted'
              }
            `}
          >
            {undecidedLabel}
          </button>
        </div>
      </div>
    );
  };

  // Render current question input
  const renderQuestionInput = () => {
    if (!current) return null;

    // WHO headcount sub-step
    if (current.subStep === 'who_count') {
      return renderHeadcountInput();
    }

    // Standard chips + optional text
    return (
      <div className="space-y-3">
        {current.chips && current.chips.length > 0 && renderChips(current)}
        {(current.answerType === 'text' || current.answerType === 'chips+text') && (
          <Input
            value={current.chips?.includes(currentAnswer) ? '' : currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={language === 'fr' ? 'Ou tapez votre réponse...' : 'Or type your answer...'}
            className="text-sm"
          />
        )}
      </div>
    );
  };

  if (!current) return null;

  return (
    <div className="space-y-4">
      {/* Question counter */}
      <p className="text-xs text-muted-foreground text-center">
        {questionCountLabel}
      </p>

      {/* Answered summaries */}
      {renderAnsweredSummaries()}

      {/* Typing indicator or question */}
      {isTyping ? (
        renderTypingIndicator()
      ) : (
        <div
          className={`transition-all duration-300 ${questionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          {/* Question bubble */}
          <div className="flex gap-3 items-start mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
              <p className="text-sm font-medium">
                {dimensionIcons[current.dimension]} {current.question}
              </p>
            </div>
          </div>

          {/* Answer input */}
          <div className="pl-11">
            {renderQuestionInput()}
          </div>

          {/* Next button */}
          <div className={`pt-4 pl-11 transition-all duration-300 ${hasAnswer ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <Button
              onClick={handleNext}
              disabled={!hasAnswer}
              className="w-full sm:w-auto gap-2"
              size="lg"
            >
              {nextLabel}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Pulse dot keyframes */}
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
