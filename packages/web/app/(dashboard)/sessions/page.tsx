'use client';

export default function SessionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Sessions</h1>
        <p className="desc mt-1 text-neutral-400">Full history of your work sessions</p>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <div className="mb-4 grid grid-cols-12 gap-4 border-b border-neutral-800 pb-3 text-xs text-neutral-500">
          <div className="col-span-3">TIME</div>
          <div className="col-span-3">PROJECT</div>
          <div className="col-span-3">BRANCH</div>
          <div className="col-span-2">DURATION</div>
          <div className="col-span-1">FOCUS</div>
        </div>

        <div className="py-12 text-center">
          <p className="desc text-neutral-600">Sessions table will be here</p>
        </div>
      </div>
    </div>
  );
}
