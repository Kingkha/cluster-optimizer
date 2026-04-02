import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, role, parentId, targetKeyword, searchIntent, notes, sortOrder, publishOrder } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    data.title = title;
    data.slug = slugify(title);
  }
  if (role !== undefined) data.role = role;
  if (parentId !== undefined) data.parentId = parentId || null;
  if (targetKeyword !== undefined) data.targetKeyword = targetKeyword;
  if (searchIntent !== undefined) data.searchIntent = searchIntent;
  if (notes !== undefined) data.notes = notes;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (publishOrder !== undefined) data.publishOrder = publishOrder;

  const node = await prisma.clusterNode.update({
    where: { id },
    data,
  });

  return NextResponse.json(node);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.clusterNode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
