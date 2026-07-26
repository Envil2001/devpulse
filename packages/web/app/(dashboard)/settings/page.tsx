'use client';

import { ApiKeysPanel } from '@/components/settings/api-keys-panel';

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="h4 text-neutral-100">Settings</h1>
        <p className="desc mt-1 text-neutral-400">Manage your account and preferences</p>
      </div>

      <ApiKeysPanel />

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">PREFERENCES</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="body1 text-neutral-200">Timezone</p>
              <p className="desc text-neutral-500">Used for daily calculations</p>
            </div>
            <select className="rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-electric">
              <option>Europe/Moscow</option>
              <option>UTC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
