// Server-side Supabase client for Server Components and API Routes
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper to get current user
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper to get current user's profile
export async function getCurrentProfile(): Promise<Database["public"]["Tables"]["profiles"]["Row"] | null> {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

// Helper to require authentication (throws if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

// Helper to require specific account type
export async function requireAccountType(type: 'individual' | 'organization') {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Unauthorized - No profile found");
  }

  if (profile.account_type !== type) {
    throw new Error(`Unauthorized - ${type} account required`);
  }

  return profile;
}

