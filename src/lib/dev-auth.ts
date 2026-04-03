import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const DEV_USER_EMAIL = "dev@localhost";

async function getOrCreateDevUser() {
  let user = await prisma.user.findUnique({ where: { email: DEV_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEV_USER_EMAIL,
        name: "Dev User",
        credits: 5,
      },
    });
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 5,
        balance: 5,
        type: "welcome",
        description: "Welcome bonus — 5 free credits",
      },
    });
  }
  return user;
}

/**
 * In development, returns a fake session with a seeded dev user.
 * In production, delegates to NextAuth.
 */
export async function devAuth() {
  if (process.env.NODE_ENV === "development") {
    const user = await getOrCreateDevUser();
    return {
      user: { id: user.id, name: user.name, email: user.email, image: user.image },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  return auth();
}
