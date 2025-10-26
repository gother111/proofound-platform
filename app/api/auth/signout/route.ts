// Sign out API route
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  
  await supabase.auth.signOut();
  
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  
  await supabase.auth.signOut();
  
  return NextResponse.json({ success: true });
}

