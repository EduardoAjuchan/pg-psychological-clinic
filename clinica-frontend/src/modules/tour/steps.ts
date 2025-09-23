import type { DriverStep } from 'driver.js';
export const baseSteps: DriverStep[] = [
  { element: '#app-topbar', popover: { title: 'Barra superior', description: 'Acciones globales como cerrar sesión y ayuda.', side: 'bottom', align: 'start' } },
  { element: '#app-sidebar', popover: { title: 'Menú lateral', description: 'Navega entre Inicio, Pacientes y Citas.', side: 'right', align: 'start' } },
  { element: '#dashboard-kpis', popover: { title: 'Dashboard', description: 'Aquí irán tus KPIs.', side: 'top', align: 'center' } },
  { element: '#pacientes-list', popover: { title: 'Pacientes', description: 'Listado y acciones básicas.', side: 'top', align: 'center' } },
  { element: '#citas-grid', popover: { title: 'Citas', description: 'Tarjetas por fecha y hora.', side: 'top', align: 'center' } },
];
