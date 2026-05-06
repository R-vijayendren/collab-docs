import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json();
  const doc = await prisma.document.update({
    where: { id: params.id },
    data: { title: body.title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(doc);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
