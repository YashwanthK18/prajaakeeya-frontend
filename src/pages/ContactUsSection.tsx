import React from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    TextField,
    Button,
    IconButton,
    Divider
} from '@mui/material';
import {
    Place as PlaceIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import prajakeeyaLogo from '../assets/images/prajakeeya.webp';

const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 }
};

const ContactPage: React.FC = () => {
    const theme = useTheme();
    const accent = theme.palette.primary.main;
    const { t } = useTranslation();

    return (
        <>
            {/* ================= CONTACT SECTION ================= */}
            <Box
                component="section"
                sx={{
                    width: '100vw',
                    position: 'relative',
                    left: '50%',
                    right: '50%',
                    ml: '-50vw',
                    mr: '-50vw',
                    pb: { xs: 6, md: 10 },
                    overflowX: 'hidden'
                }}
            >
                {/* overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,

                    }}
                />

                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        maxWidth: 1200,
                        mx: 'auto',
                        // px: { xs: 2, md: 4 },
                        pt: { xs: 3, md: 5 }
                    }}
                >
                    {/* Header */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {t('pages.landing.contact.title')}
                        </Typography>
                        <Box sx={{ width: 56, height: 6, bgcolor: accent, mt: 1, borderRadius: 1 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 720 }}>
                            {t('pages.landing.contact.subtitle')}
                        </Typography>
                    </Box>

                    {/* Content */}
                    <Grid container spacing={3} alignItems="stretch">
                        {/* Left info */}
                        <Grid item xs={12} md={5}>
                            <Card sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.94)', height: '70%' }} elevation={0}>
                                <CardContent>
                                    <Stack spacing={3}>
                                        <InfoRow icon={<PlaceIcon />} title={t('pages.landing.contact.address')} value={t('pages.landing.contact.addressValue')} accent={accent} />
                                        <InfoRow icon={<PhoneIcon />} title={t('pages.landing.contact.phone')} value={t('pages.landing.contact.phoneValue')} accent={accent} />
                                        <InfoRow icon={<EmailIcon />} title={t('pages.landing.contact.email')} value={t('pages.landing.contact.emailValue')} accent={accent} />
                                        <InfoRow icon={<TimeIcon />} title={t('pages.landing.contact.workingHours')} value={t('pages.landing.contact.workingHoursValue')} accent={accent} />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right image box (replaces form) */}
                        <Grid item xs={12} md={7}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%' }}>
                                <Box
                                    component="img"
                                    alt="Prajakeeya"
                                    sx={{
                                        height: '100%',
                                        width: 'auto',
                                        maxWidth: '100%',
                                        borderRadius: 3,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* ================= FOOTER ================= */}
            <Box
                component="footer"
                sx={{
                    width: '100vw',
                    position: 'relative',
                    left: '50%',
                    right: '50%',
                    ml: '-50vw',
                    mr: '-50vw',
                    bgcolor: '#0f1724',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 3, md: 6 }, py: 3 }}>
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        transition={{ duration: 0.6 }}
                    >
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={7}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Box component="img" src={prajakeeyaLogo} alt="logo" sx={{ height: 48 }} />
                                    <Box>
                                        <Typography sx={{ color: '#fff', fontWeight: 700 }}>
                                            Prajaakeeya
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 380 }}>
                                            {t('pages.landing.contact.footer.tagline')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </motion.div>

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>
                            {t('pages.landing.contact.footer.copyright')}
                        </Typography>
                        <Button
                            variant="text"
                            size="small"
                            href="https://en.wikipedia.org/wiki/Uttama_Prajaakeeya_Party"
                            target="_blank"
                            sx={{ color: accent }}
                        >
                            {t('pages.landing.contact.footer.readMore')}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};

/* ===== helper ===== */
const InfoRow = ({ icon, title, value, accent }: any) => (
    <Stack direction="row" spacing={2}>
        <IconButton sx={{ color: accent }}>{icon}</IconButton>
        <Box>
            <Typography fontWeight={700}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">
                {value}
            </Typography>
        </Box>
    </Stack>
);

export default ContactPage;
