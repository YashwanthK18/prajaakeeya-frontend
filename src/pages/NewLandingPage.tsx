import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Box,
    Button,
    Container,
    Grid,
    Stack,
    Toolbar,
    Typography,
    Card,
    CardContent,
    useTheme,
    useMediaQuery
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material';
import prajakeeyaLogo from '../assets/images/prajakeeya.webp';
import aspirantLoginImg from '../assets/images/prajaakeeya_aspirant_login.png';
import voterLoginImg from '../assets/images/prajaakeeya_voter_login.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useThemeStore from '../store/useThemeStore';
import LanguageSelector from '../components/LanguageSelector';

const BeatterCreatePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const theme = useTheme();
    const toggleTheme = useThemeStore((s) => s.toggleTheme);
    const mode = useThemeStore((s) => s.mode);
    const isDark = mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const localeTitles = t('pages.landing.animatedTitles', { returnObjects: true });
    const titles: string[] = Array.isArray(localeTitles) && localeTitles.length
        ? (localeTitles as string[])
        : [];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!titles.length) return undefined;
        const id = setInterval(() => setIndex((i) => (i + 1) % titles.length), 2000);
        return () => clearInterval(id);
    }, [titles.length, i18n.language]);

    // Reset index when language changes so animation starts from the first title
    useEffect(() => {
        setIndex(0);
    }, [i18n.language]);

    const goToLogin = () => {
        // navigate client-side; also support direct full-url if needed
        // window.location.href = 'http://localhost:5173/login';
        navigate('/register');
    };

    return (
        <Box sx={{
            height: isMobile ? 'auto' : '100vh',
            overflow: isMobile ? 'auto' : 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pb: isMobile ? 4 : 0
        }}>
            {/* Fixed header */}
            <Box sx={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                px: { xs: 2, sm: 3 }, py: 1.2,
                bgcolor: isDark ? '#0A0808' : '#FFFFFF',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box component="img" src={prajakeeyaLogo} alt={t('pages.landing.kicker')} sx={{ height: 44 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#cc0000', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {t('pages.landing.kicker')}
                </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        onClick={toggleTheme}
                        sx={{
                            minWidth: 40, width: 40, height: 40, p: 0, borderRadius: 50,
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                            color: isDark ? '#F5A800' : '#111827',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.12)'}`,
                            boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.35)' : '0 2px 10px rgba(17,24,39,0.15)',
                            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.94)' },
                        }}
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        {isDark ? <LightModeRounded fontSize="small" /> : <DarkModeRounded fontSize="small" />}
                    </Button>
                    <LanguageSelector
                        size="small"
                        sx={{
                            px: 2, py: 0.6, fontSize: '0.82rem', fontWeight: 700, borderRadius: 50,
                            bgcolor: '#F5A800', color: '#0A0808', textTransform: 'none',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                            '&:hover': { bgcolor: '#d99000' },
                        }}
                    />
                </Box>
            </Box>
            {/* Spacer for fixed header */}
            <Box sx={{ height: 68 }} />

            <Container maxWidth="lg" sx={{ py: 0, pb: isMobile ? 6 : 0, height: isMobile ? 'auto' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4, mt: { xs: 2, md: 3 } }}>
                    <Typography variant="h2" component="div" sx={{ fontWeight: 800, fontFamily: 'serif', fontSize: { xs: '1.6rem', md: '2.6rem' }, color: '#0f172a', mt: 3 }}>
                        {
                            (() => {
                                const full = titles[index] || t('pages.landing.title');
                                const parts = full.split(' ');
                                if (parts.length <= 1) return full;
                                const mid = Math.floor(parts.length / 2);
                                const before = parts.slice(0, mid).join(' ');
                                const middle = parts[mid];
                                const after = parts.slice(mid + 1).join(' ');
                                return (
                                    <>
                                        {before ? `${before} ` : ''}
                                        <Box component="span" sx={{ color: 'primary.main' }}>{middle}</Box>
                                        {after ? ` ${after}` : ''}
                                    </>
                                );
                            })()
                        }
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1, color: 'text.secondary', fontSize: '1.05rem' }}>
                        {t('pages.landing.animatedSubtitle', { defaultValue: t('pages.landing.subtitle') })}
                    </Typography>
                </Box>

                <Grid container spacing={4} justifyContent="center" sx={{ flexGrow: 1, alignItems: 'center' }}>
                    <Grid item xs={12} sm={6}>
                        <Card sx={{ textAlign: 'center', borderRadius: 3, p: { xs: 1.5, sm: 2 }, boxShadow: '0 10px 30px rgba(2,6,23,0.12)', maxWidth: { xs: '100%', sm: 640 }, mx: 'auto', bgcolor: 'rgba(255,255,255,0.96)' }}>
                            <CardContent>
                                <Stack spacing={2} alignItems="center">
                                    <Box sx={{ width: { xs: 88, sm: 120 }, height: { xs: 88, sm: 120 }, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                                        <Box component="img" src={voterLoginImg} alt="voter" sx={{ width: { xs: 72, sm: 96 }, height: { xs: 72, sm: 96 }, objectFit: 'contain' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('pages.landing.cards.voter.title')}</Typography>
                                    <Box sx={{ height: 6, width: 120, bgcolor: '#374151', borderRadius: 2, mt: 0.5 }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, fontWeight: 600 }}>{t('pages.landing.cards.voter.description')}</Typography>
                                    <Box component="ul" sx={{ textAlign: 'left', px: { xs: 2, sm: 3 }, mt: 1, mb: 1 }}>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#374151', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.voter.bullets.0')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#374151', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.voter.bullets.1')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#374151', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.voter.bullets.2')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <CheckIcon sx={{ color: '#374151', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.voter.bullets.3')}</Typography>
                                        </Box>
                                    </Box>
                                    <Button variant="contained" onClick={goToLogin} sx={{ mt: 1, color: 'white', bgcolor: '#374151', borderRadius: 6, px: 3 }}>{t('pages.landing.cards.voter.cta')}</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Card sx={{ textAlign: 'center', borderRadius: 3, p: { xs: 1.5, sm: 2 }, boxShadow: '0 10px 30px rgba(2,6,23,0.12)', maxWidth: { xs: '100%', sm: 640 }, mx: 'auto', bgcolor: 'rgba(255,255,255,0.96)' }}>
                            <CardContent>
                                <Stack spacing={2} alignItems="center">
                                    <Box sx={{ width: { xs: 88, sm: 120 }, height: { xs: 88, sm: 120 }, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
                                        <Box component="img" src={aspirantLoginImg} alt="aspirant" sx={{ width: { xs: 72, sm: 96 }, height: { xs: 72, sm: 96 }, objectFit: 'contain' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('pages.landing.cards.aspirant.title')}</Typography>
                                    <Box sx={{ height: 6, width: 120, bgcolor: '#F97316', borderRadius: 2, mt: 0.5 }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, fontWeight: 600 }}>{t('pages.landing.cards.aspirant.description')}</Typography>
                                    <Box component="ul" sx={{ textAlign: 'left', px: { xs: 2, sm: 3 }, mt: 1, mb: 1 }}>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#F97316', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.aspirant.bullets.0')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#F97316', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.aspirant.bullets.1')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.8 }}>
                                            <CheckIcon sx={{ color: '#F97316', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.aspirant.bullets.2')}</Typography>
                                        </Box>
                                        <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <CheckIcon sx={{ color: '#F97316', fontSize: 18 }} />
                                            <Typography variant="body2">{t('pages.landing.cards.aspirant.bullets.3')}</Typography>
                                        </Box>
                                    </Box>
                                    <Button variant="contained" onClick={goToLogin} sx={{ mt: 1, color: 'white', bgcolor: '#F97316', borderRadius: 6, px: 3 }}>{t('pages.landing.cards.aspirant.cta')}</Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BeatterCreatePage;
