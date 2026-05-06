import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { persistence } from './persistence';

const PORT = 4444;
const messageSync = 0;
const messageAwareness = 1;
const messageQueryAwareness = 3;

interface DocEntry {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Map<WebSocket, Set<number>>;
  saveTimeout: NodeJS.Timeout | null;
}

const docs = new Map<string, DocEntry>();
const docLoadPromises = new Map<string, Promise<DocEntry>>();

function getOrCreateDoc(docName: string): Promise<DocEntry> {
  const existing = docs.get(docName);
  if (existing) return Promise.resolve(existing);

  let pending = docLoadPromises.get(docName);
  if (pending) return pending;

  pending = (async () => {
    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);
    const entry: DocEntry = { ydoc, awareness, conns: new Map(), saveTimeout: null };

    awareness.setLocalState(null);

    awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients));
      const msg = encoding.toUint8Array(encoder);

      entry.conns.forEach((_, conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(msg);
        }
      });
    });

    await persistence.bindState(docName, ydoc);

    ydoc.on('update', (update: Uint8Array, origin: unknown) => {
      scheduleSave(docName);

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      const msg = encoding.toUint8Array(encoder);

      entry.conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          conn.send(msg);
        }
      });
    });

    docs.set(docName, entry);
    docLoadPromises.delete(docName);
    return entry;
  })();

  docLoadPromises.set(docName, pending);
  return pending;
}

function scheduleSave(docName: string) {
  const entry = docs.get(docName);
  if (!entry) return;
  if (entry.saveTimeout) clearTimeout(entry.saveTimeout);
  entry.saveTimeout = setTimeout(() => {
    persistence.writeState(docName, entry.ydoc).catch((err) => {
      console.error(`Save failed for ${docName}:`, err);
    });
  }, 2000);
}

function send(conn: WebSocket, msg: Uint8Array) {
  if (conn.readyState === WebSocket.OPEN) {
    conn.send(msg);
  }
}

function handleMessage(entry: DocEntry, ws: WebSocket, data: Uint8Array) {
  const decoder = decoding.createDecoder(data);
  const msgType = decoding.readVarUint(decoder);

  if (msgType === messageSync) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.readSyncMessage(decoder, encoder, entry.ydoc, ws);
    if (encoding.length(encoder) > 1) {
      send(ws, encoding.toUint8Array(encoder));
    }
  }

  if (msgType === messageAwareness) {
    const update = decoding.readVarUint8Array(decoder);
    awarenessProtocol.applyAwarenessUpdate(entry.awareness, update, ws);
  }

  if (msgType === messageQueryAwareness) {
    const states = entry.awareness.getStates();
    if (states.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(entry.awareness, Array.from(states.keys())),
      );
      send(ws, encoding.toUint8Array(encoder));
    }
  }
}

function sendSyncStep1(entry: DocEntry, ws: WebSocket) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, entry.ydoc);
  send(ws, encoding.toUint8Array(encoder));
}

function sendAwarenessStates(entry: DocEntry, ws: WebSocket) {
  const states = entry.awareness.getStates();
  if (states.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(entry.awareness, Array.from(states.keys())),
    );
    send(ws, encoding.toUint8Array(encoder));
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const match = req.url?.match(/^\/api\/docs\/([^/]+)\/snapshot$/);
  if (match) {
    const docName = match[1];

    if (req.method === 'GET') {
      const entry = docs.get(docName);
      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Doc not loaded' }));
        return;
      }
      const state = Buffer.from(Y.encodeStateAsUpdate(entry.ydoc));
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(state);
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const entry = docs.get(docName);
        if (!entry) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Doc not loaded' }));
          return;
        }

        const newState = new Uint8Array(Buffer.concat(chunks));
        const newDoc = new Y.Doc();
        Y.applyUpdate(newDoc, newState);

        const currentState = Y.encodeStateVector(entry.ydoc);
        const diff = Y.encodeStateAsUpdate(newDoc, currentState);
        Y.applyUpdate(entry.ydoc, diff);
        newDoc.destroy();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CollabDocs WebSocket Server');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  ws.binaryType = 'arraybuffer';

  const docName = req.url?.slice(1) || 'default';
  const buffered: Uint8Array[] = [];
  let ready = false;
  let entry: DocEntry | null = null;

  ws.on('message', (data: ArrayBuffer) => {
    const msg = new Uint8Array(data);
    if (ready && entry) {
      handleMessage(entry, ws, msg);
    } else {
      buffered.push(msg);
    }
  });

  ws.on('close', () => {
    if (!entry) return;
    const controlledIds = entry.conns.get(ws);
    entry.conns.delete(ws);

    if (controlledIds) {
      controlledIds.forEach((clientId) => {
        if (entry!.awareness.getStates().has(clientId)) {
          awarenessProtocol.removeAwarenessStates(entry!.awareness, [clientId], null);
        }
      });
    }

    if (entry.conns.size === 0) {
      persistence.writeState(docName, entry.ydoc).catch((err) => {
        console.error(`Final save failed for ${docName}:`, err);
      });

      if (entry.saveTimeout) clearTimeout(entry.saveTimeout);
      entry.awareness.destroy();
      entry.ydoc.destroy();
      docs.delete(docName);
    }
  });

  getOrCreateDoc(docName).then((e) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    entry = e;
    entry.conns.set(ws, new Set());

    sendSyncStep1(entry, ws);
    sendAwarenessStates(entry, ws);

    ready = true;
    for (const msg of buffered) {
      handleMessage(entry, ws, msg);
    }
    buffered.length = 0;
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
