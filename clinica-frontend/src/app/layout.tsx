import type { Metadata } from 'next';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brisa Mental',
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
