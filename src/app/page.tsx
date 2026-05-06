'use client';

import AppShell from '@/components/layout/AppShell';
import CollabEditor from '@/components/editor/CollabEditor';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { FileText, Plus } from 'lucide-react';

function WelcomeScreen() {
  const createDocument = useDocumentStore((s) => s.createDocument);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <FileText size={32} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome to CollabDocs</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        A real-time collaborative document editor. Select a document from the sidebar or create a new one.
      </p>
      <button
        onClick={() => createDocument()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        New Document
      </button>
    </div>
  );
}

export default function Home() {
  const activeDocId = useDocumentStore((s) => s.activeDocId);

  return (
    <AppShell>
      {activeDocId ? (
        <CollabEditor key={activeDocId} documentId={activeDocId} />
      ) : (
        <WelcomeScreen />
      )}
    </AppShell>
  );
}
