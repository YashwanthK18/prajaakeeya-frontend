import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import * as Sentry from '@sentry/react';
import App from './App';
import { getTheme } from './theme';
import useThemeStore from './store/useThemeStore';
import { initSentry } from './config/sentry';
import './i18n';
import './index.css';

// Start error tracking as early as possible so init-time errors are captured.
initSentry();

// Shown if a render error escapes all the way up. Kept deliberately simple and
// MUI-light so it can render even if part of the tree is broken.
const ErrorFallback = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 3,
      textAlign: 'center',
    }}
  >
    <Typography variant="h5">Something went wrong</Typography>
    <Typography color="text.secondary">
      The error has been reported to our team. Please try reloading the page.
    </Typography>
    <Button variant="contained" onClick={() => window.location.reload()}>
      Reload
    </Button>
  </Box>
);

// ── Force reload when a new service worker activates ──
if ('serviceWorker' in navigator) {
  // Only reload on a genuine SW UPDATE (an old controller was already in charge
  // and a new one took over). An openWindow()-launched page loads UNCONTROLLED
  // (controller === null); Workbox's clientsClaim then claims it and fires
  // controllerchange. Reloading on THAT first claim would needlessly throw away
  // a freshly deep-linked page (and previously masked the real PUSH_NAVIGATE
  // delivery bug). Guarding on a pre-existing controller — plus a refreshing
  // flag — keeps the auto-update behaviour without the spurious reload.
  // Snapshot control state NOW, at load. Inside the controllerchange handler
  // navigator.serviceWorker.controller already points at the NEW controller, so
  // it can't tell an initial claim from an update — we must remember whether a
  // controller existed before the event. If this page loaded with no controller
  // (the openWindow() case), the upcoming controllerchange is the initial claim,
  // not an update, so we must NOT reload.
  const hadControllerAtLoad = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadControllerAtLoad) return;
    refreshing = true;
    window.location.reload();
  });

  // Check for SW updates every 60 seconds (catches deploys while tab is open)
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => registration.update(), 60 * 1000);
  });
}

// Wrapper component so the ThemeProvider can react to Zustand store changes
const ThemedApp = () => {
  const mode = useThemeStore((s) => s.mode);
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
