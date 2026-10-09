import React, { useState } from 'react';
import { BookOpenCheck, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type LandingSectionId = 'home' | 'study-notes' | 'features' | 'how-it-works';

interface PublicNavbarProps {
  onNavigateHome: () => void;
  onNavigateSection: (sectionId: LandingSectionId) => void;
  onNavigateLogin: () => void;
  onNavigateDashboard?: () => void;
  isAuthenticated?: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onNavigateHome,
  onNavigateSection,
  onNavigateLogin,
  onNavigateDashboard,
  isAuthenticated = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: LandingSectionId; label: string; href: string }[] = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'study-notes', label: 'Study Notes', href: '#study-notes' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  ];

  const handleLinkClick = (e: React.MouseEvent, id: LandingSectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigateSection(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-stone-border transition-colors">
      <div className="max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Product Name */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            onNavigateHome();
          }}
          className="inline-flex items-center gap-3 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
        >
          <div className="w-9 h-9 rounded-lg bg-sidebar text-sidebar-text flex items-center justify-center shadow-card shrink-0 group-hover:opacity-95 transition-opacity">
            <BookOpenCheck className="w-5 h-5 text-[var(--soft-apricot)]" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-carbon">
            Academic Insight
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-2"
        >
          {navLinks.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.id)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-ink-secondary hover:text-carbon hover:bg-subtle/60 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle + Prominent Login Button + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {isAuthenticated && onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="hidden sm:inline-flex btn-secondary py-2 px-3.5 text-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-bluebell" />
              <span>Dashboard</span>
            </button>
          )}

          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              onNavigateLogin();
            }}
            className="btn-primary py-2 px-4 text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg border border-stone-border bg-surface text-carbon hover:bg-subtle transition-colors"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-border bg-surface px-5 py-4 space-y-2 shadow-elevated">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.id)}
                className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-carbon hover:bg-subtle/70 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {isAuthenticated && onNavigateDashboard && (
            <div className="pt-2 border-t border-stone-border">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateDashboard();
                }}
                className="w-full btn-secondary py-2 text-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-bluebell" />
                <span>Open Authorized Dashboard</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
