'use client';

import { FileText, Plus, PanelLeftClose, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useUserStore } from '@/stores/useUserStore';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { timeAgo } from '@/lib/utils';
import { Document } from '@/types/documents';

function DocumentContextMenu({
  doc,
  onRename,
  onDelete,
  onClose,
}: {
  doc: Document;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-2 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36"
    >
      <button
        onClick={onRename}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Pencil size={14} /> Rename
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}

function DocumentCard({ doc }: { doc: Document }) {
  const { activeDocId, setActiveDoc, renameDocument, deleteDocument } = useDocumentStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const commitRename = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== doc.title) {
      renameDocument(doc.id, trimmed);
    } else {
      setTitle(doc.title);
    }
    setRenaming(false);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
        activeDocId === doc.id
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100',
      )}
      onClick={() => setActiveDoc(doc.id)}
    >
      <FileText size={15} className="shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        {renaming ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setTitle(doc.title); setRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm bg-white border border-blue-300 rounded px-1 py-0 outline-none"
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{doc.title}</p>
            <p className="text-[11px] text-gray-400">{timeAgo(doc.updatedAt)}</p>
          </>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        className={cn(
          'p-0.5 rounded hover:bg-gray-200 transition-opacity',
          menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <MoreHorizontal size={14} />
      </button>
      {menuOpen && (
        <DocumentContextMenu
          doc={doc}
          onRename={() => { setMenuOpen(false); setRenaming(true); }}
          onDelete={() => { setMenuOpen(false); deleteDocument(doc.id); }}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

function UserIdentity() {
  const { name, color, randomize } = useUserStore();

  return (
    <div className="p-3 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-medium text-gray-700 truncate flex-1">{name}</span>
        <button
          onClick={randomize}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          title="Change identity"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { documents, sidebarOpen, toggleSidebar, fetchDocuments, createDocument, loading } = useDocumentStore();
  const hydrate = useUserStore((s) => s.hydrate);

  useEffect(() => {
    fetchDocuments();
    hydrate();
  }, [fetchDocuments, hydrate]);

  return (
    <div
      className={cn(
        'bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
      )}
    >
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">CollabDocs</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="p-2 flex gap-1">
        <button
          onClick={() => createDocument()}
          className="flex items-center gap-2 flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
        >
          <Plus size={16} />
          New Document
        </button>
        <button
          onClick={() => fetchDocuments()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          title="Refresh documents"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-2 px-1 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FileText size={32} className="text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">No documents yet</p>
            <p className="text-xs text-gray-400">Create one to get started</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>

      <UserIdentity />
    </div>
  );
}
