import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/auth/SignIn";

export const metadata = {
  title: "Sign In | Proofound",
  description: "Sign in to your Proofound account",
};

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/home");
  }

  // Render Figma SignIn component with Supabase integration
  return <SignIn />;
}
