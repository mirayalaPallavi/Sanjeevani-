-- Create SOS Events table
CREATE TABLE IF NOT EXISTS public.sos_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    emergency_type TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

-- Policies

-- Insert: Users can insert their own SOS events
CREATE POLICY "Users can insert their own SOS events"
ON public.sos_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Select: 
-- 1. Users can see their own events
-- 2. Doctors and Admins can see ALL events
CREATE POLICY "Users view own, Doctors view all"
ON public.sos_events
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('doctor', 'admin')
    )
);

-- Update: Only Doctors/Admins can update status (mark resolved)
CREATE POLICY "Doctors/Admins can update status"
ON public.sos_events
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('doctor', 'admin')
    )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
