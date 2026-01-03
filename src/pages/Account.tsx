import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { clearParticipantStorage } from '@/hooks/useParticipant';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Bell } from 'lucide-react';

interface NotificationPreferences {
  event_updates: boolean;
  new_participants: boolean;
  voting_reminders: boolean;
  event_finalized: boolean;
}

const defaultPreferences: NotificationPreferences = {
  event_updates: true,
  new_participants: true,
  voting_reminders: true,
  event_finalized: true,
};

const Account = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(defaultPreferences);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch notification preferences when user is available
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.notification_preferences) {
        const prefs = data.notification_preferences as Record<string, unknown>;
        setNotificationPrefs({
          event_updates: typeof prefs.event_updates === 'boolean' ? prefs.event_updates : true,
          new_participants: typeof prefs.new_participants === 'boolean' ? prefs.new_participants : true,
          voting_reminders: typeof prefs.voting_reminders === 'boolean' ? prefs.voting_reminders : true,
          event_finalized: typeof prefs.event_finalized === 'boolean' ? prefs.event_finalized : true,
        });
      }
    };

    fetchPreferences();
  }, [user]);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    setIsSavingPrefs(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPrefs })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(t.account.notifications.saveSuccess);
    } catch (error) {
      // Revert on error
      setNotificationPrefs(notificationPrefs);
      toast.error(t.account.notifications.saveError);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete user's participants entries
      await supabase
        .from('participants')
        .delete()
        .eq('user_id', user.id);

      // Delete user's profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      // Delete events created by the user
      await supabase
        .from('events')
        .delete()
        .eq('created_by', user.id);

      // Clear participant localStorage entries
      clearParticipantStorage();

      // Sign out the user
      await supabase.auth.signOut();

      toast.success(t.account.deleteSuccess);
      navigate('/');
    } catch (error) {
      toast.error(t.account.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const confirmRequired = 'DELETE';

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.account.title}</h1>
          <p className="text-muted-foreground">{t.account.subtitle}</p>
        </div>

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.account.infoTitle}</CardTitle>
            <CardDescription>{t.account.infoDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.auth.email}</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.account.createdAt}</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t.account.notifications.title}
            </CardTitle>
            <CardDescription>{t.account.notifications.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event_updates">{t.account.notifications.eventUpdates}</Label>
                <p className="text-sm text-muted-foreground">{t.account.notifications.eventUpdatesDesc}</p>
              </div>
              <Switch
                id="event_updates"
                checked={notificationPrefs.event_updates}
                onCheckedChange={(checked) => handlePreferenceChange('event_updates', checked)}
                disabled={isSavingPrefs}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new_participants">{t.account.notifications.newParticipants}</Label>
                <p className="text-sm text-muted-foreground">{t.account.notifications.newParticipantsDesc}</p>
              </div>
              <Switch
                id="new_participants"
                checked={notificationPrefs.new_participants}
                onCheckedChange={(checked) => handlePreferenceChange('new_participants', checked)}
                disabled={isSavingPrefs}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voting_reminders">{t.account.notifications.votingReminders}</Label>
                <p className="text-sm text-muted-foreground">{t.account.notifications.votingRemindersDesc}</p>
              </div>
              <Switch
                id="voting_reminders"
                checked={notificationPrefs.voting_reminders}
                onCheckedChange={(checked) => handlePreferenceChange('voting_reminders', checked)}
                disabled={isSavingPrefs}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="event_finalized">{t.account.notifications.eventFinalized}</Label>
                <p className="text-sm text-muted-foreground">{t.account.notifications.eventFinalizedDesc}</p>
              </div>
              <Switch
                id="event_finalized"
                checked={notificationPrefs.event_finalized}
                onCheckedChange={(checked) => handlePreferenceChange('event_finalized', checked)}
                disabled={isSavingPrefs}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delete Data Card */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t.account.dangerZone}
            </CardTitle>
            <CardDescription>{t.account.dangerDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t.account.deleteButton}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.account.deleteConfirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>{t.account.deleteConfirmDescription}</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>{t.account.deleteItem1}</li>
                      <li>{t.account.deleteItem2}</li>
                      <li>{t.account.deleteItem3}</li>
                    </ul>
                    <p className="font-medium">{t.account.deleteConfirmInstruction}</p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={confirmRequired}
                      className="mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText('')}>
                    {t.common.cancel}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={confirmText !== confirmRequired || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? t.common.loading : t.account.deleteButton}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;
