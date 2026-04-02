import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, title, role, parentId, targetKeyword, searchIntent } = body;

  if (!projectId || !title || !role) {
    return NextResponse.json(
      { error: "projectId, title, and role are required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.clusterNode.aggregate({
    where: { projectId },
    _max: { sortOrder: true, publishOrder: true },
  });

  const node = await prisma.clusterNode.create({
    data: {
      projectId,
      title,
      slug: slugify(title),
      role,
      parentId: parentId || null,
      targetKeyword: targetKeyword || null,
      searchIntent: searchIntent || null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      publishOrder: (maxOrder._max.publishOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(node, { status: 201 });
}
