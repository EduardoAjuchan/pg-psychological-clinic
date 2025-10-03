'use client';
import { createTheme } from '@mui/material/styles';
const theme = createTheme({
  cssVariables: true,
  typography: { fontFamily: ['Inter','system-ui','-apple-system','Segoe UI','Roboto','Arial'].join(',') },
  shape: { borderRadius: 12 },
  components: { MuiButton: { defaultProps: { variant: 'contained' } } },
  palette: { mode: 'light', primary: { main: '#1976d2' }, secondary: { main: '#6d4aff' } },
});
export default theme;
