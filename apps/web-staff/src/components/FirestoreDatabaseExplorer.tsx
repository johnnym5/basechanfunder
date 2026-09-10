import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  query,
  limit,
  Timestamp,
  updateDoc,
  deleteField,
  addDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import {
  Database,
  Search,
  ChevronRight,
  Trash2,
  Edit3,
  Plus,
  Lock,
  CheckSquare,
  Square,
  X as XIcon,
  Loader2,
  FileJson,
  ArrowLeft,
  Download,
  Upload,
  FileDown,
  FileUp,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

// --- Constants & Types ---

const TOP_LEVEL_COLLECTIONS = [
  'users',
  'financial_accounts',
  'pof_evaluations',
  'audit_logs',
  'liquidity_requests',
  'support_messages',
  'system_config'
];

type FieldType = 'string' | 'number' | 'boolean' | 'timestamp' | 'array' | 'map';

type DocumentReference = {
  id: string;
  label: string;
  data: any;
}

type ExplorerViewMode = 'collections' | 'documents' | 'inspector';

// --- Utility: Human Readable Labels ---

const resolveDocLabel = (id: string, data: any): string => {
  if (data.email && data.uid) return `${data.email} [AUTH]`;
  if (data.displayName && data.email) return `${data.displayName} (${data.email})`;
  if (data.displayName) return data.displayName;
  if (data.email) return data.email;
  if (data.bankName && data.accountNumberMasked) return `${data.bankName} (${data.accountNumberMasked})`;
  if (data.action && data.actor) return `${data.action} by ${data.actor}`;
  if (data.userName) return data.userName;
  if (data.senderName) return `${data.senderName}: ${data.text?.substring(0, 20)}...`;
  if (id === 'global' || id === 'fees') return `Config: ${id.toUpperCase()}`;
  return id;
};

// --- Field Editor Component ---

const FieldRow: React.FC<{
  fieldKey: string;
  value: any;
  isCore?: boolean;
  onSave: (newKey: string, newValue: any) => void;
  onDelete: () => void;
}> = ({ fieldKey, value, isCore, onSave, onDelete }) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState(fieldKey);
  const [editValue, setEditValue] = useState(value);
  const [selectedType, setSelectedType] = useState<FieldType>(
    typeof value === 'boolean' ? 'boolean' :
    typeof value === 'number' ? 'number' :
    value instanceof Timestamp ? 'timestamp' :
    Array.isArray(value) ? 'array' :
    typeof value === 'object' && value !== null ? 'map' : 'string'
  );

  const renderValue = (val: any) => {
    if (val instanceof Timestamp) return val.toDate().toLocaleString();
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (typeof val === 'object' && val !== null) return 'Map{...}';
    return String(val);
  };

  const handleSave = () => {
    let finalValue = editValue;
    if (selectedType === 'number') finalValue = Number(editValue);
    if (selectedType === 'boolean') finalValue = editValue === 'true' || editValue === true;
    onSave(editKey, finalValue);
    setIsEditing(false);
  };

  return (
    <div className={`group border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
      <div className="flex items-start p-6 hover:bg-slate-500/5 transition-colors relative">
        <div className="w-1/3 space-y-1">
          {isEditing ? (
             <div className="space-y-2">
                <input
                  value={editKey}
                  onChange={e => setEditKey(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-white focus:outline-none focus:border-blue-500"
                  placeholder="Key name"
                />
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as FieldType)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-400 focus:outline-none"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="timestamp">Timestamp</option>
                  <option value="array">Array</option>
                  <option value="map">Map</option>
                </select>
             </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{fieldKey}</span>
                {isCore && <Lock className="w-2.5 h-2.5 text-amber-500" />}
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{selectedType}</span>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          {isEditing ? (
            <div className="space-y-3">
              {selectedType === 'string' && (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
                />
              )}
              {selectedType === 'number' && (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
                />
              )}
              {selectedType === 'boolean' && (
                <button
                  onClick={() => setEditValue(!editValue)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editValue ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                >
                  {editValue ? 'TRUE' : 'FALSE'}
                </button>
              )}
              {selectedType === 'timestamp' && (
                <input
                  type="datetime-local"
                  value={editValue instanceof Timestamp ? editValue.toDate().toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditValue(Timestamp.fromDate(new Date(e.target.value)))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
                />
              )}
              {(selectedType === 'array' || selectedType === 'map') && (
                <textarea
                  value={JSON.stringify(editValue, null, 2)}
                  onChange={(e) => {
                    try { setEditValue(JSON.parse(e.target.value)); } catch (err) {}
                  }}
                  rows={8}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-blue-500 transition-all resize-none"
                />
              )}
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Save Change</button>
                <button onClick={() => { setIsEditing(false); setEditValue(value); }} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancel</button>
              </div>
            </div>
          ) : (
            <p className={`text-sm font-mono break-all ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {renderValue(value)}
            </p>
          )}
        </div>

        {!isCore && !isEditing && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-inherit pl-4 py-1">
            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-lg text-blue-500 hover:text-white" title="Edit Field"><Edit3 className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 hover:text-rose-100" title="Delete Field"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Database Explorer ---

export const FirestoreDatabaseExplorer: React.FC = () => {
  const { appUser } = useAuth();
  const { theme } = useTheme();

  // Navigation State
  const [viewMode, setViewMode] = useState<ExplorerViewMode>('collections');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentReference[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection State
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Modal States
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [newDocId, setNewDocId] = useState('');

  // Batch Edit State
  const [batchEditKey, setBatchEditKey] = useState('');
  const [batchEditType, setBatchEditType] = useState<FieldType>('string');
  const [batchEditValue, setBatchEditValue] = useState<any>('');

  if (appUser?.role !== 'ADMIN_GOVERNANCE') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-50 p-20">
        <Lock className="w-16 h-16 text-rose-500" />
        <p className="text-sm font-black uppercase tracking-widest text-center">Administrative Clearance Required <br/><span className="text-[10px] text-slate-500">Your role does not grant database structural access</span></p>
      </div>
    );
  }

  useEffect(() => {
    if (!activeCollection) return;

    if (activeCollection === 'firebase_auth') {
      fetchAuthUsersAsDocs();
      return;
    }

    setLoading(true);
    const q = query(collection(db, activeCollection), limit(150));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        label: resolveDocLabel(d.id, d.data()),
        data: d.data()
      }));
      setDocuments(data);
      setLoading(false);
    });

    return unsub;
  }, [activeCollection]);

  const filteredDocs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return documents.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.label.toLowerCase().includes(q)
    );
  }, [documents, searchTerm]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const handleSaveField = async (oldKey: string, newKey: string, newValue: any) => {
    if (!selectedDocId || !activeCollection) return;
    try {
      const docRef = doc(db, activeCollection, selectedDocId);
      if (oldKey !== newKey) {
        await updateDoc(docRef, {
          [newKey]: newValue,
          [oldKey]: deleteField()
        });
      } else {
        await updateDoc(docRef, { [newKey]: newValue });
      }
      toast.success('Field changes committed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteField = async (fieldKey: string) => {
    if (!selectedDocId || !activeCollection || !window.confirm(`Delete field '${fieldKey}'?`)) return;
    try {
      const docRef = doc(db, activeCollection, selectedDocId);
      const { [fieldKey]: _, ...remainingData } = selectedDoc?.data || {};
      await setDoc(docRef, remainingData);
      toast.success('Field deleted from node');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddField = async () => {
    const key = window.prompt('Enter new field key:');
    if (!key || !selectedDocId || !activeCollection) return;
    try {
      const docRef = doc(db, activeCollection, selectedDocId);
      await updateDoc(docRef, { [key]: '' });
      toast.success('Schema extended with new field');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateDocument = async () => {
    if (!activeCollection) return;
    try {
      const id = newDocId || undefined;
      const colRef = collection(db, activeCollection);
      if (id) {
        await setDoc(doc(db, activeCollection, id), { createdAt: serverTimestamp() });
      } else {
        await addDoc(colRef, { createdAt: serverTimestamp() });
      }
      setIsAddDocModalOpen(false);
      setNewDocId('');
      toast.success('New document committed to collection');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBatchDelete = async () => {
    if (!activeCollection || !window.confirm(`Bulk-delete ${selectedDocIds.length} items? THIS CANNOT BE UNDONE.`)) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      selectedDocIds.forEach(id => {
        batch.delete(doc(db, activeCollection!, id));
      });
      await batch.commit();

      setSelectedDocIds([]);
      toast.success(`${selectedDocIds.length} items deleted from system`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchEdit = async () => {
    if (!batchEditKey || !activeCollection) return;
    const batch = writeBatch(db);

    let processedValue = batchEditValue;
    if (batchEditType === 'number') processedValue = Number(batchEditValue);
    if (batchEditType === 'boolean') processedValue = batchEditValue === 'true' || batchEditValue === true;
    if (batchEditType === 'timestamp') processedValue = Timestamp.fromDate(new Date(batchEditValue));
    if (batchEditType === 'array' || batchEditType === 'map') {
      try { processedValue = JSON.parse(batchEditValue); } catch (e) { toast.error("Invalid JSON for batch update"); return; }
    }

    selectedDocIds.forEach(id => {
      batch.update(doc(db, activeCollection!, id), { [batchEditKey]: processedValue });
    });

    try {
      await batch.commit();
      setSelectedDocIds([]);
      setIsBatchEditModalOpen(false);
      setBatchEditKey('');
      setBatchEditValue('');
      toast.success(`Injected field into ${selectedDocIds.length} documents`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportCollection = () => {
    if (!activeCollection) return;
    try {
      const exportData = documents.map(d => {
        const flat: any = { id: d.id };
        Object.entries(d.data).forEach(([k, v]) => {
          if (v instanceof Timestamp) flat[k] = v.toDate().toISOString();
          else if (typeof v === 'object' && v !== null) flat[k] = JSON.stringify(v);
          else flat[k] = v;
        });
        return flat;
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bcf_db_export_${activeCollection}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Collection data ported to JSON');
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleExportExcel = () => {
    if (!activeCollection) return;
    try {
      const exportData = documents.map(d => {
        const flat: any = { id: d.id };
        Object.entries(d.data).forEach(([k, v]) => {
          if (v instanceof Timestamp) flat[k] = v.toDate().toISOString();
          else if (typeof v === 'object' && v !== null) flat[k] = JSON.stringify(v);
          else flat[k] = v;
        });
        return flat;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, activeCollection.substring(0, 31));
      XLSX.writeFile(workbook, `bcf_db_export_${activeCollection}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Collection exported to Excel');
    } catch (err: any) {
      toast.error(`Excel export failed: ${err.message}`);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCollection) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
          throw new Error("Import file must be a JSON array of documents.");
        }

        if (!window.confirm(`Import ${data.length} documents into '${activeCollection}'? This may overwrite existing data.`)) return;

        const batch = writeBatch(db);
        data.forEach((item: any) => {
          const { id, ...rest } = item;
          const docId = id || undefined;
          if (docId) {
            batch.set(doc(db, activeCollection!, docId), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
          } else {
            const newRef = doc(collection(db, activeCollection!));
            batch.set(newRef, { ...rest, createdAt: serverTimestamp() });
          }
        });

        await batch.commit();
        toast.success(`Successfully ingested ${data.length} documents`);
      } catch (err: any) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCollection) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!window.confirm(`Import ${json.length} rows from Excel into '${activeCollection}'?`)) return;

        const batch = writeBatch(db);
        json.forEach((item: any) => {
          const { id, ...rest } = item;
          Object.keys(rest).forEach(key => {
            if (typeof rest[key] === 'string') {
              if (rest[key].startsWith('{') || rest[key].startsWith('[')) {
                 try { rest[key] = JSON.parse(rest[key]); } catch (e) {}
              }
            }
          });

          const docId = id || undefined;
          if (docId) {
            batch.set(doc(db, activeCollection!, String(docId)), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
          } else {
            const newRef = doc(collection(db, activeCollection!));
            batch.set(newRef, { ...rest, createdAt: serverTimestamp() });
          }
        });

        await batch.commit();
        toast.success(`Successfully imported ${json.length} documents from Excel`);
      } catch (err: any) {
        toast.error(`Excel import failed: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-transparent">

      {/* 1. COLLECTION SELECTION PAGE */}
      {viewMode === 'collections' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-scrollbar min-h-0 touch-pan-y">
            {TOP_LEVEL_COLLECTIONS.map(col => {
              const isAuth = col === 'firebase_auth';
              return (
                <button
                  key={col}
                  onClick={() => { setActiveCollection(col); setViewMode('documents'); }}
                  className={`group p-8 rounded-[2.5rem] border backdrop-blur-[75px] text-left transition-all hover:-translate-y-1 ${
                    theme === 'dark'
                      ? (isAuth ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50' : 'bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5')
                      : (isAuth ? 'bg-blue-50 border-blue-100 hover:border-blue-500/50' : 'bg-slate-50 border-slate-100 hover:border-blue-500/50')
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 transition-colors ${
                    theme === 'dark'
                      ? (isAuth ? 'bg-blue-950/40 border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-950/40 border-white/5 text-white group-hover:bg-amber-500 group-hover:text-slate-950')
                      : (isAuth ? 'bg-blue-100 border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-200 border-slate-300 text-slate-700 group-hover:bg-blue-500 group-hover:text-white')
                  }`}>
                    {isAuth ? <ShieldCheck className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-black text-main dark:text-white uppercase tracking-tight">{col.replace(/_/g, ' ')}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 group-hover:text-amber-500 transition-colors">
                    {isAuth ? 'Manage Authentication' : 'Explore Data Schema'}
                  </p>
                </button>
              );
            })}

            <button
              onClick={() => { (window as any)._pendingSettingsTab = 'storage'; window.dispatchEvent(new CustomEvent('app:settings:switch', { detail: 'storage' })); }}
              className={`group p-8 rounded-[2.5rem] border backdrop-blur-[75px] text-left transition-all hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                  : 'bg-emerald-50 border-emerald-100 hover:border-emerald-500/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 transition-colors ${
                theme === 'dark'
                  ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
                  : 'bg-emerald-100 border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}>
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-main dark:text-white uppercase tracking-tight">Cloud Storage</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 group-hover:text-emerald-400 transition-colors">
                Manage bucket & file assets
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 2. DOCUMENT LIST PAGE */}
      {viewMode === 'documents' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500 relative bg-transparent">
          <header className="sticky top-0 z-10 p-4 md:p-8 border-b border-white/5 flex flex-col gap-4 md:gap-6 bg-slate-950/60 backdrop-blur-[75px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('collections')} className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md">
                  <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-black text-main dark:text-white uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{activeCollection?.replace(/_/g, ' ')}</h2>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{activeCollection === 'firebase_auth' ? 'Auth Cluster' : 'Document Ledger'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeCollection !== 'firebase_auth' && (
                  <div className="flex gap-2 shrink-0">
                    <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                      <button onClick={handleExportCollection} className="px-2 md:px-3 py-1 text-[7px] md:text-[8px] font-black uppercase text-slate-300 hover:text-cyan-400 hover:bg-white/10 border-b border-white/5 flex items-center gap-1.5 transition-colors">
                        <FileDown className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">JSON</span>
                      </button>
                      <button onClick={handleExportExcel} className="px-2 md:px-3 py-1 text-[7px] md:text-[8px] font-black uppercase text-slate-300 hover:text-emerald-400 hover:bg-white/10 flex items-center gap-1.5 transition-colors">
                        <Download className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">EXCEL</span>
                      </button>
                    </div>

                    <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                      <label className="px-2 md:px-3 py-1 text-[7px] md:text-[8px] font-black uppercase text-slate-300 hover:text-amber-400 hover:bg-white/10 border-b border-white/5 flex items-center gap-1.5 cursor-pointer transition-colors">
                        <FileUp className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden xs:inline">JSON</span>
                        <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                      </label>
                      <label className="px-2 md:px-3 py-1 text-[7px] md:text-[8px] font-black uppercase text-slate-300 hover:text-emerald-400 hover:bg-white/10 flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden xs:inline">EXCEL</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {activeCollection !== 'firebase_auth' && (
                  <button
                    onClick={() => setIsAddDocModalOpen(true)}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3.5 bg-blue-600/40 text-white rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all backdrop-blur-md border border-white/10"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="whitespace-nowrap">Add Document</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/20 border border-white/10 rounded-xl md:rounded-2xl pl-12 pr-4 md:pr-6 py-2.5 md:py-4 text-[10px] md:text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-all uppercase tracking-tighter backdrop-blur-md shadow-inner"
              />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-2 no-scrollbar bg-transparent pb-32 min-h-0 touch-pan-y">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Querying Firestore Cluster...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-40 opacity-20">
                <FileJson className="w-20 h-20 mx-auto mb-4" />
                <p className="text-xl font-black uppercase tracking-widest">No Documents Found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocs.map(docRef => (
                  <div
                    key={docRef.id}
                    onClick={() => { setSelectedDocId(docRef.id); setViewMode('inspector'); }}
                    className={`group flex items-center gap-4 p-6 rounded-3xl border backdrop-blur-[75px] transition-all cursor-pointer ${
                      selectedDocId === docRef.id
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/10' : 'bg-white border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocIds(prev => prev.includes(docRef.id) ? prev.filter(id => id !== docRef.id) : [...prev, docRef.id]);
                      }}
                      className="shrink-0"
                    >
                      {selectedDocIds.includes(docRef.id) ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-slate-700" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-black uppercase tracking-tight truncate ${selectedDocId === docRef.id ? 'text-white' : 'text-main dark:text-slate-300 group-hover:text-amber-500'}`}>
                        {docRef.label}
                      </p>
                      <p className="text-[9px] font-mono text-slate-600 truncate uppercase mt-1">UUID: {docRef.id}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDocIds.length > 0 && (
            <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
              <div className="bg-slate-900/40 text-white px-5 md:px-10 py-4 md:py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-5 md:gap-10 border border-white/20 pointer-events-auto animate-in slide-in-from-bottom-8 duration-400 backdrop-blur-[75px] max-w-[95%]">
                <div className="flex items-center gap-3 md:border-r border-white/10 md:pr-10">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] md:text-[12px] font-black uppercase tracking-widest leading-none truncate">
                      {selectedDocIds.length} {selectedDocIds.length === 1 ? 'Document' : 'Documents'} Selected
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 hidden xs:block">Cloud Control Ready</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-8">
                  <button onClick={() => setIsBatchEditModalOpen(true)} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 backdrop-blur-md">
                    <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{selectedDocIds.length === 1 ? 'Edit' : 'Batch Update'}</span>
                  </button>
                  <button onClick={handleBatchDelete} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-rose-300 hover:text-white hover:bg-rose-600 transition-all active:scale-95 backdrop-blur-md">
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{selectedDocIds.length === 1 ? 'Delete' : 'Bulk Delete'}</span>
                  </button>
                  <button onClick={() => setSelectedDocIds([])} className="md:ml-4 p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                    <XIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DOCUMENT INSPECTOR PAGE */}
      {viewMode === 'inspector' && selectedDoc && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500 relative bg-transparent">
          <header className="sticky top-0 z-10 p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/30 backdrop-blur-[75px]">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <button onClick={() => setViewMode('documents')} className="p-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-all shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-main dark:text-white uppercase tracking-tighter truncate">{selectedDoc.label}</h2>
                </div>
                <p className="text-[10px] font-mono text-slate-500 uppercase truncate mt-1">Cloud Path: {activeCollection}/{selectedDoc.id}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddField} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Add New Field
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-20 min-h-0 touch-pan-y">
            <div className="mx-8 mt-6">
            {selectedDoc && Object.entries(selectedDoc.data)
              .sort(([ka], [kb]) => {
                const core = ['uid', 'userId', 'email', 'role', 'createdAt', 'updatedAt'];
                if (core.includes(ka) && !core.includes(kb)) return -1;
                if (!core.includes(ka) && core.includes(kb)) return 1;
                return ka.localeCompare(kb);
              })
              .map(([key, value]) => (
                <FieldRow
                  key={key}
                  fieldKey={key}
                  value={value}
                  isCore={['uid', 'userId', 'email', 'role', 'createdAt', 'updatedAt'].includes(key)}
                  onSave={(newKey, newVal) => handleSaveField(key, newKey, newVal)}
                  onDelete={() => handleDeleteField(key)}
                />
            ))}
            </div>
          </div>
        </div>
      )}

      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <h3 className="text-xl font-black text-main dark:text-white uppercase tracking-tight">Provision New Node</h3>
              <button onClick={() => setIsAddDocModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Custom Document ID (Optional)</label>
                 <input
                   value={newDocId}
                   onChange={(e) => setNewDocId(e.target.value)}
                   placeholder="System will auto-generate if empty..."
                   className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                 />
               </div>
               <button onClick={handleCreateDocument} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">Commit to {activeCollection?.toUpperCase()}</button>
            </div>
          </div>
        </div>
      )}

      {isBatchEditModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#0D111A] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div>
                <h3 className="text-xl font-black text-main dark:text-white uppercase tracking-tight">Batch Field Injection</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Affecting {selectedDocIds.length} unique nodes</p>
              </div>
              <button onClick={() => setIsBatchEditModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Field Key</label>
                    <input
                      value={batchEditKey}
                      onChange={(e) => setBatchEditKey(e.target.value)}
                      placeholder="e.g. status, role, isVerified"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Type</label>
                    <select
                      value={batchEditType}
                      onChange={(e) => setBatchEditType(e.target.value as FieldType)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="string">String (Text)</option>
                      <option value="number">Number (Integer/Float)</option>
                      <option value="boolean">Boolean (Switch)</option>
                      <option value="timestamp">Timestamp (ISO)</option>
                      <option value="array">Array (JSON List)</option>
                      <option value="map">Map (JSON Object)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Value Payload</label>
                    {batchEditType === 'boolean' ? (
                      <select
                        value={String(batchEditValue)}
                        onChange={(e) => setBatchEditValue(e.target.value === 'true')}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : batchEditType === 'timestamp' ? (
                      <input
                        type="datetime-local"
                        value={batchEditValue}
                        onChange={(e) => setBatchEditValue(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    ) : (
                      <input
                        value={batchEditValue}
                        onChange={(e) => setBatchEditValue(e.target.value)}
                        placeholder="Enter value..."
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    )}
                 </div>
               </div>
               <button onClick={handleBatchEdit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">Execute Batch Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
