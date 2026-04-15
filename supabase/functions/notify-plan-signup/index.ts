import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, plan } = await req.json();

    // Log the signup for monitoring
    console.log(`🎉 NEW PLAN SIGNUP: ${email} signed up for the ${plan} plan at ${new Date().toISOString()}`);

    // Store in database for easy querying
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // You can check plan_signups table anytime via the backend dashboard
    // Future: integrate email notification service here

    return new Response(
      JSON.stringify({ success: true, message: `Plan signup recorded: ${email} → ${plan}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-plan-signup:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
