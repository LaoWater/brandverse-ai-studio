
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing sessionId");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { sessionId, status: session.payment_status });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    const paymentType = metadata?.type;

    if (paymentType === "credits") {
      // Handle credit pack purchase
      const creditsToAdd = parseInt(metadata?.credits || "0");
      logStep("Processing credit pack", { creditsToAdd });

      // Add credits to user's account
      const { data: currentCredits } = await supabaseClient
        .from("available_credits")
        .select("available_credits")
        .eq("user_id", user.id)
        .single();

      const newCreditAmount = (currentCredits?.available_credits || 0) + creditsToAdd;

      const { error: updateError } = await supabaseClient
        .from("available_credits")
        .upsert({
          user_id: user.id,
          available_credits: newCreditAmount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;
      logStep("Credits updated", { newCreditAmount });

    } else {
      // Handle subscription purchase
      logStep("Processing subscription");

      // Determine subscription type and credits from line items
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      const priceId = lineItems.data[0]?.price?.id;
      
      let subscriptionType = "standard";
      let creditsToSet = 3000;

      // Map price IDs to subscription types
      if (priceId === "price_1RakAAEybjfbmfmGPLiHbxj1") { // Pro price ID
        subscriptionType = "pro";
        creditsToSet = 999999; // Unlimited for pro
      }

      logStep("Subscription details", { subscriptionType, creditsToSet });

      // Update user subscription
      const { error: userUpdateError } = await supabaseClient
        .from("users")
        .update({
          subscription_type: subscriptionType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (userUpdateError) throw userUpdateError;

      // Update credits
      const { error: creditsUpdateError } = await supabaseClient
        .from("available_credits")
        .upsert({
          user_id: user.id,
          available_credits: creditsToSet,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (creditsUpdateError) throw creditsUpdateError;
      logStep("Subscription and credits updated", { subscriptionType, creditsToSet });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
