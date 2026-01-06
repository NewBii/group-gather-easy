import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { CurrentParticipant } from '@/hooks/useParticipant';

const joinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
});

type JoinFormValues = z.infer<typeof joinSchema>;

interface ParticipantJoinFormProps {
  eventSlug: string;
  onJoin: (name: string, email?: string) => Promise<CurrentParticipant | null>;
  currentParticipant: CurrentParticipant | null;
}

export const ParticipantJoinForm = ({ eventSlug, onJoin, currentParticipant }: ParticipantJoinFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'solved' | 'error'>('idle');
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Fetch site key on mount
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-turnstile-sitekey');
        if (!error && data?.siteKey) {
          setTurnstileSiteKey(data.siteKey);
        }
      } catch (err) {
        console.error('Failed to fetch Turnstile site key:', err);
      }
    };
    fetchSiteKey();
  }, []);

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });

      if (error) {
        console.error('Turnstile verification error:', error);
        return false;
      }

      return data?.success === true;
    } catch (err) {
      console.error('Error calling verify-turnstile:', err);
      return false;
    }
  };

  const onSubmit = async (values: JoinFormValues) => {
    // Skip CAPTCHA verification if no site key is configured
    if (turnstileSiteKey && !turnstileToken) {
      toast({
        title: t.eventPage.join.captchaRequired,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Verify CAPTCHA if configured
      if (turnstileSiteKey && turnstileToken) {
        const isValid = await verifyTurnstile(turnstileToken);
        if (!isValid) {
          toast({
            title: t.eventPage.join.captchaFailed,
            variant: 'destructive',
          });
          // Reset the widget
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setTurnstileStatus('idle');
          return;
        }
      }

      await onJoin(values.name, values.email || undefined);
      toast({
        title: t.eventPage.join.success,
      });
    } catch (err: unknown) {
      console.error('Error joining event:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        title: t.eventPage.join.error,
        description: errorMessage,
        variant: 'destructive',
      });
      // Reset CAPTCHA on error
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setTurnstileStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already joined
  if (currentParticipant) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              {t.eventPage.join.welcomeBack.replace('{name}', currentParticipant.name)}
            </p>
            {!currentParticipant.user_id && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/auth?returnTo=/event/${eventSlug}`}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {t.eventPage.join.orLogin}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/auth?returnTo=/event/${eventSlug}`}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t.eventPage.join.orCreateAccount}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.eventPage.join.title}</CardTitle>
        <CardDescription>
          {t.eventPage.join.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.eventPage.join.yourName}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t.eventPage.join.namePlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.eventPage.join.yourEmail}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder={t.eventPage.join.emailPlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {turnstileSiteKey && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setTurnstileStatus('solved');
                  }}
                  onError={() => {
                    setTurnstileToken(null);
                    setTurnstileStatus('error');
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                    setTurnstileStatus('idle');
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={isSubmitting || (turnstileSiteKey && turnstileStatus !== 'solved')} 
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t.eventPage.join.joinButton}
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{t.eventPage.join.or}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/auth?returnTo=/event/${eventSlug}`}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {t.eventPage.join.orLogin}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/auth?returnTo=/event/${eventSlug}`}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t.eventPage.join.orCreateAccount}
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
