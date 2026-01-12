
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit pack configuration - single source of truth
const CREDIT_PACKS = {
  "prod_SXNQ20skugqshl": {
    packType: "starter",
    credits: 100,
    priceInCents: 300,
    name: "Starter"
  },
  "prod_SXNQqHY08uDDpg": {
    packType: "launch",
    credits: 300,
    priceInCents: 800,
    name: "Launch"
  },
  "prod_SXNRQ7G1zjUMC3": {
    packType: "scale",
    credits: 1000,
    priceInCents: 2000,
    name: "Scale"
  },
  "prod_TmToprXiKYXIr2": {
    packType: "studio",
    credits: 3000,
    priceInCents: 5000,
    name: "Studio"
  }
} as const;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CREDIT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { productId, credits } = await req.json();
    if (!productId || !credits) throw new Error("Missing productId or credits");

    // Validate product ID and get pack info
    const packInfo = CREDIT_PACKS[productId as keyof typeof CREDIT_PACKS];
    if (!packInfo) {
      throw new Error(`Invalid product ID: ${productId}`);
    }

    logStep("Request data", { productId, credits, packType: packInfo.packType });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: productId,
            unit_amount: packInfo.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=credits&credits=${packInfo.credits}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      metadata: {
        user_id: user.id,
        credits: packInfo.credits.toString(),
        pack_type: packInfo.packType,
        pack_name: packInfo.name,
        type: "credits"
      }
    });

    logStep("Checkout session created", { sessionId: session.id, packType: packInfo.packType });

    return new Response(JSON.stringify({ url: session.url }), {
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
