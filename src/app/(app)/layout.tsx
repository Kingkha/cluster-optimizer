import { devAuth } from "@/lib/dev-auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <>
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
    </>
  );
}
