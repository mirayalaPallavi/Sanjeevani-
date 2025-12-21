import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] mix-blend-overlay opacity-50 z-[-1]" />

      <Header />

      {/* Main Content with Transition */}
      <main className="flex-1 pt-4 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto animate-fade-in-scale">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/50 py-6 bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <div className="container text-center text-sm text-muted-foreground flex flex-col gap-2">
          <p>© 2025 Sanjeevani • Your Health Companion</p>
          <div className="flex justify-center gap-4 text-xs opacity-70">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
