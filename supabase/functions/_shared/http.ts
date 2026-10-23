export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function handleOptions(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response("ok", { headers: corsHeaders });
}

export function getSupabaseKey(legacyName: string, jsonName: string): string | null {
  const legacyValue = Deno.env.get(legacyName);
  if (legacyValue) return legacyValue;

  const rawKeys = Deno.env.get(jsonName);
  if (!rawKeys) return null;

  try {
    const keys = JSON.parse(rawKeys) as Record<string, unknown>;
    const defaultKey = keys.default;
    return typeof defaultKey === "string" ? defaultKey : null;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const value = request.headers.get("Authorization");
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
