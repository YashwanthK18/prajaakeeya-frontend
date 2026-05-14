import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Chip,
  Container,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import prajakeeyaLogo from '../assets/images/prajakeeya.png';
import { BRAND } from '../theme';
import LanguageSelector from '../components/LanguageSelector';
import NotificationBell from '../components/NotificationBell';
import { fetchAspirant } from '../services/aspirantService';

const FF = "'Baloo 2', sans-serif";

const UserLayout = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = mode === 'dark';
  const isDashboard = location.pathname === '/user/dashboard';
  const isVotersPage = location.pathname === '/user/voters';
  const isCivicIssuesPage = location.pathname === '/user/civic-issues';
  const isSopPage = location.pathname === '/user/sop';
  const isAspirantRegister = location.pathname === '/user/aspirants/register';

  const [aspirantName, setAspirantName] = useState<string | null>(null);
  const [aspirantLoading, setAspirantLoading] = useState(user?.role === 'aspirant');

  useEffect(() => {
    if (user?.role === 'aspirant' && user.aspirantId) {
      setAspirantLoading(true);
      fetchAspirant(user.aspirantId)
        .then(res => setAspirantName(res.data?.name ?? null))
        .catch(() => setAspirantName(null))
        .finally(() => setAspirantLoading(false));
    } else {
      setAspirantLoading(false);
    }
  }, [user?.role, user?.aspirantId]);

  const displayUser = user || { name: 'Voter User', wardId: 101, wardName: '', profilePicture: null } as any;
  const displayName = user?.role === 'aspirant'
    ? (aspirantLoading ? '' : (aspirantName || displayUser.name))
    : displayUser.name;
  // Derive ward number from user profile (already available from /auth/me) — no extra API call needed
  const wardNumber = displayUser.wardNumber || displayUser.wardId || null;

  const handleLogout = () => { logout(); navigate('/'); };

  // Theme-aware colour helpers
  const navBg = isDark
    ? 'radial-gradient(130% 140% at 0% 0%, rgba(200,24,10,0.2) 0%, rgba(10,8,8,1) 55%), radial-gradient(120% 130% at 100% 0%, rgba(37,58,154,0.16) 0%, rgba(10,8,8,1) 55%)'
    : `linear-gradient(135deg, #fff 0%, #FFF8F0 100%)`;

  const subtleText = isDark ? 'rgba(255,255,255,0.52)' : 'rgba(17,24,39,0.45)';

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{
        background: navBg,
        color: isDark ? 'white' : 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&::before': isDark ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)',
          backgroundSize: '44px 44px',
        } : {},
      }}>
        {/* Tri-colour top accent */}
        <Box sx={{ display: 'flex', height: '3px' }}>
          {[BRAND.red, BRAND.blue, BRAND.brown].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
        </Box>

        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
          <Toolbar sx={{ justifyContent: 'space-between', py: { xs: 0.9, sm: 1.2 }, minHeight: { xs: 56, sm: 72 }, px: { xs: 1 } }}>
            {/* Left: back button (mobile, non-dashboard) or logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Mobile back button — shown on all pages except dashboard, voters, civic issues, sop, and aspirant register */}
              {!isDashboard && !isVotersPage && !isCivicIssuesPage && !isSopPage && !isAspirantRegister && (
                <IconButton
                  onClick={() => navigate(-1)}
                  size="small"
                  aria-label="go back"
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    color: isDark ? BRAND.yellow : BRAND.saffron,
                    p: 0.8, borderRadius: 2,
                    background: `linear-gradient(135deg,rgba(200,24,10,.18),rgba(245,168,0,.14))`,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 22 }} />
                </IconButton>
              )}

              {/* Logo — always on desktop, on dashboard/voters/civic-issues/sop on mobile */}
              <Box
                sx={{ display: { xs: (isDashboard || isVotersPage || isCivicIssuesPage || isSopPage || isAspirantRegister) ? 'flex' : 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                onClick={() => navigate('/user/dashboard')}
              >
                <Box sx={{
                  p: 0.8, borderRadius: 2,
                  background: `linear-gradient(135deg,rgba(200,24,10,.18),rgba(245,168,0,.14))`,
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box component="img" src={prajakeeyaLogo} alt={t('userDashboard.title')} sx={{ height: { xs: 28, sm: 34 } }} />
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontFamily: FF, fontWeight: 800, lineHeight: 1.05, color: isDark ? '#fff' : 'text.primary', fontSize: { sm: '1rem', md: '1.08rem' } }}>
                    {t('pages.landing.kicker')}
                  </Typography>
                  <Typography sx={{ fontFamily: FF, fontSize: '0.73rem', letterSpacing: '.06em', textTransform: 'uppercase', color: subtleText }}>
                    {t('menu.dashboard') || 'Dashboard'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: theme toggle + lang switch + avatar + logout(desktop) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
              {/* Dark / Light mode toggle */}
              <IconButton
                onClick={toggleTheme}
                size="small"
                aria-label="toggle theme"
                sx={{
                  width: 36, height: 36,
                  color: isDark ? BRAND.yellow : BRAND.saffron,
                }}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>

              {/* Lang selector */}
              <LanguageSelector
                sx={{
                  minWidth: 64,
                  px: 1,
                  fontFamily: FF,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: isDark ? BRAND.yellow : BRAND.saffron,
                }}
              />

              {/* Notifications bell — opens /user/notifications */}
              <NotificationBell />

              <Box sx={{ width: { xs: 4, sm: 8 } }} />

              {/* User avatar (desktop: full, mobile: compact) */}
              <Box sx={{
                display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.2, cursor: 'pointer',
                p: 0.7, pr: { xs: 0.7, sm: 1.2 }, borderRadius: 3,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : theme.palette.divider}`,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'action.hover',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'action.selected' },
              }} onClick={() => navigate('/user/complete-profile')}>
                <Avatar
                  src={displayUser.profilePicture || undefined}
                  alt={displayName || 'User'}
                  sx={{
                    width: { xs: 34, sm: 38 }, height: { xs: 34, sm: 38 },
                    bgcolor: displayUser.profilePicture ? 'transparent' : 'primary.main',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : theme.palette.divider}`,
                  }}
                >
                  {!displayUser.profilePicture && (displayName?.charAt(0).toUpperCase() || 'U')}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontFamily: FF, fontWeight: 700, lineHeight: 1.2, color: isDark ? '#fff' : 'text.primary' }}>
                    {displayName}
                  </Typography>
                  {(wardNumber || displayUser.wardId) && (
                    <Chip
                      label={`Ward ${wardNumber ?? displayUser.wardId}`}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.64rem', fontWeight: 700, fontFamily: FF,
                        bgcolor: isDark ? 'rgba(245,168,0,0.16)' : 'rgba(245,168,0,0.15)',
                        color: isDark ? '#ffe4aa' : BRAND.brown,
                        border: `1px solid rgba(245,168,0,0.36)`,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Mobile-only profile avatar */}
              <Box
                onClick={() => navigate('/user/complete-profile')}
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <Avatar
                  src={displayUser.profilePicture || undefined}
                  alt={displayName || 'User'}
                  sx={{
                    width: 34, height: 34,
                    bgcolor: displayUser.profilePicture ? 'transparent' : 'primary.main',
                    border: `2px solid ${isDark ? 'rgba(245,168,0,0.55)' : BRAND.yellow}`,
                  }}
                >
                  {!displayUser.profilePicture && (displayName?.charAt(0).toUpperCase() || 'U')}
                </Avatar>
              </Box>

              {/* Logout (desktop) */}
              <Button size="small" startIcon={<LogoutIcon />} onClick={handleLogout}
                sx={{
                  fontFamily: FF, borderRadius: 50,
                  display: { xs: 'none', sm: 'inline-flex' },
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider}`,
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  textTransform: 'none', fontWeight: 700,
                  '&:hover': {
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.45)' : theme.palette.primary.main}`,
                    color: isDark ? '#fff' : 'text.primary',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'action.hover',
                  },
                }}>
                {t('common.logout')}
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default UserLayout;
