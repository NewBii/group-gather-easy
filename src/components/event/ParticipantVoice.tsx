import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type SparkCategory = 'must_have' | 'nice_to_have' | 'dealbreaker';

interface ParticipantVoiceProps {
  eventId: string;
  participantId?: string;
  onSparkAdded?: () => void;
}

const categoryConfig: Record<SparkCategory, { label: string; labelFr: string; color: string; description: string; descriptionFr: string }> = {
  must_have: {
    label: 'Must-Have',
    labelFr: 'Indispensable',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    description: 'Non-negotiables like accessibility or dietary',
    descriptionFr: 'Non négociables comme accessibilité ou régimes',
  },
  nice_to_have: {
    label: 'Nice-to-Have',
    labelFr: 'Bonus',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    description: 'Vibe suggestions like a fireplace',
    descriptionFr: 'Suggestions d\'ambiance comme une cheminée',
  },
  dealbreaker: {
    label: 'Dealbreaker',
    labelFr: 'Rédhibitoire',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    description: 'Dates or regions that won\'t work',
    descriptionFr: 'Dates ou lieux impossibles',
  },
};

export const ParticipantVoice = ({ eventId, participantId, onSparkAdded }: ParticipantVoiceProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [sparkText, setSparkText] = useState('');
  const [category, setCategory] = useState<SparkCategory>('nice_to_have');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    addButton: language === 'fr' ? 'Quelque chose manque ? Ajoutez un souhait' : 'Something I missed? Add a requirement',
    placeholder: language === 'fr' ? 'Ex: "Doit avoir une piscine" ou "Options véganes"' : 'e.g., "Must have a pool" or "Vegan friendly"',
    submit: language === 'fr' ? 'Ajouter à la liste' : 'Add to Wishlist',
    submitted: language === 'fr' ? 'Ajouté !' : 'Added!',
    joinFirst: language === 'fr' ? 'Rejoignez l\'événement pour ajouter' : 'Join the event first',
    error: language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding spark',
    charLimit: language === 'fr' ? 'caractères max' : 'chars max',
  };

  const handleSubmit = async () => {
    if (!participantId) {
      toast({ title: t.joinFirst, variant: 'destructive' });
      return;
    }

    if (!sparkText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('participant_sparks').insert({
        event_id: eventId,
        participant_id: participantId,
        spark_text: sparkText.trim(),
        category,
      });

      if (error) throw error;

      toast({ title: t.submitted });
      setSparkText('');
      setIsOpen(false);
      onSparkAdded?.();
    } catch (error) {
      console.error('Error adding spark:', error);
      toast({ title: t.error, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between group hover:border-primary/50"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t.addButton}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 space-y-4">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryConfig) as SparkCategory[]).map((cat) => {
            const config = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  category === cat
                    ? config.color + ' ring-2 ring-offset-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {language === 'fr' ? config.labelFr : config.label}
              </button>
            );
          })}
        </div>

        {/* Category description */}
        <p className="text-sm text-muted-foreground">
          {language === 'fr'
            ? categoryConfig[category].descriptionFr
            : categoryConfig[category].description}
        </p>

        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            value={sparkText}
            onChange={(e) => setSparkText(e.target.value.slice(0, 200))}
            placeholder={t.placeholder}
            className="resize-none"
            rows={2}
            disabled={!participantId || isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {sparkText.length}/200 {t.charLimit}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!participantId || !sparkText.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t.submit}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
