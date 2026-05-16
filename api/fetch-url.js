import { createClient } from "@supabase/supabase-js";

function isPrivateHost(hostname) {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  if (hostname.startsWith("192.168.") || hostname.startsWith("10.")) return true;
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return true;
  // 172.16.0.0 – 172.31.255.255 (private)
  const m = hostname.match(/^172\.(\d+)\./);
  if (m) {
    const oct = parseInt(m[1], 10);
    if (oct >= 16 && oct <= 31) return true;
  }
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80")) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth check
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  // Block non-http(s) schemes and private/internal IPs
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs allowed" });
  }
  const hostname = parsed.hostname.toLowerCase();
  if (isPrivateHost(hostname)) {
    return res.status(400).json({ error: "URL not allowed" });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LarderBot/1.0)" }
    });
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
