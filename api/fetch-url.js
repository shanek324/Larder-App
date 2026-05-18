import { createClient } from "@supabase/supabase-js";

const MAX_HOPS = 5;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

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

function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs allowed");
  }
  if (isPrivateHost(parsed.hostname.toLowerCase())) {
    throw new Error("URL not allowed");
  }
  return parsed;
}

async function readBodyCapped(response, maxBytes) {
  // Reject early if Content-Length declares more than the cap.
  const declared = parseInt(response.headers.get("content-length") || "0", 10);
  if (declared && declared > maxBytes) {
    throw new Error("Response too large");
  }
  // Stream-read with running size check.
  if (!response.body) return await response.text();
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try { await reader.cancel(); } catch (_) {}
      throw new Error("Response too large");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(
    chunks.length === 1 ? chunks[0] : concat(chunks, total)
  );
}

function concat(chunks, total) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function fetchWithRedirectGuard(initialUrl) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let currentUrl = initialUrl;
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      validateUrl(currentUrl); // Re-validates each hop, including redirects.
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LarderBot/1.0)" },
        signal: controller.signal,
      });
      const status = response.status;
      if (status >= 300 && status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect with no Location header");
        // Resolve relative redirects against the current URL.
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      if (!response.ok) {
        throw new Error("Upstream returned status " + status);
      }
      return await readBodyCapped(response, MAX_BYTES);
    }
    throw new Error("Too many redirects");
  } finally {
    clearTimeout(timeoutHandle);
  }
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

  // Validate the user-supplied URL up front for a clean 400.
  try {
    validateUrl(url);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    const html = await fetchWithRedirectGuard(url);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);
    res.status(200).json({ text });
  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out" });
    }
    res.status(500).json({ error: e.message });
  }
}
