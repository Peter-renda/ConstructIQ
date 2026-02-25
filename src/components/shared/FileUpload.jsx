import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FileUpload({ onFiles, accept, multiple = true, className }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        className
      )}
    >
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Drag & drop files here, or <span className="text-primary">browse</span></p>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={e => onFiles(Array.from(e.target.files))} />
    </div>
  );
}
