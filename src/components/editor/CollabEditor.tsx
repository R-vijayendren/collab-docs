'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Clock } from 'lucide-react';
import { CollabExtension } from './extensions/collaboration';
import { getEditorExtensions } from './extensions';
import { SlashCommand, slashCommandPluginKey, SlashCommandState } from './extensions/slash-command';
import EditorToolbar from './EditorToolbar';
import FloatingToolbar from './FloatingToolbar';
import SlashCommandMenu from './SlashCommandMenu';
import PresenceBar from './PresenceBar';
import ConnectionStatus from './ConnectionStatus';
import DocumentHeader from './DocumentHeader';
import VersionHistory from './VersionHistory';
import { useUserStore } from '@/stores/useUserStore';
import { WS_URL } from '@/lib/constants';

interface Props {
  documentId: string;
}

export default function CollabEditor({ documentId }: Props) {
  const { name, color } = useUserStore();
  const [slashState, setSlashState] = useState<SlashCommandState>({
    active: false, range: null, query: '', decorationPosition: null,
  });
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WS_URL, documentId, ydoc, { connect: false });

    provider.awareness.setLocalStateField('user', { name, color });

    ydocRef.current = ydoc;
    providerRef.current = provider;

    const onStatus = ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    };
    const onSync = (isSynced: boolean) => {
      setSynced(isSynced);
    };

    provider.on('status', onStatus);
    provider.on('sync', onSync);

    setReady(true);
    provider.connect();

    return () => {
      provider.off('status', onStatus);
      provider.off('sync', onSync);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setReady(false);
      setConnected(false);
      setSynced(false);
    };
  }, [documentId]);

  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', { name, color });
    }
  }, [name, color]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...getEditorExtensions(),
      SlashCommand,
      ...(ready && ydocRef.current && providerRef.current
        ? [CollabExtension.configure({
            document: ydocRef.current,
            provider: providerRef.current,
            user: { name, color },
          })]
        : []),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-16 py-8',
      },
    },
    onTransaction: ({ editor: ed }) => {
      const state = slashCommandPluginKey.getState(ed.state) as SlashCommandState | undefined;
      if (state) {
        setSlashState(state);
      }
    },
  }, [ready, documentId]);

  const closeSlash = useCallback(() => {
    if (editor) {
      const tr = editor.state.tr.setMeta(slashCommandPluginKey, {
        active: false, range: null, query: '', decorationPosition: null,
      });
      editor.view.dispatch(tr);
    }
  }, [editor]);

  const handleRestore = useCallback(async (versionId: string) => {
    if (!editor) return;
    const res = await fetch(`/api/documents/${documentId}/versions/${versionId}`);
    if (!res.ok) return;

    const buf = await res.arrayBuffer();
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, new Uint8Array(buf));

    const yXmlFragment = tempDoc.getXmlFragment('default');
    const { yXmlFragmentToProsemirrorJSON } = await import('y-prosemirror');
    const json = yXmlFragmentToProsemirrorJSON(yXmlFragment);
    tempDoc.destroy();

    editor.commands.setContent(json);
  }, [editor, documentId]);

  if (!synced) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Connecting to document...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-white overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200">
          <DocumentHeader documentId={documentId} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${historyOpen ? 'bg-gray-200 text-blue-600' : 'text-gray-500'}`}
              title="Version History"
            >
              <Clock size={16} />
            </button>
            {providerRef.current && (
              <PresenceBar provider={providerRef.current} currentUser={{ name, color }} />
            )}
            <ConnectionStatus connected={connected} />
          </div>
        </div>
        <EditorToolbar editor={editor} />

        <div className="flex-1 overflow-y-auto relative">
          {editor && <FloatingToolbar editor={editor} />}
          <EditorContent editor={editor} />

          {slashState.active && slashState.range && slashState.decorationPosition && editor && (
            <div
              className="fixed z-50"
              style={{
                top: slashState.decorationPosition.top,
                left: slashState.decorationPosition.left,
              }}
            >
              <SlashCommandMenu
                editor={editor}
                range={slashState.range}
                query={slashState.query}
                onClose={closeSlash}
              />
            </div>
          )}
        </div>
      </div>

      <VersionHistory
        documentId={documentId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}
