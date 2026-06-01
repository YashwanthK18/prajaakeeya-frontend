import React from 'react';
import { Box, Button, Stack, Typography, useTheme, keyframes } from '@mui/material';
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useThemeStore from '../store/useThemeStore';
import prajakeeyaLogo from '../assets/images/prajakeeya.webp';
import LanguageSelector from '../components/LanguageSelector';

const amountPulse = keyframes`
  0%, 100% {
    text-shadow: 0 0 10px rgba(255,180,0,0.7), 0 0 20px rgba(255,140,0,0.5), 0 0 40px rgba(255,100,0,0.3);
    background-position: 0% 50%;
  }
  50% {
    text-shadow: 0 0 20px rgba(255,200,0,1), 0 0 40px rgba(255,160,0,0.8), 0 0 60px rgba(255,100,0,0.5), 0 0 80px rgba(255,60,0,0.3);
    background-position: 100% 50%;
  }
`;

const OathPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isKannada = i18n.language === 'kn';
  const strongText = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(17,24,39,0.92)';
  const mutedText = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(17,24,39,0.62)';

  const oathParagraphs = [
    t('pages.login.oath.para0'),
    t('pages.login.oath.para1'),
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at 50% 0%, rgba(200,24,10,0.10) 0%, transparent 60%), #0A0808'
          : 'radial-gradient(ellipse at 50% 0%, rgba(200,24,10,0.06) 0%, transparent 60%), #FFFFFF',
        px: 2,
        pt: 9,
        pb: 4,
      }}
    >
      {/* Theme & Language toggle — top right */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.2,
        bgcolor: isDark ? 'rgba(10,8,8,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <Box component="img" src={prajakeeyaLogo} alt="Prajaakeeya" sx={{ height: 40 }} />
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

      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 560, width: '100%' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box component="img" src={prajakeeyaLogo} alt="Prajaakeeya" sx={{ height: { xs: 64, sm: 80 }, objectFit: 'contain' }} />
          <Typography sx={{ fontFamily: '"Bebas Neue", "Impact", sans-serif', fontSize: { xs: '1.4rem', sm: '1.7rem' }, letterSpacing: '0.08em', lineHeight: 1.4, px: 2, py: 0.5, background: isDark ? 'linear-gradient(135deg, #E02010 0%, #FFCB00 45%, #F5A800 100%)' : 'linear-gradient(135deg, #E02010 0%, #c32d0c 45%, #ff9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('pages.login.oath.title')}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", "Impact", sans-serif',
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              letterSpacing: '0.25em',
              color: isDark ? '#ffffff' : '#000000',
              textShadow: isDark ? '0 0 4px rgba(255,255,255,0.4)' : 'none',
              textTransform: 'uppercase',
            }}
          >
            {t('forms.aspirant.defaults.party')}
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ width: '100%' }}>
          {oathParagraphs.map((text, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                gap: 1.25,
                alignItems: 'flex-start',
                p: '10px 12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(200,24,10,0.18), rgba(245,168,0,0.12))',
                border: '1px solid rgba(245,168,0,0.28)',
              }}
            >
              <Typography
                component="span"
                sx={{ color: '#F5A800', flexShrink: 0, fontSize: '0.9rem', mt: '3px' }}
              >
                ✊
              </Typography>
              <Typography
                sx={{
                  fontSize: isKannada ? '0.88rem' : '0.875rem',
                  color: strongText,
                  lineHeight: 1.75,
                  fontFamily: isKannada ? '"Tiro Kannada", serif' : 'inherit',
                  fontWeight: 600,
                }}
              >
                {idx === 0
                  ? (() => {
                      const amountRegex = /(₹[\d,]+)/;
                      const match = text.match(amountRegex);
                      if (!match) return text;
                      const amount = match[0];
                      const parts = text.split(amount);
                      return (
                        <>
                          {parts[0]}
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 900,
                              fontSize: '1.15em',
                              background: isDark
                                ? 'linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)'
                                : 'linear-gradient(90deg, #E65100, #F57C00, #E65100)',
                              backgroundSize: '200% auto',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              animation: `${amountPulse} 2.5s ease-in-out infinite`,
                              display: 'inline',
                            }}
                          >
                            {amount}
                          </Box>
                          {parts[1]}
                        </>
                      );
                    })()
                  : (() => {
                      const workerPhrase = 'I Want A WORKER ';
                      if (!text.includes(workerPhrase)) return text;
                      const parts = text.split(workerPhrase);
                      return (
                        <>
                          <Box component="span" sx={{
                            fontSize: '1.45em',
                            fontFamily: '"Bebas Neue", sans-serif',
                            ...(isDark ? {
                              color: '#FFD700',
                              textShadow: '0 0 20px rgba(255,215,0,.35)',
                            } : {
                              background: 'linear-gradient(135deg, #E02010 0%, #c32d0c 45%, #ff9500 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }),
                            display: 'inline',
                          }}>
                            {workerPhrase}
                          </Box>
                          {parts[1]}
                        </>
                      );
                    })()}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => navigate('/register', { state: { fromPledge: true } })}
          sx={{
            mt: 2,
            py: 1.4,
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: '12px',
            color: '#fff',
            background: 'linear-gradient(135deg, #C8180A 0%, #F5A800 100%)',
            boxShadow: '0 8px 28px rgba(200,24,10,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #df210f 0%, #ffbe1a 100%)',
              boxShadow: '0 10px 34px rgba(200,24,10,0.5)',
            },
          }}
        >
          {isKannada ? 'ಒಪ್ಪಿಗೆ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ' : 'Agree and Proceed'}
        </Button>

      </Stack>
    </Box>
  );
};

export default OathPage;
