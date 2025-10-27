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
        // Get account type from user metadata (set during signup)
        const accountType = user.user_metadata?.account_type || 'individual';

        // Create profile based on account type
        if (accountType === 'organization') {
          // Create organization profile
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.company_name || user.user_metadata?.full_name || user.user_metadata?.name,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            account_type: 'organization',
          });

          // Redirect organizations to organization dashboard
          return NextResponse.redirect(new URL("/organization", requestUrl.origin));
        } else {
          // Create individual profile
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            account_type: 'individual',
          });

          // Redirect individuals to home
          return NextResponse.redirect(new URL("/home", requestUrl.origin));
        }
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

