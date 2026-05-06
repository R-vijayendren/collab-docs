import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

export const persistence = {
  bindState: async (docName: string, ydoc: Y.Doc) => {
    const doc = await prisma.document.findUnique({
      where: { id: docName },
      select: { yjsState: true },
    });

    if (doc?.yjsState) {
      const state = new Uint8Array(doc.yjsState);
      Y.applyUpdate(ydoc, state);
    }
  },

  writeState: async (docName: string, ydoc: Y.Doc) => {
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    await prisma.document.updateMany({
      where: { id: docName },
      data: { yjsState: state },
    });
  },
};
