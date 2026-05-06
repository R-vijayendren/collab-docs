import { create } from 'zustand';
import { Document } from '@/types/documents';

interface DocumentState {
  documents: Document[];
  activeDocId: string | null;
  sidebarOpen: boolean;
  loading: boolean;
  setActiveDoc: (id: string | null) => void;
  toggleSidebar: () => void;
  fetchDocuments: () => Promise<void>;
  createDocument: () => Promise<Document>;
  renameDocument: (id: string, title: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  activeDocId: null,
  sidebarOpen: true,
  loading: false,

  setActiveDoc: (id) => set({ activeDocId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  fetchDocuments: async () => {
    set({ loading: true });
    const res = await fetch('/api/documents');
    const documents = await res.json();
    set({ documents, loading: false });
  },

  createDocument: async () => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled' }),
    });
    const doc = await res.json();
    set((s) => ({ documents: [doc, ...s.documents], activeDocId: doc.id }));
    return doc;
  },

  renameDocument: async (id, title) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const updated = await res.json();
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? updated : d)),
    }));
  },

  deleteDocument: async (id) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      activeDocId: s.activeDocId === id ? null : s.activeDocId,
    }));
  },
}));
