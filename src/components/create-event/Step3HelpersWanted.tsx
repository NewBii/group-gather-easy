import { useState } from 'react';
import { Plus, X, HandHelping } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Step3Props {
  tasks: string[];
  setTasks: (tasks: string[]) => void;
}

export const Step3HelpersWanted = ({ tasks, setTasks }: Step3Props) => {
  const { t } = useLanguage();
  const [newTask, setNewTask] = useState('');

  const suggestions = t.createEvent.wizard.helpers.suggestions;

  const addTask = (task: string) => {
    const trimmedTask = task.trim();
    if (trimmedTask && !tasks.includes(trimmedTask)) {
      setTasks([...tasks, trimmedTask]);
      setNewTask('');
    }
  };

  const removeTask = (taskToRemove: string) => {
    setTasks(tasks.filter((task) => task !== taskToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask(newTask);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <HandHelping className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          {t.createEvent.wizard.helpers.title}
        </h3>
        <p className="text-muted-foreground">
          {t.createEvent.wizard.helpers.subtitle}
        </p>
      </div>

      {/* Task Input */}
      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.createEvent.wizard.helpers.taskPlaceholder}
          className="flex-1 h-12 rounded-xl border-border/50"
        />
        <Button
          type="button"
          onClick={() => addTask(newTask)}
          disabled={!newTask.trim()}
          className="h-12 px-4 rounded-xl"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Suggestion Chips */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t.createEvent.wizard.helpers.quickAdd}
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion: string) => {
            const isAdded = tasks.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => !isAdded && addTask(suggestion)}
                disabled={isAdded}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isAdded
                    ? 'bg-primary/10 text-primary cursor-default'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {isAdded && <span className="mr-1">✓</span>}
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      {/* Added Tasks */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t.createEvent.wizard.helpers.addedTasks} ({tasks.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => (
              <Badge
                key={task}
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              >
                {task}
                <button
                  type="button"
                  onClick={() => removeTask(task)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty state message */}
      {tasks.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            {t.createEvent.wizard.helpers.noTasksHint}
          </p>
        </div>
      )}
    </div>
  );
};
