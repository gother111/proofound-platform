// OAuth callback handler
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Check if profile exists, if not create one
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, account_type, is_admin")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // Create profile for OAuth users (default to individual)
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
          account_type: 'individual', // Default for OAuth users
        });
        
        // Redirect to home for new users
        return NextResponse.redirect(new URL("/home", requestUrl.origin));
      }

      // Route based on account type for existing users
      if (existingProfile.is_admin) {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      } else if (existingProfile.account_type === 'organization') {
        return NextResponse.redirect(new URL("/organization", requestUrl.origin));
      } else {
        return NextResponse.redirect(new URL("/home", requestUrl.origin));
      }
    }
  }

  // Default redirect
  return NextResponse.redirect(new URL("/home", requestUrl.origin));
}

