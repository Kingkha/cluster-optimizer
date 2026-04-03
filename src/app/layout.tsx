import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { auth, signOut } from "@/auth";
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
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Cluster Optimizer
          </a>
          <div className="flex items-center gap-3">
            {session?.user && (
              <>
                <a
                  href="/settings"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Settings
                </a>
                <a
                  href="/new"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  + New Cluster
                </a>
                <div className="flex items-center gap-2 pl-2 border-l">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                      className="h-7 w-7 rounded-full"
                    />
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
