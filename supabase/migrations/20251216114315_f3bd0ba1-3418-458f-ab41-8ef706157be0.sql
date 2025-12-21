-- Chat history and call records table
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity TEXT DEFAULT 'low',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Call records table for voice calls
CREATE TABLE public.call_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  call_type TEXT NOT NULL DEFAULT 'video',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  participants TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled callbacks/follow-ups
CREATE TABLE public.scheduled_callbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_callbacks ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_history
CREATE POLICY "Users can view their own chat history"
ON public.chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
ON public.chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
ON public.chat_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON public.chat_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for call_records
CREATE POLICY "Users can view their own call records"
ON public.call_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call records"
ON public.call_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call records"
ON public.call_records FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for scheduled_callbacks
CREATE POLICY "Users can view their own scheduled callbacks"
ON public.scheduled_callbacks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheduled callbacks"
ON public.scheduled_callbacks FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all chat history"
ON public.chat_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all call records"
ON public.call_records FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Doctors can view patient call records
CREATE POLICY "Doctors can view patient call records"
ON public.call_records FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
  SELECT 1 FROM appointments 
  WHERE appointments.id = call_records.appointment_id 
  AND appointments.doctor_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_chat_history_updated_at
BEFORE UPDATE ON public.chat_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();