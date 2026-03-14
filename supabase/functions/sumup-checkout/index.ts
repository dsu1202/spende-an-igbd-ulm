import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUMUP_API = "https://api.sumup.com/v0.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY");
  if (!SUMUP_API_KEY) {
    return new Response(
      JSON.stringify({ error: "SUMUP_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "create") {
      const { amount, currency, description } = await req.json();

      // Create a checkout
      const checkoutRes = await fetch(`${SUMUP_API}/checkouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUMUP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkout_reference: `kiosk-${Date.now()}`,
          amount,
          currency: currency || "EUR",
          pay_to_email: undefined, // will use merchant default
          description: description || "Spende",
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(
          `SumUp checkout creation failed [${checkoutRes.status}]: ${JSON.stringify(checkoutData)}`
        );
      }

      return new Response(JSON.stringify(checkoutData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const checkoutId = url.searchParams.get("id");
      if (!checkoutId) {
        return new Response(
          JSON.stringify({ error: "Missing checkout id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const statusRes = await fetch(`${SUMUP_API}/checkouts/${checkoutId}`, {
        headers: {
          Authorization: `Bearer ${SUMUP_API_KEY}`,
        },
      });

      const statusData = await statusRes.json();
      if (!statusRes.ok) {
        throw new Error(
          `SumUp status check failed [${statusRes.status}]: ${JSON.stringify(statusData)}`
        );
      }

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use ?action=create or ?action=status" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("SumUp checkout error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
