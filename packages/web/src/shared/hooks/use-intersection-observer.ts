import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver() {
  const [activeId, setActiveId] = useState<string>('introduction');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
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

  return { activeId, mainRef };
}
