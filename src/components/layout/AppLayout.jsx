import { TopNav } from './TopNav';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
