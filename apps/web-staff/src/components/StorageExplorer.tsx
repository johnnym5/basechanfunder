import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ArrowLeft,
  Search,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  Eye,
  Loader2,
  HardDrive,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { StorageUsageBar } from './ui/StorageUsageBar';
import { ref, listAll, getMetadata, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';

interface StorageItem {
  name: string;
  path: string;
  type: string;
  size?: number;
  updated?: string;
  isImage?: boolean;
}

export const StorageExplorer: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [items, setItems] = useState<{ folders: StorageItem[], files: StorageItem[] }>({ folders: [], files: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [previewItem, setPreviewItem] = useState<StorageItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  const updateMetrics = async (bytesChange: number) => {
    const metricsRef = doc(db, 'system', 'storage_metrics');
    try {
      await updateDoc(metricsRef, {
        totalBytesUsed: increment(bytesChange)
      });
    } catch (e) {
      // If doc doesn't exist, initialize it
      await setDoc(metricsRef, { totalBytesUsed: Math.max(0, bytesChange) }, { merge: true });
    }
  };

  const fetchItems = async (prefix: string) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, prefix);
      const res = await listAll(storageRef);

      const folders = res.prefixes.map(p => ({
        name: p.name + '/',
        path: p.fullPath + '/',
        type: 'folder'
      }));

      const fileItems = await Promise.all(res.items.map(async (item) => {
        const metadata = await getMetadata(item);
        return {
          name: item.name,
          path: item.fullPath,
          size: metadata.size,
          type: metadata.contentType || 'application/octet-stream',
          updated: metadata.updated,
          isImage: (metadata.contentType || '').startsWith('image/')
        };
      }));

      setItems({
        folders,
        files: fileItems
      });
      setSelectedPaths([]);
    } catch (err) {
      console.error('Storage list error:', err);
      toast.error('Failed to load storage items');
      setItems({ folders: [], files: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPrefix);
  }, [currentPrefix]);

  const handleFolderClick = (path: string) => {
    setCurrentPrefix(path);
  };

  const handleBack = () => {
    const parts = currentPrefix.split('/').filter(Boolean);
    parts.pop();
    setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '');
  };

  const toggleSelect = (path: string) => {
    setSelectedPaths(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const toggleSelectAll = () => {
    const allFilePaths = items.files.map(f => f.path);
    if (selectedPaths.length === allFilePaths.length) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(allFilePaths);
    }
  };

  const handleDelete = async () => {
    if (selectedPaths.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPaths.length} items?`)) return;

    const t = toast.loading(`Deleting ${selectedPaths.length} items...`);
    try {
      let totalBytesDeleted = 0;
      await Promise.all(selectedPaths.map(async (path) => {
        const fileRef = ref(storage, path);
        const metadata = await getMetadata(fileRef);
        totalBytesDeleted += metadata.size;
        await deleteObject(fileRef);
      }));

      await updateMetrics(-totalBytesDeleted);
      toast.success('Items deleted successfully', { id: t });
      fetchItems(currentPrefix);
    } catch (err) {
      toast.error('Deletion failed', { id: t });
    }
  };

  const openPreview = async (item: StorageItem) => {
    setPreviewItem(item);
    setLoadingUrl(true);
    try {
      const fileRef = ref(storage, item.path);
      const url = await getDownloadURL(fileRef);
      setPreviewUrl(url);
    } catch (err) {
      toast.error('Failed to get preview URL');
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const t = toast.loading(`Uploading ${files.length} files...`);

    try {
      let totalBytesUploaded = 0;
      await Promise.all(Array.from(files).map(async (file) => {
        const storageRef = ref(storage, currentPrefix + file.name);
        await uploadBytes(storageRef, file);
        totalBytesUploaded += file.size;
      }));

      await updateMetrics(totalBytesUploaded);
      toast.success('Upload complete', { id: t });
      fetchItems(currentPrefix);
    } catch (err) {
      toast.error('Upload failed', { id: t });
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const breadcrumbs = currentPrefix.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      <StorageUsageBar />

      <div className={`rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0D111A] border-white/5' : 'bg-white border-slate-200'
      }`}>
        {/* Header / Toolbar */}
        <div className={`p-6 border-b flex items-center justify-between gap-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPrefix('')}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                >
                  gs://basechanfunder.app
                </button>
                {breadcrumbs.map((part, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <button
                      onClick={() => setCurrentPrefix(breadcrumbs.slice(0, i + 1).join('/') + '/')}
                      className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] ${
                        i === breadcrumbs.length - 1 ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {part}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
               <button
                 onClick={() => setViewMode('list')}
                 className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? (isDark ? 'bg-white/10 text-white' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
               >
                 <ListIcon className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setViewMode('grid')}
                 className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? (isDark ? 'bg-white/10 text-white' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
               >
                 <Grid className="w-4 h-4" />
               </button>
             </div>

             <button
               onClick={() => fetchItems(currentPrefix)}
               className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'}`}
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>

             <button
               onClick={() => document.getElementById('file-upload')?.click()}
               disabled={uploading}
               className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
             >
               {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
               <span>{uploading ? 'Uploading...' : 'Upload file'}</span>
             </button>
             <input
               id="file-upload"
               type="file"
               multiple
               className="hidden"
               onChange={handleUpload}
             />
          </div>
        </div>

        {/* Selection Action Bar */}
        <AnimatePresence>
          {selectedPaths.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-600 px-6 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-white tracking-widest">
                  {selectedPaths.length} Items Selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2">
                   <Download className="w-3 h-3" />
                   <span>Export ZIP</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2"
                >
                   <Trash2 className="w-3 h-3" />
                   <span>Delete Selected</span>
                </button>
                <button
                  onClick={() => setSelectedPaths([])}
                  className="p-1.5 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explorer Area */}
        <div className="min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Scanning Bucket...</p>
              </div>
            </div>
          )}

          {viewMode === 'list' ? (
            <div className="w-full">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'} border-b`}>
                    <th className="px-6 py-4 w-12">
                      <button onClick={toggleSelectAll} className="hover:text-blue-500 transition-colors">
                        {selectedPaths.length > 0 && selectedPaths.length === items.files.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Last modified</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentPrefix !== '' && (
                    <tr onClick={handleBack} className="hover:bg-white/5 cursor-pointer group transition-colors">
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <ArrowLeft className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">.. / Back</span>
                      </td>
                      <td colSpan={4}></td>
                    </tr>
                  )}

                  {items.folders?.map(folder => (
                    <tr
                      key={folder.path}
                      onClick={() => handleFolderClick(folder.path)}
                      className="hover:bg-white/5 cursor-pointer group transition-colors"
                    >
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform`}>
                            <Folder className="w-4 h-4 fill-current opacity-60" />
                          </div>
                          <span className="text-[11px] font-black text-white uppercase tracking-tight">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">--</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Folder</td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">--</td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
                      </td>
                    </tr>
                  ))}

                  {items.files?.map(file => {
                    const isSelected = selectedPaths.includes(file.path);
                    return (
                      <tr
                        key={file.path}
                        className={`hover:bg-white/5 transition-colors group ${isSelected ? 'bg-blue-600/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                           <button onClick={() => toggleSelect(file.path)} className={`${isSelected ? 'text-blue-500' : 'text-slate-700 hover:text-slate-500'}`}>
                             {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                           </button>
                        </td>
                        <td className="px-6 py-4" onClick={() => openPreview(file)}>
                          <div className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:text-white transition-colors`}>
                              {file.isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <span className="text-[11px] font-bold text-slate-300 truncate max-w-[200px] uppercase tracking-tight">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">{formatSize(file.size)}</td>
                        <td className="px-6 py-4">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                             file.isImage ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                           }`}>
                             {file.type.split('/').pop()?.toUpperCase()}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                           {file.updated ? new Date(file.updated).toLocaleDateString() : '--'}
                        </td>
                        <td className="px-6 py-4">
                           <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                              <button onClick={() => openPreview(file)} className="p-1.5 text-slate-500 hover:text-white">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-500 hover:text-white">
                                <Download className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {/* Grid View Implementation Placeholder */}
                {items.folders?.map(folder => (
                  <div
                    key={folder.path}
                    onClick={() => handleFolderClick(folder.path)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Folder className="w-8 h-8 fill-current opacity-60" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase text-center truncate w-full px-1">{folder.name}</span>
                  </div>
                ))}
                {items.files?.map(file => (
                   <div
                    key={file.path}
                    onClick={() => openPreview(file)}
                    className="flex flex-col items-center gap-2 group cursor-pointer relative"
                   >
                     <button
                       onClick={(e) => { e.stopPropagation(); toggleSelect(file.path); }}
                       className={`absolute top-0 right-0 p-1 z-10 ${selectedPaths.includes(file.path) ? 'text-blue-500' : 'text-slate-700 opacity-0 group-hover:opacity-100'}`}
                     >
                       {selectedPaths.includes(file.path) ? <CheckSquare className="w-4 h-4 bg-slate-900 rounded" /> : <Square className="w-4 h-4 bg-slate-900 rounded" />}
                     </button>
                     <div className={`w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:scale-110 transition-all ${selectedPaths.includes(file.path) ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}>
                       {file.isImage ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase text-center truncate w-full px-1">{file.name}</span>
                   </div>
                ))}
             </div>
          )}

          {!loading && items.folders.length === 0 && items.files.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-700 mb-4">
                 <Folder className="w-10 h-10" />
               </div>
               <h4 className="text-sm font-black uppercase text-slate-600 tracking-widest">Directory Empty</h4>
               <p className="text-[10px] text-slate-700 font-bold uppercase mt-1">No files found in this path</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Drawer */}
      <AnimatePresence>
        {previewItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setPreviewItem(null); setPreviewUrl(null); }}
              className="fixed inset-0 z-[1100] bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 bottom-0 w-full max-w-xl z-[1200] shadow-2xl border-l flex flex-col ${
                isDark ? 'bg-[#0D111A] border-white/5' : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                     {previewItem.isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                   </div>
                   <div className="min-w-0">
                     <h3 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[300px]">{previewItem.name}</h3>
                     <p className="text-[10px] text-slate-500 font-mono uppercase">{formatSize(previewItem.size)} • {previewItem.type}</p>
                   </div>
                </div>
                <button onClick={() => { setPreviewItem(null); setPreviewUrl(null); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-slate-950/30">
                {loadingUrl ? (
                   <div className="flex flex-col items-center gap-3">
                     <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                     <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Generating Token...</p>
                   </div>
                ) : previewUrl ? (
                  previewItem.isImage ? (
                    <div className="relative group">
                       <img src={previewUrl} alt={previewItem.name} className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl border border-white/10" />
                       <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl backdrop-blur-[2px]">
                          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                             <ExternalLink className="w-4 h-4" />
                             Full Screen
                          </a>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                       <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 flex items-center justify-center text-slate-600 shadow-2xl border border-white/5">
                         <FileText className="w-16 h-16" />
                       </div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Preview Not Available</p>
                       <a
                         href={previewUrl}
                         download={previewItem.name}
                         className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-3"
                       >
                         <Download className="w-4 h-4" />
                         Download Document
                       </a>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-rose-500 font-bold uppercase">Error loading preview</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-slate-900/20">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage Path</p>
                     <p className="text-[11px] text-slate-300 font-mono break-all">{previewItem.path}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Modified</p>
                     <p className="text-[11px] text-slate-300 font-mono">{previewItem.updated ? new Date(previewItem.updated).toLocaleString() : '--'}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
