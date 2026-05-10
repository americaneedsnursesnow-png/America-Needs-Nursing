import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

type AppShellProps = {
  children: ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
};

export function AppShell({ children, showFooter = true, showHeader = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {showHeader ? (
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
      ) : null}
      {showHeader ? <Header /> : null}

      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </main>

      {/* If showFooter is true, show Footer. If false, show nothing */}
      {showFooter ? <Footer /> : null}
    </div>
  );
}