'use client';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">devpulse-backend</h1>
        <p className="desc mt-1 text-neutral-400">github.com/devpulse/backend.git</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Active Time</p>
          <p className="h6 mt-1 text-neutral-100">9h 40m</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Focus Score</p>
          <p className="h6 mt-1 text-green-spring">87%</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Sessions</p>
          <p className="h6 mt-1 text-neutral-100">14</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="body1 text-neutral-400">Branches</p>
          <p className="h6 mt-1 text-neutral-100">5</p>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <p className="mini mb-4 text-neutral-400">ACTIVITY THIS WEEK</p>
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-neutral-800">
          <span className="desc text-neutral-600">Chart placeholder</span>
        </div>
      </div>
    </div>
  );
}
