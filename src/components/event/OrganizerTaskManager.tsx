import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

interface Task {
  id: string;
  title: string;
}

interface OrganizerTaskManagerProps {
  eventId: string;
}

export const OrganizerTaskManager = ({ eventId }: OrganizerTaskManagerProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('event_tasks')
      .select('id, title')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (data) setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, [eventId]);

  const handleAdd = async () => {
    const trimmed = newTask.trim();
    if (!trimmed) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('event_tasks')
        .insert({ event_id: eventId, title: trimmed });

      if (error) throw error;
      setNewTask('');
      await fetchTasks();
    } catch {
      toast({ title: t.eventPage.organizerTasks.errorAdding, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    setDeletingId(taskId);
    try {
      const { error } = await supabase
        .from('event_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      toast({ title: t.eventPage.organizerTasks.errorDeleting, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                {t.eventPage.organizerTasks.title}
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.eventPage.organizerTasks.placeholder}
                className="flex-1"
                disabled={isAdding}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={!newTask.trim() || isAdding}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.eventPage.organizerTasks.add}
              </Button>
            </div>

            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background"
                  >
                    <span className="text-sm font-medium truncate">{task.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.eventPage.organizerTasks.empty}
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};