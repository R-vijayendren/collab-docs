import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WS_URL } from '@/lib/constants';

const WS_HTTP = WS_URL.replace('ws://', 'http://').replace('wss://', 'https://');

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const versions = await prisma.version.findMany({
    where: { documentId: params.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true },
  });
  return NextResponse.json(versions);
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: { title: true },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  let yjsState: Buffer;
  try {
    const res = await fetch(`${WS_HTTP}/api/docs/${params.id}/snapshot`);
    if (!res.ok) throw new Error('WS server returned ' + res.status);
    const arrayBuf = await res.arrayBuffer();
    yjsState = Buffer.from(arrayBuf);
  } catch {
    const dbDoc = await prisma.document.findUnique({
      where: { id: params.id },
      select: { yjsState: true },
    });
    if (!dbDoc?.yjsState) {
      return NextResponse.json({ error: 'No content to snapshot' }, { status: 400 });
    }
    yjsState = Buffer.from(dbDoc.yjsState);
  }

  const version = await prisma.version.create({
    data: {
      documentId: params.id,
      title: doc.title,
      yjsState,
    },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json(version, { status: 201 });
}
