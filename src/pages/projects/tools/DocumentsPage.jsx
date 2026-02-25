import { useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Folder, File, Upload, FolderPlus, MoreVertical,
  Download, Mail, Pencil, Move, Copy, Trash2, ChevronRight, Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { projectId } = useParams();
  const { documents, addDocument, updateDocument, deleteDocument, copyDocument, moveDocument } = useData();

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameDoc, setRenameDoc] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveDoc, setMoveDoc] = useState(null);
  const [moveDest, setMoveDest] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const projectDocs = useMemo(() => documents.filter(d => d.projectId === projectId), [documents, projectId]);
  const currentItems = useMemo(() => projectDocs.filter(d => (d.parentId || null) === currentFolderId), [projectDocs, currentFolderId]);

  const breadcrumb = useMemo(() => {
    const path = [];
    let folderId = currentFolderId;
    while (folderId) {
      const folder = projectDocs.find(d => d.id === folderId);
      if (!folder) break;
      path.unshift(folder);
      folderId = folder.parentId;
    }
    return path;
  }, [currentFolderId, projectDocs]);

  const allFolders = useMemo(() => projectDocs.filter(d => d.type === 'folder'), [projectDocs]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) { toast.error('Enter a folder name'); return; }
    addDocument(projectId, currentFolderId, newFolderName.trim(), 'folder');
    setNewFolderName(''); setShowNewFolder(false);
    toast.success('Folder created');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => addDocument(projectId, currentFolderId, file.name, 'file', { name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result });
      reader.readAsDataURL(file);
    });
    if (files.length > 0) toast.success(`${files.length} file(s) uploaded`);
    e.target.value = '';
  };

  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const folderMap = {};
    files.forEach(file => {
      const top = file.webkitRelativePath.split('/')[0];
      if (!folderMap[top]) folderMap[top] = [];
      folderMap[top].push(file);
    });
    Object.entries(folderMap).forEach(([name, ffiles]) => {
      const folder = addDocument(projectId, currentFolderId, name, 'folder');
      ffiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => addDocument(projectId, folder.id, file.name, 'file', { name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result });
        reader.readAsDataURL(file);
      });
    });
    toast.success('Folder uploaded');
    e.target.value = '';
  };

  const handleDownload = (doc) => {
    if (doc.type === 'folder') { toast('Select individual files to download'); return; }
    if (doc.fileData?.dataUrl) {
      const a = document.createElement('a'); a.href = doc.fileData.dataUrl; a.download = doc.name; a.click();
    } else toast.error('File not available');
  };

  const handleEmail = (doc) => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Document: ${doc.name}`)}&body=${encodeURIComponent(`Please find attached: ${doc.name}`)}`;
  };

  const sorted = useMemo(() => [...currentItems].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  }), [currentItems]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-bold tracking-tight">Documents</h2>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
          <input ref={folderInputRef} type="file" webkitdirectory="" multiple className="hidden" onChange={handleFolderUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload File
          </Button>
          <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Folder
          </Button>
          <Button size="sm" onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" /> New Folder
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" /> Root
        </button>
        {breadcrumb.map((folder, i) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            <button onClick={() => setCurrentFolderId(folder.id)} className={i === breadcrumb.length - 1 ? 'text-foreground font-medium' : 'hover:text-foreground transition-colors'}>
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed text-muted-foreground">
          <Folder className="h-9 w-9 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium">This folder is empty</p>
          <p className="text-xs mt-1">Upload files or create a folder to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Size</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Created</th>
                <th className="px-5 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-5 py-3">
                    <button
                      className="flex items-center gap-2.5 text-left hover:text-primary transition-colors"
                      onClick={() => doc.type === 'folder' && setCurrentFolderId(doc.id)}
                    >
                      {doc.type === 'folder'
                        ? <Folder className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        : <File className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                      <span className={doc.type === 'folder' ? 'font-medium' : ''}>{doc.name}</span>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {doc.type === 'file' ? formatBytes(doc.fileData?.size) : '—'}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell text-xs">
                    {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleDownload(doc)} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleEmail(doc)} title="Email">
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => { setRenameDoc(doc); setRenameValue(doc.name); }} className="gap-2 cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setMoveDoc(doc); setMoveDest(doc.parentId || '__root__'); }} className="gap-2 cursor-pointer">
                            <Move className="h-3.5 w-3.5" /> Move
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { copyDocument(doc.id, currentFolderId); toast.success('Copied'); }} className="gap-2 cursor-pointer">
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => setConfirmDelete(doc)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>Folder name</Label>
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Drawings" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameDoc} onOpenChange={v => !v && setRenameDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { updateDocument(renameDoc.id, { name: renameValue.trim() }); setRenameDoc(null); toast.success('Renamed'); } }} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancel</Button>
              <Button onClick={() => { if (!renameValue.trim()) return; updateDocument(renameDoc.id, { name: renameValue.trim() }); setRenameDoc(null); toast.success('Renamed'); }}>Rename</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveDoc} onOpenChange={v => !v && setMoveDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move "{moveDoc?.name}"</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Select value={moveDest} onValueChange={setMoveDest}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">Root (top level)</SelectItem>
                {allFolders.filter(f => f.id !== moveDoc?.id).map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMoveDoc(null)}>Cancel</Button>
              <Button onClick={() => { moveDocument(moveDoc.id, moveDest === '__root__' ? null : moveDest); setMoveDoc(null); toast.success('Moved'); }}>Move</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.name}"?`}
        description={confirmDelete?.type === 'folder' ? 'This will permanently delete the folder and all its contents.' : 'This file will be permanently deleted.'}
        onConfirm={() => { deleteDocument(confirmDelete.id); if (currentFolderId === confirmDelete.id) setCurrentFolderId(null); setConfirmDelete(null); toast.success('Deleted'); }}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
