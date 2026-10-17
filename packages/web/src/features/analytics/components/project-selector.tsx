'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useProjects } from '@/features/projects/hooks';

interface ProjectSelectorProps {
  value?: string;
  onChange: (projectId?: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { data: projects = [] } = useProjects();

  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
      <SelectTrigger className="w-40 h-9">
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
