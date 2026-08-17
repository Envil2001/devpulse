import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 p-2 md:p-4">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-4xl bg-neutral-800/20 lg:flex"></section>

      <main className="flex flex-1 flex-col items-center justify-center px-6 lg:px-12">
        <div className="w-full max-w-100">{children}</div>
      </main>
    </div>
  );
}
