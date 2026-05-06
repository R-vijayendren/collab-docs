import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const documents = await prisma.document.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const title = body.title || 'Untitled';

  const document = await prisma.document.create({
    data: { title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(document, { status: 201 });
}
