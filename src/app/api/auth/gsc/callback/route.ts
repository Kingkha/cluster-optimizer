import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeCode, listProperties } from "@/lib/data-sources/gsc-client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL("/settings?error=no_tokens", req.url));
    }

    // Get list of properties
    const properties = await listProperties(tokens.access_token, tokens.refresh_token);

    // Save connection for each property
    for (const propertyUrl of properties) {
      await prisma.gscConnection.upsert({
        where: { propertyUrl },
        create: {
          propertyUrl,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        },
      });
    }

    return NextResponse.redirect(
      new URL(`/settings?gsc=connected&properties=${properties.length}`, req.url)
    );
  } catch (e) {
    console.error("GSC OAuth callback error:", e);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", req.url));
  }
}
