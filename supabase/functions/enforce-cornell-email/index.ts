// Supabase Edge Function — enforce @cornell.edu email on signup
// Deploy: supabase functions deploy enforce-cornell-email
// Configure as database webhook on auth.users INSERT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    // Database webhook payload: { type, table, record, ... }
    const record = payload.record;
    if (!record?.email) {
      return new Response(JSON.stringify({ error: "No email in payload" }), {
        status: 400,
      });
    }

    const email: string = record.email;

    // Enforce exact @cornell.edu domain (not subdomains)
    if (email.endsWith("@cornell.edu")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Non-Cornell email — delete the auth user
    console.log(`Rejecting non-Cornell signup: ${email}`);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase.auth.admin.deleteUser(record.id);
    if (error) {
      console.error("Failed to delete non-Cornell user:", error.message);
    }

    return new Response(
      JSON.stringify({ error: "Only @cornell.edu emails are allowed" }),
      { status: 403 }
    );
  } catch (err) {
    console.error("enforce-cornell-email error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
});
