export interface NavigationItem {
  title: string;
  href: string;
}

export interface NavigationGroup {
  category: string;
  items: Array<NavigationItem>;
}

export interface EndpointData {
  id: string;
  method: string;
  path: string;
  summary: string;
  description?: string;
  scopes?: Array<string>;
  parameters?: Array<{
    name: string;
    in: 'header' | 'query' | 'path';
    required?: boolean;
    description?: string;
    schema?: {
      type?: string;
      enum?: Array<string>;
    };
  }>;
  responseExample?: string;
}

export function groupEndpointsByPath(
  endpoints: Array<EndpointData>,
): Array<NavigationGroup> {
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
}

export function generateIdFromTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}

export function generateIdFromPath(path: string): string {
  const pathParts = path.split('/').filter(Boolean);
  return pathParts.length > 0 ? pathParts[pathParts.length - 1] : path;
}
