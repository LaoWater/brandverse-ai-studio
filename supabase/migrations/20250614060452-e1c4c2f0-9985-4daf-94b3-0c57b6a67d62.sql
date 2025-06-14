
-- Create available_credits table
CREATE TABLE public.available_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  available_credits INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.available_credits ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own credits
CREATE POLICY "Users can view their own credits" 
  ON public.available_credits 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for admins to view all credits
CREATE POLICY "Admins can view all credits" 
  ON public.available_credits 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND admin_level > 0
    )
  );

-- Create security definer function for credit deduction
CREATE OR REPLACE FUNCTION public.deduct_credits(
  _user_id UUID,
  _credits_to_deduct INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Check if user exists and get current credits
  SELECT available_credits INTO current_credits
  FROM public.available_credits
  WHERE user_id = _user_id;
  
  -- If user doesn't have credits record, create one
  IF current_credits IS NULL THEN
    INSERT INTO public.available_credits (user_id, available_credits)
    VALUES (_user_id, 10);
    current_credits := 10;
  END IF;
  
  -- Check if user has enough credits
  IF current_credits < _credits_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.available_credits
  SET 
    available_credits = available_credits - _credits_to_deduct,
    updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset credits to 10 for users who have less than 10 credits
  UPDATE public.available_credits
  SET 
    available_credits = 10,
    updated_at = now()
  WHERE available_credits < 10;
END;
$$;

-- Insert initial credits for the specified email
INSERT INTO public.available_credits (user_id, available_credits)
SELECT u.id, 10
FROM auth.users u
WHERE u.email = 'lao.water7@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  available_credits = 10,
  updated_at = now();

-- Create trigger to automatically create credits record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.available_credits (user_id, available_credits)
  VALUES (NEW.id, 10);
  RETURN NEW;
END;
$$;

-- Create trigger for new users (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_credits'
  ) THEN
    CREATE TRIGGER on_auth_user_created_credits
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_credits();
  END IF;
END;
$$;
