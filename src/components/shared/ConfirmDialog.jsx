import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = 'Delete', variant = 'destructive' }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
