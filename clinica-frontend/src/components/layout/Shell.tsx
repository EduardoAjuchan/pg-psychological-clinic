'use client';
import { Box, Toolbar, Container, Paper } from '@mui/material';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const drawerWidth = 240;

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'block' }}>
      <Topbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          ml: { md: `${drawerWidth}px` }, // espacio para el sidebar permanente en desktop
          p: { xs: 2, md: 3 },
        }}
      >
        {/* Offset para la AppBar fija */}
        <Toolbar />
        <Container maxWidth="xl">
          <Paper className="p-4">{children}</Paper>
        </Container>
      </Box>
    </Box>
  );
}
