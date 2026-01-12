-- Add credit pack type enum for tracking which pack benefits apply
CREATE TYPE public.credit_pack_type AS ENUM ('starter', 'launch', 'scale', 'studio');

-- Add last_credit_pack_purchased column to users table
-- This tracks which credit pack the user most recently purchased
-- Benefits and limits are determined by this pack type
ALTER TABLE public.users
ADD COLUMN last_credit_pack_purchased public.credit_pack_type DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.last_credit_pack_purchased IS 'The most recent credit pack purchased by the user. Determines active benefits (queue priority, SEO scans, brand profiles, etc.)';

-- Add index for potential queries filtering by pack type
CREATE INDEX idx_users_credit_pack_type ON public.users(last_credit_pack_purchased) WHERE last_credit_pack_purchased IS NOT NULL;
