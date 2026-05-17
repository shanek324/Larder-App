import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth check
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Validate the user's JWT first, using the service role key client
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // 1) Delete user-owned data via the SECURITY DEFINER function, using the user\u2019s JWT
  //    so auth.uid() resolves correctly inside the function.
  const userClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: "Bearer " + token } } }
  );

  const { error: deleteDataError } = await userClient.rpc("delete_my_account");
  if (deleteDataError) {
    console.error("delete_my_account rpc error:", deleteDataError);
    return res.status(500).json({ error: "Failed to delete account data" });
  }

  // 2) Delete the auth row itself (requires service role)
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    console.error("auth.admin.deleteUser error:", authDeleteError);
    // Data is already gone; the auth row will be orphaned but harmless.
    return res.status(500).json({ error: "Account data deleted but auth removal failed. Contact support." });
  }

  return res.status(200).json({ ok: true });
}
