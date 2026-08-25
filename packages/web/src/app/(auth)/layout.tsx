import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 p-2 md:p-4">
      <section className="relative hidden w-1/2 overflow-hidden rounded-4xl border border-white/5 bg-neutral-900/30 backdrop-blur-xl lg:block">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-purple-blue/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-green-spring/10 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      </section>

      <main className="flex flex-1 flex-col items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-100">{children}</div>
      </main>
    </div>
  );
}
