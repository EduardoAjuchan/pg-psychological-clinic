'use client';
import { create } from 'zustand';
type TourState = { seen: boolean; setSeen: (v: boolean) => void; startRequested: boolean; requestStart: () => void; clearStart: () => void; };
export const useTourStore = create<TourState>((set) => ({
  seen: typeof window !== 'undefined' ? !!localStorage.getItem('tour_seen') : false,
  setSeen: (v) => { if (typeof window !== 'undefined') { v ? localStorage.setItem('tour_seen','1') : localStorage.removeItem('tour_seen'); } set({ seen: v }); },
  startRequested: false, requestStart: () => set({ startRequested: true }), clearStart: () => set({ startRequested: false }),
}));
