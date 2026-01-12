
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit pack type mapping for validation
const VALID_PACK_TYPES = ["starter", "launch", "scale", "studio"] as const;
type CreditPackType = typeof VALID_PACK_TYPES[number];

// Price mapping for purchase history
const PACK_PRICES: Record<CreditPackType, number> = {
  starter: 3.00,
  launch: 8.00,
  scale: 20.00,
  studio: 50.00
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

    // Check if this session was already processed (idempotency)
    const { data: existingPurchase } = await supabaseClient
      .from("purchase_history")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingPurchase) {
      logStep("Session already processed", { sessionId });
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const metadata = session.metadata;
    const paymentType = metadata?.type;

    if (paymentType === "credits") {
      // Handle credit pack purchase
      const creditsToAdd = parseInt(metadata?.credits || "0");
      const packType = metadata?.pack_type as CreditPackType | undefined;
      const packName = metadata?.pack_name || "Unknown";

      logStep("Processing credit pack", { creditsToAdd, packType, packName });

      // Validate pack type
      if (!packType || !VALID_PACK_TYPES.includes(packType)) {
        logStep("Warning: Invalid pack type in metadata", { packType });
      }

      // Get current credits
      const { data: currentCredits } = await supabaseClient
        .from("available_credits")
        .select("available_credits")
        .eq("user_id", user.id)
        .single();

      const newCreditAmount = (currentCredits?.available_credits || 0) + creditsToAdd;

      // Update available credits
      const { error: creditsUpdateError } = await supabaseClient
        .from("available_credits")
        .upsert({
          user_id: user.id,
          available_credits: newCreditAmount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (creditsUpdateError) throw creditsUpdateError;
      logStep("Credits updated", { newCreditAmount });

      // Update user's last_credit_pack_purchased if valid pack type
      if (packType && VALID_PACK_TYPES.includes(packType)) {
        const { error: userUpdateError } = await supabaseClient
          .from("users")
          .update({
            last_credit_pack_purchased: packType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (userUpdateError) {
          logStep("Warning: Failed to update user pack type", { error: userUpdateError.message });
        } else {
          logStep("User pack type updated", { packType });
        }
      }

      // Record purchase in history
      const amountPaid = packType ? PACK_PRICES[packType] : (session.amount_total ? session.amount_total / 100 : null);
      const { error: historyError } = await supabaseClient
        .from("purchase_history")
        .insert({
          user_id: user.id,
          stripe_session_id: sessionId,
          purchase_type: "credit_pack",
          credits_purchased: creditsToAdd,
          amount_paid: amountPaid,
          subscription_plan: packType || null,
        });

      if (historyError) {
        logStep("Warning: Failed to record purchase history", { error: historyError.message });
      } else {
        logStep("Purchase history recorded", { packType, creditsToAdd, amountPaid });
      }

    } else {
      // Handle subscription purchase (legacy support)
      logStep("Processing subscription");

      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      const priceId = lineItems.data[0]?.price?.id;

      let subscriptionType = "standard";
      let creditsToSet = 3000;

      if (priceId === "price_1RakAAEybjfbmfmGPLiHbxj1") {
        subscriptionType = "pro";
        creditsToSet = 999999;
      }

      logStep("Subscription details", { subscriptionType, creditsToSet });

      const { error: userUpdateError } = await supabaseClient
        .from("users")
        .update({
          subscription_type: subscriptionType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (userUpdateError) throw userUpdateError;

      const { error: creditsUpdateError } = await supabaseClient
        .from("available_credits")
        .upsert({
          user_id: user.id,
          available_credits: creditsToSet,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (creditsUpdateError) throw creditsUpdateError;

      // Record subscription purchase
      const { error: historyError } = await supabaseClient
        .from("purchase_history")
        .insert({
          user_id: user.id,
          stripe_session_id: sessionId,
          stripe_price_id: priceId,
          purchase_type: "subscription",
          credits_purchased: creditsToSet,
          subscription_plan: subscriptionType,
          amount_paid: session.amount_total ? session.amount_total / 100 : null,
        });

      if (historyError) {
        logStep("Warning: Failed to record subscription history", { error: historyError.message });
      }

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
