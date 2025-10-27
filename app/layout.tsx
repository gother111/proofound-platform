import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import { Toaster } from "sonner";
import { createServerSupabaseClient, getCurrentProfile } from "@/lib/supabase/server";
import { AppNavigation } from "@/components/AppNavigation";
import { AppFooter } from "@/components/AppFooter";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const crimsonPro = Crimson_Pro({ 
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofound - Credibility Engineering Platform",
  description: "A credibility engineering platform for impactful connections. Backed by evidence, not vanity metrics.",
  keywords: ["credibility", "verification", "skills", "matching", "careers", "hiring", "proofound"],
  authors: [{ name: "Proofound Team" }],
  creator: "Proofound",
  publisher: "Proofound",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://proofound.com",
    title: "Proofound - Credibility Engineering Platform",
    description: "A credibility engineering platform for impactful connections. Backed by evidence, not vanity metrics.",
    siteName: "Proofound",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proofound - Credibility Engineering Platform",
    description: "A credibility engineering platform for impactful connections. Backed by evidence, not vanity metrics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user and profile for navigation
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getCurrentProfile() : null;

  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AnalyticsProvider>
          <AppNavigation user={user} profile={profile} />
          <main className="flex-1">{children}</main>
          <AppFooter />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                backgroundColor: '#FDFCFA',
                color: '#2D3330',
                border: '1px solid #E8E6DD',
              },
            }}
          />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
