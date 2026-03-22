import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SyncLife — Shared Productivity for Couples",
  description: "A pair-based productivity platform that combines task management, emotional connection, accountability, health tracking, and gamification.",
  keywords: ["productivity", "couples", "tasks", "health", "accountability"],
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Use getUser() instead of getSession() — validates JWT server-side
  const { data: { user } } = await supabase.auth.getUser();

  let initialProfile = null;
  let initialPartner = null;

  if (user) {
    // Fetch profile server-side where cookies are available
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      initialProfile = profile;

      // Fetch partner if linked
      if (profile.partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.partner_id)
          .single();
        initialPartner = partner;
      }
    }
  }

  return (
    <html lang="en">
      <body>
        <AuthProvider
          initialUser={user}
          initialProfile={initialProfile}
          initialPartner={initialPartner}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
