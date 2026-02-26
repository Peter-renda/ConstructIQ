import { Hammer } from 'lucide-react';

export function ReportingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Hammer className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Reporting</h2>
      <p className="text-sm text-muted-foreground mt-1">This section is still under construction.</p>
    </div>
  );
}
