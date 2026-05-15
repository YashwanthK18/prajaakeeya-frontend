import { useState, useEffect } from 'react';
import { Alert, Collapse } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <Collapse in={isOffline} sx={{ position: 'sticky', top: 0, zIndex: 1300 }}>
      <Alert
        severity="warning"
        icon={<WifiOffIcon />}
        sx={{
          borderRadius: 0,
          fontWeight: 600,
          justifyContent: 'center',
          '& .MuiAlert-icon': { alignItems: 'center' },
          '& .MuiAlert-message': { textAlign: 'center' },
        }}
      >
        You&apos;re offline. Some features may not be available.
      </Alert>
    </Collapse>
  );
};

export default OfflineBanner;
