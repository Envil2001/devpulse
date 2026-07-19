'use client';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Settings</h1>
        <p className="desc mt-1 text-neutral-400">Manage your account and preferences</p>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">API KEYS</p>
        <p className="body1 text-neutral-300">
          Create and manage API keys for the VS Code extension.
        </p>
        <button className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950">
          Create new key
        </button>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">PREFERENCES</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="body1 text-neutral-200">Timezone</p>
              <p className="desc text-neutral-500">Used for daily calculations</p>
            </div>
            <select className="rounded-lg bg-neutral-800 px-3 py-2 text-neutral-100">
              <option>Europe/Moscow</option>
              <option>UTC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
