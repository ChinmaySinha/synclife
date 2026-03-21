import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "SyncLife — Shared Productivity for Couples",
  description: "A pair-based productivity platform that combines task management, emotional connection, accountability, health tracking, and gamification.",
  keywords: ["productivity", "couples", "tasks", "health", "accountability"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
