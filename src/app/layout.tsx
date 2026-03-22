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
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body>
        <AuthProvider initialSession={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
