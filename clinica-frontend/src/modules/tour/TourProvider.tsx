'use client';
import { useEffect, useMemo } from 'react';
import { driver } from 'driver.js';
import { usePathname } from 'next/navigation';
import { useTourStore } from './tour.store';
import { baseSteps } from './steps';

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { seen, setSeen, startRequested, clearStart } = useTourStore();

  const steps = useMemo(() => {
    if (!pathname.startsWith('/dashboard')) {
      return baseSteps.filter(s => (s.element as string) !== '#dashboard-kpis');
    }
    return baseSteps;
  }, [pathname]);

  useEffect(() => {
    const d = driver({
      showProgress: true, animate: true, overlayColor: 'rgba(0,0,0,0.5)',
      allowClose: true, nextBtnText: 'Siguiente', prevBtnText: 'Atrás', doneBtnText: 'Listo',
      onDestroyStarted: () => { setSeen(true); clearStart(); },
    });

    if (!seen) {
      const t = setTimeout(() => { d.setSteps(steps); d.drive(); }, 250);
      return () => clearTimeout(t);
    }
    if (startRequested) {
      const t = setTimeout(() => { d.setSteps(steps); d.drive(); }, 100);
      return () => clearTimeout(t);
    }
  }, [seen, startRequested, clearStart, setSeen, steps]);

  return <>{children}</>;
}
