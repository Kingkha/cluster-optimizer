import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { devAuth } from "@/lib/dev-auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cluster Optimizer",
  description: "Turn one topic into a cluster you can actually execute.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await devAuth();
  let credits: number | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });
    credits = user?.credits ?? null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Sidebar
          user={session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          } : null}
          credits={credits}
        />
        <main className={session?.user ? "ml-60 min-h-screen" : "min-h-screen"}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
