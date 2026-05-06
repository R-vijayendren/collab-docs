import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_URL } from './constants';

export function createYjsProvider(docId: string) {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(WS_URL, docId, ydoc, {
    connect: true,
  });

  return { ydoc, provider };
}
