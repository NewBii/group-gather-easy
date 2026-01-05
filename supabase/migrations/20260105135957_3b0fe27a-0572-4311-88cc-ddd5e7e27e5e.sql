-- Create event_tasks table for optional helpers feature
CREATE TABLE public.event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

-- Anyone can view tasks for events
CREATE POLICY "Anyone can view event tasks"
ON public.event_tasks
FOR SELECT
USING (true);

-- Anyone can insert tasks (for anonymous events support)
CREATE POLICY "Anyone can insert event tasks"
ON public.event_tasks
FOR INSERT
WITH CHECK (true);

-- Task assignees or event creators can update tasks
CREATE POLICY "Users can update their assigned tasks or event tasks"
ON public.event_tasks
FOR UPDATE
USING (
  (assigned_to IS NOT NULL AND EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = event_tasks.assigned_to AND p.user_id = auth.uid()
  ))
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tasks.event_id AND e.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tasks.event_id AND e.created_by IS NULL
  )
);

-- Task assignees or event creators can delete tasks
CREATE POLICY "Users can delete their assigned tasks or event tasks"
ON public.event_tasks
FOR DELETE
USING (
  (assigned_to IS NOT NULL AND EXISTS (
    SELECT 1 FROM participants p
    WHERE p.id = event_tasks.assigned_to AND p.user_id = auth.uid()
  ))
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tasks.event_id AND e.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tasks.event_id AND e.created_by IS NULL
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_event_tasks_updated_at
BEFORE UPDATE ON public.event_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();