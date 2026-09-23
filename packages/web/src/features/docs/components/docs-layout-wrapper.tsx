'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

interface NavigationItem {
  title: string;
  href: string;
}

interface NavigationGroup {
  category: string;
  items: Array<NavigationItem>;
}

interface DocsLayoutWrapperProps {
  children: React.ReactNode;
  endpoints: Array<{
    id: string;
    method: string;
    path: string;
    summary: string;
  }>;
}

export function DocsLayoutWrapper({ children, endpoints }: DocsLayoutWrapperProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string>('introduction');
  const mainRef = React.useRef<HTMLElement>(null);

  const navigation: Array<NavigationGroup> = React.useMemo(() => {
    const groups: Array<NavigationGroup> = [
      {
        category: 'Overview',
        items: [
          { title: 'Introduction', href: '#introduction' },
          { title: 'Authentication', href: '#authentication' },
        ],
      },
    ];

    const endpointGroups = new Map<string, Array<NavigationItem>>();

    for (const endpoint of endpoints) {
      const pathParts = endpoint.path.split('/').filter(Boolean);
      const category = pathParts.length > 0 ? pathParts[0] : 'Endpoints';

      if (!endpointGroups.has(category)) {
        endpointGroups.set(category, []);
      }

      endpointGroups.get(category)?.push({
        title: endpoint.summary,
        href: `#${endpoint.id}`,
      });
    }

    for (const [category, items] of endpointGroups.entries()) {
      groups.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        items,
      });
    }

    return groups;
  }, [endpoints]);

  React.useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: container,
        rootMargin: '0px 0px -65% 0px',
        threshold: 0.1,
      },
    );

    const elements = container.querySelectorAll('[id]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden">
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-neutral-950 transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="size-4 text-neutral-400 group-hover:text-neutral-100 transition-colors" />
            <span className="mono-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">
              Dashboard
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="px-2">
            <div className="label-caps mb-1 text-neutral-500 font-semibold tracking-wider">
              DevPulse API
            </div>
            <div className="body-muted text-xs">v1.0 Public Reference</div>
          </div>

          {navigation.map((group: NavigationGroup) => (
            <div key={group.category} className="space-y-1">
              <div className="px-2 label-caps text-neutral-500 text-[11px] mb-2">
                {group.category}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item: NavigationItem) => {
                  const targetId = item.href.replace('#', '');
                  const isActive = activeId === targetId;

                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'block rounded-lg px-2.5 py-1.5 text-xs transition-all duration-150',
                          isActive
                            ? 'bg-white/10 font-medium text-neutral-100 border-l-2 border-green-spring pl-2'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200',
                        )}
                      >
                        {item.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 px-6 border-b border-white/5 lg:hidden bg-neutral-950/80 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="body-base font-semibold">API Reference</span>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
