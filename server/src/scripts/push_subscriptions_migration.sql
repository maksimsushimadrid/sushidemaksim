-- Create table for Web Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT, -- For guest users or anonymous devices
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anonymous can insert subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow service role to read/write all
CREATE POLICY "Service role has full access"
ON public.push_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);
