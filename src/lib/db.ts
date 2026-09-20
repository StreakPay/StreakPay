import { createClient } from "@/lib/supabase/server";

export { createClient as getDb };

// Helper to get a server-side Supabase client (replaces old `db` import)
export async function getSupabase() {
  return createClient();
}
