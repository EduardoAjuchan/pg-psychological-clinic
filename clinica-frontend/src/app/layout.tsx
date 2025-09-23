import type { Metadata } from 'next';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '@/lib/theme';
import 'driver.js/dist/driver.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clínica | Frontend',
  description: 'Frontend de la clínica psicológica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
