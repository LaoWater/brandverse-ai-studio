import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Auth check with anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    // Verify admin_level >= 3 using service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: adminData, error: adminError } = await adminClient
      .from("users")
      .select("admin_level")
      .eq("id", user.id)
      .single();

    if (adminError || !adminData || (adminData.admin_level ?? 0) < 3) {
      return new Response(JSON.stringify({ error: "Insufficient privileges. Admin level 3+ required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const targetEmail = rawEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      throw new Error("Valid email is required");
    }

    const requestedRedirectTo = typeof body?.redirectTo === "string"
      ? body.redirectTo.trim()
      : "";
    const origin = req.headers.get("origin")?.trim() ?? "";
    const fallbackRedirectTo = origin ? `${origin}/auth/callback` : "";
    const redirectToCandidate = requestedRedirectTo || fallbackRedirectTo;

    let redirectTo: string | undefined;
    if (redirectToCandidate) {
      try {
        const parsed = new URL(redirectToCandidate);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Only http/https redirect URLs are allowed");
        }
        redirectTo = parsed.toString();
      } catch {
        throw new Error("Valid redirectTo URL is required");
      }
    }

    console.log(`[ADMIN-IMPERSONATE] Admin ${user.email} requesting impersonation of ${targetEmail}`);

    // Generate magic link for target user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
      ...(redirectTo ? { options: { redirectTo } } : {}),
    });

    if (linkError) {
      console.error("[ADMIN-IMPERSONATE] Error generating link:", linkError.message);
      throw new Error(`Failed to generate link: ${linkError.message}`);
    }

    if (!linkData?.properties?.action_link) {
      throw new Error("No action link returned");
    }

    console.log(`[ADMIN-IMPERSONATE] Magic link generated successfully for ${targetEmail}`);

    return new Response(JSON.stringify({ 
      action_link: linkData.properties.action_link,
      target_email: targetEmail,
      redirect_to: redirectTo ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ADMIN-IMPERSONATE] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
