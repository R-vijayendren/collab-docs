import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string; versionId: string } },
) {
  const version = await prisma.version.findUnique({
    where: { id: params.versionId },
    select: { yjsState: true },
  });

  if (!version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  return new Response(new Uint8Array(version.yjsState), {
    headers: { 'Content-Type': 'application/octet-stream' },
  });
}
