"use client";
import { useEffect, useState } from "react";
import { Search, FileText, X } from "lucide-react";

interface Doc {
  id: number;
  file_name: string;
  s3_key: string;
  created_at: string;
}

export default function DocumentLibraryModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (doc: Doc) => void;
}) {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => { if (data.success) setDocuments(data.documents); });
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const filtered = documents.filter((d) =>
    d.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Document Library</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto px-6 pb-5 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <FileText size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No documents found</p>
            </div>
          ) : (
            filtered.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition group"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                  <FileText size={14} className="text-blue-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {doc.file_name}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
