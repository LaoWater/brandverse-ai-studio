
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create a restrictive UPDATE policy that only allows safe column updates
-- admin_level, subscription_type, subscription_expiry_date, last_credit_pack_purchased 
-- should ONLY be updatable by service_role (edge functions)
CREATE POLICY "Users can update their own safe fields"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Ensure privileged fields haven't been changed
  AND admin_level IS NOT DISTINCT FROM (SELECT admin_level FROM public.users WHERE id = auth.uid())
  AND subscription_type IS NOT DISTINCT FROM (SELECT subscription_type FROM public.users WHERE id = auth.uid())
  AND subscription_expiry_date IS NOT DISTINCT FROM (SELECT subscription_expiry_date FROM public.users WHERE id = auth.uid())
  AND last_credit_pack_purchased IS NOT DISTINCT FROM (SELECT last_credit_pack_purchased FROM public.users WHERE id = auth.uid())
  AND type IS NOT DISTINCT FROM (SELECT type FROM public.users WHERE id = auth.uid())
);

-- Also fix the attacker's data immediately
UPDATE public.users 
SET admin_level = 0, subscription_type = 'free', updated_at = now()
WHERE id = 'af150625-2ed5-4e3e-b766-6f474f155e3a';
