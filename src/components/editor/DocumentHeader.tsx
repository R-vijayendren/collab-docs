'use client';

import { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/stores/useDocumentStore';

interface Props {
  documentId: string;
}

export default function DocumentHeader({ documentId }: Props) {
  const documents = useDocumentStore((s) => s.documents);
  const renameDocument = useDocumentStore((s) => s.renameDocument);
  const doc = documents.find((d) => d.id === documentId);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc?.title || 'Untitled');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doc) setTitle(doc.title);
  }, [doc?.title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== doc?.title) {
      renameDocument(documentId, trimmed);
    } else {
      setTitle(doc?.title || 'Untitled');
    }
    setEditing(false);
  };

  if (!doc) return null;

  return editing ? (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { setTitle(doc.title); setEditing(false); }
      }}
      className="text-sm font-medium bg-white border border-blue-300 rounded px-2 py-0.5 outline-none min-w-[200px]"
    />
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="text-sm font-medium text-gray-800 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors truncate max-w-[300px]"
      title="Click to rename"
    >
      {doc.title}
    </button>
  );
}
