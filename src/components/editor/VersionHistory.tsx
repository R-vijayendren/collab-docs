'use client';

import { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Save } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Version {
  id: string;
  title: string;
  createdAt: string;
}

interface Props {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

export default function VersionHistory({ documentId, open, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    const res = await fetch(`/api/documents/${documentId}/versions`);
    const data = await res.json();
    setVersions(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchVersions();
  }, [open, documentId]);

  const saveSnapshot = async () => {
    setSaving(true);
    const res = await fetch(`/api/documents/${documentId}/versions`, { method: 'POST' });
    if (res.ok) {
      await fetchVersions();
    }
    setSaving(false);
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    await onRestore(versionId);
    setRestoring(null);
  };

  if (!open) return null;

  return (
    <div className="w-72 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Version History</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 text-gray-500">
          <X size={14} />
        </button>
      </div>

      <div className="p-2">
        <button
          onClick={saveSnapshot}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Snapshot'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-md animate-pulse" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock size={24} className="text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">No snapshots yet</p>
            <p className="text-xs text-gray-400">Save one to track changes</p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{v.title}</p>
                  <p className="text-[11px] text-gray-400">{timeAgo(v.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoring === v.id}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                  title="Restore this version"
                >
                  {restoring === v.id ? (
                    <div className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
