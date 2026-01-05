import { useState, useEffect } from 'react';
import { Check, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  is_completed: boolean;
  assignee_name?: string;
}

interface TaskSplitterProps {
  eventId: string;
  participantId?: string;
  participantName?: string;
}

export const TaskSplitter = ({ eventId, participantId, participantName }: TaskSplitterProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('event_tasks')
      .select(`
        id,
        title,
        description,
        assigned_to,
        is_completed,
        participants!event_tasks_assigned_to_fkey (name)
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    const tasksWithAssignees = data?.map((task: any) => ({
      ...task,
      assignee_name: task.participants?.name,
    })) || [];

    setTasks(tasksWithAssignees);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('task-splitter')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_tasks',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleClaim = async (taskId: string) => {
    if (!participantId) {
      toast({
        title: 'Join the event first',
        variant: 'destructive',
      });
      return;
    }

    setClaiming(taskId);

    try {
      const { error } = await supabase
        .from('event_tasks')
        .update({ assigned_to: participantId })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Task claimed!',
      });
    } catch (error) {
      console.error('Error claiming task:', error);
      toast({
        title: 'Error claiming task',
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  const handleUnclaim = async (taskId: string) => {
    setClaiming(taskId);

    try {
      const { error } = await supabase
        .from('event_tasks')
        .update({ assigned_to: null })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unclaiming task:', error);
      toast({
        title: 'Error updating task',
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">✋</span>
          {t.aiConcierge?.lockdown?.taskSplitter?.title || "Who's bringing what?"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const isClaimedByMe = task.assigned_to === participantId;
            const isClaimed = !!task.assigned_to;

            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                  )}
                </div>

                {isClaimed ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee_name}
                    </Badge>
                    {isClaimedByMe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnclaim(task.id)}
                        disabled={claiming === task.id}
                      >
                        {claiming === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Unclaim'
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClaim(task.id)}
                    disabled={claiming === task.id || !participantId}
                  >
                    {claiming === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        {t.aiConcierge?.lockdown?.taskSplitter?.claimTask || "I'll do this"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
