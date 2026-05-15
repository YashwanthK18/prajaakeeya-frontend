import {
  Card,
  CardContent,
  Button,
  Typography,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Avatar,
  IconButton
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  DownloadRounded as DownloadRoundedIcon,
  IosShare as IosShareIcon,
  AddAPhoto as AddAPhotoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import prajakeeyaLogo from '../assets/images/prajakeeya.png';
import chatImg from '../assets/images/chat.png';
import alertImg from '../assets/images/alert.png';
import employeesImg from '../assets/images/employees.png';
import videoCameraImg from '../assets/images/video.png';
import userImg from '../assets/images/user.png';
import king1Img from '../assets/images/king1.png';
import sopImg from '../assets/images/sop.png';
import meetImg from '../assets/images/meet.png';
import leaderImg from '../assets/images/leader.png';
import managerImg from '../assets/images/manager.png';
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import { BRAND } from '../theme';
import apiClient from '../services/apiClient';
import { fetchAllWards } from '../services/wardService';

const UserDashboardPage = () => {
  const { user, token } = useAuthStore();

  // helper: normalize scheduledAt values (supports numeric strings, ISO strings, and numbers)
  const parseScheduledAt = (val: any): number | null => {
    if (val == null) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      if (/^\d+$/.test(val)) return parseInt(val, 10);
      const ts = Date.parse(val);
      return isNaN(ts) ? null : ts;
    }
    return null;
  };


  const { t, i18n } = useTranslation();
  const isKannada = (i18n.language || '').startsWith('kn');
  const actionTitleFontSize = isKannada ? { xs: '0.9rem', md: '1rem' } : { xs: '1rem', md: '1.125rem' };
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open photo frame dialog if navigated with state
  React.useEffect(() => {
    if ((location.state as any)?.openPhotoFrame) {
      setPhotoFrameOpen(true);
      // Clear state so it doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const isAspirant = user?.role === 'aspirant' && (user as any)?.documentStatus === 'completed';

  // Resolve ward name from API when user.wardName is missing
  const [resolvedWardName, setResolvedWardName] = React.useState<string>('');
  React.useEffect(() => {
    if (user?.wardName) { setResolvedWardName(user.wardName); return; }
    if (!user?.wardNumber) return;
    fetchAllWards()
      .then((resp) => {
        const wards: any[] = Array.isArray(resp.data) ? resp.data : [];
        const match = wards.find((w) => String(w.number) === String(user.wardNumber));
        if (match?.name) setResolvedWardName(match.name);
      })
      .catch(() => { /* ignore — ward name stays empty */ });
  }, [user?.wardNumber, user?.wardName]);

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const [photoFrameOpen, setPhotoFrameOpen] = React.useState(false);
  const [selectedFrameIndex] = React.useState(0);
  const [photoFrameBusy, setPhotoFrameBusy] = React.useState(false);
  const [framePhoto, setFramePhoto] = React.useState<string | null>(null);
  const frameFileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoFrameToast, setPhotoFrameToast] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [pendingAlertDismissed, setPendingAlertDismissed] = React.useState(false);
  const displayUser = user || {
    name: 'Voter User',
    relativeName: 'Ramesh Kumar',
    epicId: 'ABC1234567',
    wardName: 'Ward 101 - Central',
    constituency: 'Greater Bengaluru Authority',
    corporationName: '',
    psName: ''
  };

  const actions = [
    {
      title: t('userDashboard.actions.voters') || 'View Voters',
      description: t('userDashboard.actions.votersDesc') || 'See all registered voters',
      icon: <img src={king1Img} alt="voters" width={30} height={30} />,
      path: `/user/voters`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    },
    {
      title: t('userDashboard.actions.registeredAspirants') || 'Registered Aspirants',
      description: t('userDashboard.actions.registeredAspirantsDesc') || 'See all registered aspirants',
      icon: <img src={employeesImg} alt="aspirants" width={30} height={30} />,
      path: `/user/registered-aspirants`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    },
    {
      title: t('userDashboard.actions.civicIssues') || 'Public Issues',
      description: t('userDashboard.actions.civicIssuesDesc') || 'Report and track issues in your ward',
      icon: <img src={alertImg} alt="civic issues" width={30} height={30} />,
      path: '/user/civic-issues',
      variant: 'outlined' as const,
      color: 'secondary' as const
    },
    // Lok Sabha and State Assembly tiles are always shown. If the user hasn't
    // saved a constituency for the type yet, clicking lands them on the
    // /user/aspirantslist "Update Profile" empty state.
    {
      title: t('userDashboard.actions.myLokSabhaAspirants') || 'My Lok Sabha Aspirants',
      description: t('userDashboard.actions.myLokSabhaAspirantsDesc') || 'Aspirants in your Lok Sabha constituency',
      icon: <img src={leaderImg} alt="lok sabha aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=lok_sabha`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    },
    {
      title: t('userDashboard.actions.myStateAssemblyAspirants') || 'My State Assembly Aspirants',
      description: t('userDashboard.actions.myStateAssemblyAspirantsDesc') || 'Aspirants in your Assembly constituency',
      icon: <img src={managerImg} alt="state assembly aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=state_assembly`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    },
    // Municipal Corporation and Gram Panchayat tiles only render when the
    // user has actually saved a constituency for that type. Since each user
    // belongs to exactly one of these two (urban vs rural), hiding the
    // irrelevant one keeps the dashboard clean.
    ...((user as any)?.municipalCorporationConstituency?.id != null ? [{
      title: t('userDashboard.actions.myMunicipalCorporationAspirants') || 'My Municipal Corporation Aspirants',
      description: t('userDashboard.actions.myMunicipalCorporationAspirantsDesc') || 'Aspirants in your corporation ward',
      icon: <img src={employeesImg} alt="municipal corporation aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=municipal_corporation`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    }] : []),
    ...((user as any)?.gramPanchayatConstituency != null ? [{
      title: t('userDashboard.actions.myGramPanchayatAspirants') || 'My Gram Panchayat Aspirants',
      description: t('userDashboard.actions.myGramPanchayatAspirantsDesc') || 'Aspirants in your Gram Panchayat',
      icon: <img src={meetImg} alt="gram panchayat aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=gram_panchayat`,
      variant: 'outlined' as const,
      color: 'secondary' as const
    }] : []),
    {
      title: t('userDashboard.actions.registerAspirant') || 'Register as Aspirant',
      description: t('userDashboard.actions.registerAspirantDesc') || 'Apply to become an aspirant in your ward',
      icon: <img src={managerImg} alt="register aspirant" width={30} height={30} />,
      path: '/user/aspirants/register',
      variant: 'contained' as const,
      color: 'primary' as const,
    },
    {
      title: t('userDashboard.actions.howUPPWorks') || 'How Prajakeeya Works',
      description: t('userDashboard.actions.howWorksTitle') || 'Learn the Prajakeeya SOP and how the system works.',
      icon: <img src={sopImg} alt="sop" width={30} height={30} />,
      path: '/user/sop',
      variant: 'outlined' as const,
      color: 'primary' as const
    }
  ];

  const aspirantActions = [
    {
      title: t('userDashboard.actions.myProfile') || 'My Profile',
      icon: <img src={userImg} alt="my profile" width={30} height={30} />,
      path: '/user/dashboard/profile',
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.civicIssues') || 'Public Issues',
      icon: <img src={alertImg} alt="civic issues" width={30} height={30} />,
      path: '/user/civic-issues',
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.howUPPWorks') || 'How Prajakeeya Works',
      icon: <img src={sopImg} alt="sop" width={30} height={30} />,
      path: '/user/sop',
      variant: 'outlined' as const,
      color: 'primary' as const,
    },
    {
      title: t('userDashboard.actions.meetCitizens') || 'Meet Citizens',
      icon: <img src={meetImg} alt="meet citizens" width={30} height={30} />,
      path: '/user/dashboard/posts',
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.videoMeetings') || 'Video Meetings',
      icon: <img src={videoCameraImg} alt="video meetings" width={120} height={120} />,
      path: '/user/dashboard/meetings',
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.chatWithCitizens') || 'Chat with Citizens',
      icon: <img src={chatImg} alt="chat with citizens" width={30} height={30} />,
      path: `/user/chat/${user?.aspirantId || ''}`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    // Lok Sabha and State Assembly tiles are always shown. The aspirants list
    // page nudges them to /user/complete-profile if the constituency isn't set.
    {
      title: t('userDashboard.actions.myLokSabhaAspirants') || 'My Lok Sabha Aspirants',
      icon: <img src={leaderImg} alt="lok sabha aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=lok_sabha`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.myStateAssemblyAspirants') || 'My State Assembly Aspirants',
      icon: <img src={managerImg} alt="state assembly aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=state_assembly`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    // Municipal Corporation / Gram Panchayat only render when the aspirant has
    // saved one — a person belongs to exactly one local body, never both.
    ...((user as any)?.municipalCorporationConstituency?.id != null ? [{
      title: t('userDashboard.actions.myMunicipalCorporationAspirants') || 'My Municipal Corporation Aspirants',
      icon: <img src={employeesImg} alt="municipal corporation aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=municipal_corporation`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    }] : []),
    ...((user as any)?.gramPanchayatConstituency != null ? [{
      title: t('userDashboard.actions.myGramPanchayatAspirants') || 'My Gram Panchayat Aspirants',
      icon: <img src={meetImg} alt="gram panchayat aspirants" width={30} height={30} />,
      path: `/user/aspirantslist?type=gram_panchayat`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    }] : []),
    {
      title: t('userDashboard.actions.voters') || 'View Voters',
      icon: <img src={king1Img} alt="voters" width={30} height={30} />,
      path: `/user/voters`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
    {
      title: t('userDashboard.actions.registeredAspirants') || 'Registered Aspirants',
      icon: <img src={employeesImg} alt="registered aspirants" width={30} height={30} />,
      path: `/user/registered-aspirants`,
      variant: 'outlined' as const,
      color: 'secondary' as const,
    },
  ];

  const displayActions = isAspirant ? aspirantActions : actions;

  const handleActionClick = async (action: any) => {
    const disabledForThis = (isAspirantRegistrationComplete && action.path === '/user/aspirants/register') || (action as any).disabled;
    if (disabledForThis) return;

    try {
      if (action.path === '/user/aspirants/register' && shouldShowContinue) {
        navigate(action.path, { state: { resume: true } });
        return;
      }

      navigate(action.path);
    } catch (err) {
      console.warn('[handleActionClick] error', err);
      navigate(action.path);
    }
  };

  const DRAFT_KEY = `aspirant_registration_draft_${user?.id ?? 'guest'}`;
  const [hasLocalDraft, setHasLocalDraft] = React.useState(false);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setHasLocalDraft(true);
    } catch (e) {
      // ignore
    }
  }, [DRAFT_KEY]);

  const hasIncompleteAspirant = Boolean(user?.role === 'aspirant' && (user as any)?.documentStatus !== 'completed');
  const shouldShowContinue = hasLocalDraft || hasIncompleteAspirant;

  // Aspirant registration is complete when role=aspirant and documentStatus=completed
  const isAspirantRegistrationComplete = isAspirant;

  const FF = "'Baloo 2', sans-serif";
  const isDark = theme.palette.mode === 'dark';

  // ── Theme-aware colour helpers ──────────────────────────────────────────
  const DARK = theme.palette.background.paper;
  const GOLD = isDark ? BRAND.yellow : BRAND.yellowLight;
  const GOLDD = 'rgba(245,168,0,0.45)';
  const BORDER = isDark ? 'rgba(245,168,0,0.20)' : 'rgba(245,168,0,0.35)';

  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const textHigh = isDark ? 'rgba(255,255,255,0.66)' : 'rgba(17,24,39,0.72)';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.10)';
  const borderFaint = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(17,24,39,0.08)';

  const heroBg = isDark
    ? 'radial-gradient(130% 150% at 6% 0%, rgba(200,24,10,0.2) 0%, rgba(10,8,8,1) 55%), radial-gradient(120% 130% at 100% 0%, rgba(37,58,154,0.16) 0%, rgba(10,8,8,1) 55%)'
    : 'linear-gradient(135deg, rgba(200,24,10,0.07) 0%, rgba(245,168,0,0.07) 50%, rgba(37,58,154,0.05) 100%)';
  const gridOverlay = isDark
    ? 'linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)'
    : 'linear-gradient(rgba(17,24,39,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(17,24,39,.02) 1px,transparent 1px)';

  const dialogPaperSx = {
    bgcolor: DARK,
    color: textPrimary,
    borderRadius: 3,
    border: `1px solid ${borderSubtle}`,
    boxShadow: isDark ? '0 18px 44px rgba(0,0,0,0.55)' : '0 18px 44px rgba(0,0,0,0.12)',
  };

  const photoFrameOptions = React.useMemo(
    () => [
      {
        key: 'responsible-voter',
        badge: t('userDashboard.frame.brandName', { defaultValue: 'Prajaakeeya' }),
        title: t('userDashboard.frame.responsibleVoter', { defaultValue: 'I am a responsible voter' }),
        subtitle: '',
        accent: '#F5A800',
        accentSoft: 'rgba(245,168,0,0.18)',
        gradient: isDark
          ? 'linear-gradient(145deg, rgba(34,24,8,0.98) 0%, rgba(18,12,8,0.96) 40%, rgba(35,18,8,0.94) 100%)'
          : 'linear-gradient(145deg, #fffaf0 0%, #fff6e0 46%, #fffdf4 100%)',
      },
    ],
    [isDark, t]
  );

  const selectedPhotoFrame = photoFrameOptions[selectedFrameIndex] ?? photoFrameOptions[0];
  const userDisplayName = (user?.name || 'Citizen').trim();
  const userInitials = React.useMemo(() => {
    const tokens = userDisplayName.split(/\s+/).filter(Boolean);
    return (tokens.slice(0, 2).map((token) => token.charAt(0)).join('') || 'U').toUpperCase();
  }, [userDisplayName]);

  React.useEffect(() => {
    if (!user) return;
    try {
      if (window.sessionStorage.getItem('dashboard_photo_frame_prompt') === '1') {
        setPhotoFrameOpen(true);
        window.sessionStorage.removeItem('dashboard_photo_frame_prompt');
      }
    } catch (e) {
      console.warn('Unable to read dashboard photo frame prompt state', e);
    }
  }, [user]);

  const showPhotoFrameToast = React.useCallback((message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setPhotoFrameToast({ open: true, message, severity });
  }, []);


  const generatePhotoFrameBlob = React.useCallback(async () => {
    if (typeof document === 'undefined') throw new Error('Document not available');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to generate poster');
    }

    const frame = selectedPhotoFrame;
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    const loadCanvasSafeImage = async (src: string) => {
      if (!src) return null;
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        return { image: await loadImage(src), cleanup: () => { } };
      }

      const isAbsoluteUrl = /^https?:\/\//i.test(src);

      const blobToDataUrl = (b: Blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Unable to read profile image'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
        reader.readAsDataURL(b);
      });

      // For absolute URLs (e.g. S3): use mode:'cors' so the browser sends the
      // Origin header, which causes S3 to return Access-Control-Allow-Origin.
      // Without mode:'cors' the Origin header is omitted and S3 won't include
      // CORS response headers, blocking canvas readback despite the bucket policy.
      if (isAbsoluteUrl) {
        try {
          const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          if (!blob || blob.size === 0) throw new Error('Empty blob from S3');
          const dataUrl = await blobToDataUrl(blob);
          return { image: await loadImage(dataUrl), cleanup: () => { } };
        } catch (s3Err) {
          // Fallback: load via <img crossOrigin="anonymous"> — works when S3
          // CORS headers are present and the image is publicly accessible.
          console.warn('S3 cors fetch failed, trying crossOrigin img load', s3Err);
          try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('crossOrigin image load failed'));
              // Cache-bust to avoid the browser reusing a cached non-CORS response
              img.src = src + (src.includes('?') ? '&' : '?') + '_cb=' + Date.now();
            });
            return { image, cleanup: () => { } };
          } catch (corsErr) {
            console.warn('crossOrigin image load failed', corsErr);
            return null; // triggers initials fallback
          }
        }
      }

      // Relative API path — use apiClient with baseURL
      let blob: Blob | null = null;
      try {
        const apiResp = await apiClient.get(src, { responseType: 'blob' });
        blob = apiResp.data as Blob;
      } catch (apiErr) {
        const resp = await fetch(src, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        blob = await resp.blob();
      }
      if (!blob || blob.size === 0) throw new Error('Empty profile image');
      const dataUrl = await blobToDataUrl(blob);
      return { image: await loadImage(dataUrl), cleanup: () => { } };
    };

    // ── Background ──
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, '#fff9e8');
    bg.addColorStop(0.55, '#fff5dc');
    bg.addColorStop(1, '#fffdfa');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── Tricolor top bar ──
    const barH = 18;
    ctx.fillStyle = '#C8180A';
    ctx.fillRect(0, 0, canvas.width * 0.36, barH);
    ctx.fillStyle = '#253A9A';
    ctx.fillRect(canvas.width * 0.36, 0, canvas.width * 0.28, barH);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(canvas.width * 0.64, 0, canvas.width * 0.36, barH);

    // ── Header: Logo + "Prajaakeeya" then Name below ──
    const headerY = 60;
    // Draw logo
    try {
      const logoImg = await loadImage(prajakeeyaLogo);
      ctx.drawImage(logoImg, 60, headerY - 16, 56, 56);
    } catch { /* skip logo if load fails */ }

    // Prajaakeeya text with gradient
    ctx.font = '900 48px Arial';
    const prajaGrad = ctx.createLinearGradient(130, headerY, 450, headerY);
    prajaGrad.addColorStop(0, '#C8180A');
    prajaGrad.addColorStop(1, '#F5A800');
    ctx.fillStyle = prajaGrad;
    ctx.fillText(t('userDashboard.frame.brandName', { defaultValue: 'Prajaakeeya' }), 130, headerY + 26);

    // Name below logo
    ctx.font = '700 32px Arial';
    ctx.fillStyle = '#475569';
    ctx.fillText(userDisplayName, 130, headerY + 68);

    // ── Photo (circular) ──
    const photoSize = 480;
    const photoX = (canvas.width - photoSize) / 2;
    const photoY = 170;
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    let photoDrawn = false;
    const photoSrc = framePhoto || user?.profilePicture;
    if (photoSrc) {
      let cleanupImageUrl = () => { };
      try {
        const loaded = await loadCanvasSafeImage(photoSrc);
        if (!loaded) throw new Error('Photo missing');
        const { image, cleanup } = loaded;
        cleanupImageUrl = cleanup;
        const imageWidth = image.naturalWidth || image.width;
        const imageHeight = image.naturalHeight || image.height;
        if (!imageWidth || !imageHeight) throw new Error('Invalid image dimensions');
        const scale = Math.max(photoSize / imageWidth, photoSize / imageHeight);
        const drawW = imageWidth * scale;
        const drawH = imageHeight * scale;
        const dx = photoX - (drawW - photoSize) / 2;
        const dy = photoY - (drawH - photoSize) / 2;
        ctx.drawImage(image, dx, dy, drawW, drawH);
        photoDrawn = true;
      } catch (e) {
        console.warn('Unable to load photo for frame', e);
      } finally {
        cleanupImageUrl();
      }
    }

    if (!photoDrawn) {
      const fallbackBg = ctx.createLinearGradient(photoX, photoY, photoX + photoSize, photoY + photoSize);
      fallbackBg.addColorStop(0, frame.accentSoft);
      fallbackBg.addColorStop(1, '#ffffff');
      ctx.fillStyle = fallbackBg;
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      ctx.fillStyle = frame.accent;
      ctx.font = '800 192px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(userInitials, canvas.width / 2, photoY + photoSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    // Photo border ring
    ctx.strokeStyle = frame.accent;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, photoY + photoSize / 2, photoSize / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();

    // ── Tagline below photo ──
    const taglineY = photoY + photoSize + 100;
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 64px Arial';
    ctx.textAlign = 'center';
    const taglineWords = frame.title.split(' ');
    let tLine = '';
    let tLineY = taglineY;
    const tLineH = 76;
    const tMaxW = canvas.width - 160;
    taglineWords.forEach((word: string, idx: number) => {
      const next = tLine ? `${tLine} ${word}` : word;
      if (ctx.measureText(next).width > tMaxW && tLine) {
        ctx.fillText(tLine, canvas.width / 2, tLineY);
        tLine = word;
        tLineY += tLineH;
      } else {
        tLine = next;
      }
      if (idx === taglineWords.length - 1 && tLine) {
        ctx.fillText(tLine, canvas.width / 2, tLineY);
      }
    });
    ctx.textAlign = 'left';

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to export poster'));
      }, 'image/png');
    });
  }, [selectedPhotoFrame, token, user?.profilePicture, userDisplayName, userInitials, framePhoto]);

  const downloadPhotoFrame = React.useCallback(async () => {
    setPhotoFrameBusy(true);
    try {
      const blob = await generatePhotoFrameBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prajakeeya-${selectedPhotoFrame.key}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showPhotoFrameToast(t('userDashboard.frame.downloaded', { defaultValue: 'Frame downloaded successfully.' }), 'success');
    } catch (e) {
      console.error('Photo frame download failed', e);
      showPhotoFrameToast(t('userDashboard.frame.downloadFailed', { defaultValue: 'Unable to download the frame right now.' }), 'error');
    } finally {
      setPhotoFrameBusy(false);
    }
  }, [generatePhotoFrameBlob, selectedPhotoFrame.key, showPhotoFrameToast, t]);

  const sharePhotoFrame = React.useCallback(async () => {
    setPhotoFrameBusy(true);
    try {
      const blob = await generatePhotoFrameBlob();
      const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const shareText = `${selectedPhotoFrame.subtitle}${shareUrl ? ` ${shareUrl}` : ''}`;

      // Detect if running inside React Native WebView
      const isReactNativeWebView = !!(window as any).ReactNativeWebView;

      if (isReactNativeWebView) {
        // Convert blob to base64 data URI and send to React Native
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SHARE_IMAGE',
          title: selectedPhotoFrame.title,
          text: shareText,
          dataUrl,
        }));
        showPhotoFrameToast(t('userDashboard.frame.shared', { defaultValue: 'Share sheet opened successfully.' }), 'success');
      } else if (navigator.share) {
        const file = new File([blob], `prajakeeya-${selectedPhotoFrame.key}.png`, { type: 'image/png' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: selectedPhotoFrame.title,
            text: shareText,
            url: shareUrl || undefined,
          });
          showPhotoFrameToast(t('userDashboard.frame.shared', { defaultValue: 'Share sheet opened successfully.' }), 'success');
        } else {
          throw new Error('canShare returned false');
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prajakeeya-${selectedPhotoFrame.key}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showPhotoFrameToast(t('userDashboard.frame.shareFallback', { defaultValue: 'Native sharing is not available here, so the image was downloaded instead.' }), 'info');
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        showPhotoFrameToast(t('userDashboard.frame.shareCancelled', { defaultValue: 'Sharing was cancelled.' }), 'info');
      } else {
        console.error('Photo frame share failed', e);
        showPhotoFrameToast(t('userDashboard.frame.shareFailed', { defaultValue: 'Unable to share the frame right now.' }), 'error');
      }
    } finally {
      setPhotoFrameBusy(false);
    }
  }, [generatePhotoFrameBlob, selectedPhotoFrame, showPhotoFrameToast, t]);

  return (
    <Stack spacing={3} sx={{ fontFamily: FF, pb: { xs: 2, md: 4 } }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
        <Box sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          background: heroBg,
          border: `1.5px solid ${isDark ? 'rgba(245,140,0,0.7)' : 'rgba(245,168,0,0.35)'}`,
          boxShadow: isDark
            ? '0 0 28px rgba(245,130,0,0.4), 0 0 60px rgba(200,80,0,0.2), 0 12px 40px rgba(0,0,0,0.6)'
            : '0 0 0 1px rgba(245,168,0,0.08), 0 8px 32px rgba(17,24,39,0.07)',
          position: 'relative',
        }}>
          <Box sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: gridOverlay,
            backgroundSize: '44px 44px',
            pointerEvents: 'none',
          }} />
          <Box sx={{ display: 'flex', height: '4px' }}>
            {[BRAND.red, BRAND.blue, BRAND.brown].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
          </Box>
          <Box sx={{
            px: { xs: 2.2, sm: 3.2, md: 4 },
            py: { xs: 2.4, md: 3.2 },
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            position: 'relative',
            zIndex: 1,
          }}>
            <Box>
              <Typography sx={{ fontFamily: isAspirant ? "'Baloo 2', sans-serif" : FF, fontWeight: isAspirant ? 600 : 800, fontSize: { xs: isAspirant ? '0.8rem' : '1.55rem', md: isAspirant ? '0.8rem' : '2rem' }, lineHeight: 1.3, color: textPrimary }}>
                {isAspirant
                  ? t('userDashboard.aspirantBanner')
                  : (isKannada ? 'ದಿ ರಿಯಲ್ ಪ್ರಜಾಕೀಯ' : 'The Real Prajaakeeya')}
              </Typography>
              {(user?.wardNumber || resolvedWardName) && (
                <Typography sx={{ fontFamily: FF, mt: 1, fontSize: '0.95rem', color: textHigh }}>
                  {user?.wardNumber && <Box component="span" sx={{ fontWeight: 700 }}>{t('userDashboard.details.ward', { defaultValue: 'Ward' })} {user.wardNumber}</Box>}
                  {user?.wardNumber && resolvedWardName && ' — '}
                  {resolvedWardName && <Box component="span">{resolvedWardName}</Box>}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      {user?.role === 'aspirant' && (user as any)?.documentStatus !== 'completed' && !pendingAlertDismissed && (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            '& .MuiAlert-message': { width: '100%', fontFamily: FF },
          }}
          action={isSm ? undefined : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => navigate('/user/aspirants/register', { state: { resume: true } })}
                sx={{ whiteSpace: 'nowrap', fontFamily: FF, fontWeight: 700 }}
              >
                {t('userDashboard.actions.continueAspirantRegistration')}
              </Button>
              <IconButton size="small" color="inherit" onClick={() => setPendingAlertDismissed(true)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        >
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: FF }}>
              {t('userDashboard.actions.pendingAspirantAlert')}
            </Typography>
            {isSm && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/user/aspirants/register', { state: { resume: true } })}
                  sx={{ fontFamily: FF, fontWeight: 700 }}
                >
                  {t('userDashboard.actions.continueAspirantRegistration')}
                </Button>
                <IconButton size="small" color="inherit" onClick={() => setPendingAlertDismissed(true)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}
          </Stack>
        </Alert>
      )}


      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
          width: '100%',
          mx: 'auto',
          px: { xs: 1, sm: 0 },
        }}
      >
        {displayActions.map((action, index) => (
          <Box key={action.path} sx={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.12 + index * 0.05 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Card
                onClick={() => handleActionClick(action)}
                sx={{
                  height: '100%',
                  borderRadius: '18px',
                  background: isDark
                    ? `radial-gradient(ellipse at 60% 0%, rgba(200,80,0,0.12) 0%, rgba(10,6,4,0.98) 55%), radial-gradient(ellipse at 10% 90%, rgba(${index % 2 === 0 ? '200,80,0' : '37,58,154'},0.1) 0%, transparent 60%), #0a0604`
                    : 'linear-gradient(150deg, #fffdf7 0%, #fff8e8 100%)',
                  backgroundImage: isDark
                    ? `radial-gradient(circle, rgba(255,180,60,0.13) 1px, transparent 1px), radial-gradient(circle, rgba(255,120,30,0.06) 1px, transparent 1px), radial-gradient(ellipse at 60% 0%, rgba(200,80,0,0.14) 0%, transparent 55%)`
                    : 'none',
                  backgroundSize: isDark ? '48px 48px, 22px 22px, 100% 100%' : 'auto',
                  backgroundPosition: isDark ? '0 0, 11px 11px, 0 0' : '0 0',
                  border: `1.5px solid ${isDark
                    ? (index % 2 === 0 ? 'rgba(245,140,0,0.65)' : 'rgba(80,110,240,0.55)')
                    : (index % 2 === 0 ? 'rgba(245,168,0,0.4)' : 'rgba(37,58,154,0.35)')}`,
                  boxShadow: isDark
                    ? (index % 2 === 0
                      ? '0 0 18px rgba(245,130,0,0.45), 0 0 42px rgba(200,80,0,0.2), inset 0 0 20px rgba(180,60,0,0.07)'
                      : '0 0 18px rgba(60,90,240,0.45), 0 0 42px rgba(37,58,154,0.22), inset 0 0 20px rgba(37,58,154,0.07)')
                    : '0 4px 20px rgba(245,168,0,0.07)',
                  overflow: 'hidden',
                  cursor: (isAspirantRegistrationComplete && action.path === '/user/aspirants/register') ? 'default' : 'pointer',
                  opacity: (isAspirantRegistrationComplete && action.path === '/user/aspirants/register') ? 0.45 : 1,
                  transition: 'transform 0.28s cubic-bezier(.17,.67,.4,1.3), box-shadow 0.3s ease, border-color 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px) scale(1.018)',
                    boxShadow: isDark
                      ? (index % 2 === 0
                        ? '0 0 30px rgba(245,140,0,0.65), 0 0 70px rgba(200,80,0,0.3), 0 24px 50px rgba(0,0,0,0.6)'
                        : '0 0 30px rgba(80,110,240,0.65), 0 0 70px rgba(37,58,154,0.35), 0 24px 50px rgba(0,0,0,0.6)')
                      : '0 0 24px rgba(245,168,0,0.2), 0 14px 32px rgba(17,24,39,0.1)',
                    borderColor: isDark
                      ? (index % 2 === 0 ? 'rgba(255,160,0,0.9)' : 'rgba(100,140,255,0.8)')
                      : (index % 2 === 0 ? 'rgba(245,168,0,0.7)' : 'rgba(37,58,154,0.6)'),
                  },
                }}>
                {isDark && <Box sx={{
                  height: '3px', background: index % 2 === 0
                    ? 'linear-gradient(90deg, rgba(255,160,0,0) 0%, rgba(255,160,0,0.9) 45%, rgba(255,160,0,0) 100%)'
                    : 'linear-gradient(90deg, rgba(100,140,255,0) 0%, rgba(100,140,255,0.85) 45%, rgba(100,140,255,0) 100%)'
                }} />}
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6, height: '100%' }}>
                  <Box sx={{
                    width: 72, height: 72, borderRadius: '20px',
                    background: isDark
                      ? 'linear-gradient(145deg, #1a0f04 0%, #100a02 100%)'
                      : 'radial-gradient(circle at 30% 30%, rgba(245,168,0,0.22), rgba(245,168,0,0.06))',
                    color: GOLD,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${isDark ? 'rgba(245,168,0,0.35)' : 'rgba(245,168,0,0.4)'}`,
                    boxShadow: isDark
                      ? `0 0 0 5px rgba(245,140,0,0.08), 0 0 18px rgba(245,130,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)`
                      : `0 0 0 5px rgba(245,168,0,0.1), 0 4px 14px rgba(245,168,0,0.18)`,
                    transition: 'box-shadow 0.28s ease, transform 0.28s ease',
                    '& svg': { fontSize: 30 },
                  }}>
                    {action.icon}
                  </Box>
                  <Typography sx={{ fontFamily: FF, fontWeight: 800, color: isDark ? '#fff' : textPrimary, fontSize: actionTitleFontSize, lineHeight: 1.2, textAlign: 'center', letterSpacing: '-0.01em', textShadow: isDark ? '0 0 18px rgba(255,255,255,0.25)' : 'none' }}>
                    {action.title}
                  </Typography>
                  {/* <Button
                    size="small"
                    variant="contained"
                    sx={{
                      fontFamily: FF,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      mt: 0.25,
                      px: 2.5,
                      py: 0.55,
                      borderRadius: '20px',
                      minWidth: { xs: '130px', md: '225px' },
                      color: '#fff',
                      background: 'linear-gradient(135deg, #dd1f11de 0%, #e02110c2 100%)',
                      boxShadow: '0 4px 14px rgba(200,24,10,0.35)',
                      letterSpacing: '0.02em',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e02010 0%, #C8180A 100%)',
                        boxShadow: '0 6px 22px rgba(200,24,10,0.5)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    {t('common.clickHere', { defaultValue: 'Click here' })}
                  </Button> */}
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        ))}
      </Box>

      <Dialog
        open={photoFrameOpen}
        onClose={() => { setPhotoFrameOpen(false); setFramePhoto(null); }}
        fullWidth
        maxWidth="md"
        BackdropProps={{ sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.45)' } }}
        PaperProps={{
          sx: {
            ...dialogPaperSx,
            overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(145deg, rgba(13,16,24,0.98) 0%, rgba(16,10,10,0.98) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(252,247,240,0.98) 100%)',
          }
        }}
      >
        <DialogTitle sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 }, borderBottom: `1px solid ${borderSubtle}` }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(245,168,0,0.14)', border: `1px solid ${BORDER}`, color: GOLD }}>
              <AutoAwesomeIcon />
            </Box>
            <Typography sx={{ fontFamily: FF, fontWeight: 800, color: textPrimary, fontSize: { xs: '1.05rem', md: '1.25rem' }, flex: 1 }}>
              {t('userDashboard.framePrompt.title', { defaultValue: 'Add Frame' })}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          {/* Hidden file input for photo upload */}
          <input
            ref={frameFileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setFramePhoto(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />

          <Box
            sx={{
              position: 'relative',
              borderRadius: 3,
              minHeight: { xs: 380, md: 480 },
              p: { xs: 2, md: 3 },
              overflow: 'hidden',
              border: `1px solid ${borderSubtle}`,
              background: selectedPhotoFrame.gradient,
              boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.85)',
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            {/* Top tricolor bar */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <Box sx={{ bgcolor: BRAND.red }} />
              <Box sx={{ bgcolor: BRAND.blue }} />
              <Box sx={{ bgcolor: BRAND.brown }} />
            </Box>

            <Stack spacing={2} sx={{ position: 'relative' }}>
              {/* Header: Logo + Prajaakeeya, Name below */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box component="img" src={prajakeeyaLogo} alt="logo" sx={{ height: 32 }} />
                  <Typography sx={{
                    fontFamily: FF, fontWeight: 900, fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #C8180A 0%, #F5A800 100%)',
                    backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {t('userDashboard.frame.brandName', { defaultValue: 'Prajaakeeya' })}
                  </Typography>
                </Stack>
                <Typography sx={{ fontFamily: FF, fontWeight: 700, color: textSecondary, fontSize: '0.85rem', mt: 0.5, ml: 0.5 }}>
                  {userDisplayName}
                </Typography>
              </Box>

              {/* Photo — click to upload */}
              <Box
                onClick={() => frameFileInputRef.current?.click()}
                sx={{
                  display: 'flex', justifyContent: 'center', pt: 1, cursor: 'pointer',
                }}
              >
                <Box sx={{ position: 'relative', p: 0.8, borderRadius: '50%', background: `linear-gradient(135deg, ${selectedPhotoFrame.accent} 0%, ${GOLD} 100%)`, boxShadow: `0 0 0 6px ${selectedPhotoFrame.accentSoft}` }}>
                  <Avatar
                    src={framePhoto || user?.profilePicture || undefined}
                    sx={{
                      width: { xs: 160, md: 220 },
                      height: { xs: 160, md: 220 },
                      bgcolor: 'rgba(255,255,255,0.92)',
                      color: selectedPhotoFrame.accent,
                      fontFamily: FF, fontWeight: 800,
                      fontSize: { xs: '3rem', md: '4rem' },
                      border: '4px solid rgba(255,255,255,0.95)',
                    }}
                  >
                    {userInitials}
                  </Avatar>
                  {/* Camera overlay icon */}
                  <Box sx={{
                    position: 'absolute', bottom: 8, right: 8,
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center',
                    border: '2px solid rgba(255,255,255,0.8)',
                  }}>
                    <AddAPhotoIcon sx={{ color: '#fff', fontSize: 18 }} />
                  </Box>
                </Box>
              </Box>

              {/* Upload hint */}
              <Typography sx={{ fontFamily: FF, color: textSecondary, fontSize: '0.8rem', textAlign: 'center' }}>
                {t('userDashboard.framePrompt.tapToUpload', { defaultValue: 'Tap photo to upload from gallery or camera' })}
              </Typography>

              {/* Tagline */}
              <Typography sx={{
                fontFamily: FF, fontWeight: 800, color: textPrimary,
                fontSize: { xs: '1.25rem', md: '1.6rem' }, textAlign: 'center', lineHeight: 1.2,
              }}>
                {selectedPhotoFrame.title}
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.6, md: 2.2 }, borderTop: `1px solid ${borderSubtle}`, gap: 1, flexWrap: 'wrap' }}>
          <Button
            onClick={() => { setPhotoFrameOpen(false); setFramePhoto(null); }}
            variant="outlined"
            sx={{ fontFamily: FF, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
          >
            {t('common.cancel') || 'Later'}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={downloadPhotoFrame}
            disabled={photoFrameBusy}
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            sx={{
              fontFamily: FF,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              borderColor: GOLDD,
              color: textPrimary,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(245,168,0,0.06)' },
            }}
          >
            {t('userDashboard.framePrompt.download', { defaultValue: 'Download' })}
          </Button>
          <Button
            onClick={sharePhotoFrame}
            disabled={photoFrameBusy}
            variant="contained"
            startIcon={<IosShareIcon />}
            sx={{
              fontFamily: FF,
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              color: '#fff',
              background: `linear-gradient(135deg, ${BRAND.red} 0%, ${BRAND.yellow} 100%)`,
              boxShadow: '0 10px 24px rgba(200,24,10,0.22)',
              '&:hover': { background: `linear-gradient(135deg, ${BRAND.red2} 0%, #ffbe1a 100%)` },
            }}
          >
            {t('userDashboard.framePrompt.share', { defaultValue: 'Share Now' })}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={photoFrameToast.open} autoHideDuration={3200} onClose={() => setPhotoFrameToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={photoFrameToast.severity} onClose={() => setPhotoFrameToast((prev) => ({ ...prev, open: false }))} sx={{ fontFamily: FF }}>
          {photoFrameToast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default UserDashboardPage;
