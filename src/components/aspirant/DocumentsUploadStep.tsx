import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid,
  Button,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import apiClient from '../../services/apiClient';
import LivePhotoCaptureStep from './LivePhotoCaptureStep';

const GOLD = '#F5A800';
const GOLDD = 'rgba(245,168,0,0.45)';
const DARK = '#0A0808';
const BORDER = 'rgba(245,168,0,0.18)';
const FF = "'Baloo 2', sans-serif";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

interface UploadedFile {
  name: string;
  size: number;
  uploaded: boolean;
  progress: number;
  error?: boolean;
  errorMessage?: string;
  errorKey?: string;
}

type DocKey = 'resume' | 'epic' | 'epicBack' | 'addressProof' | 'signedAgreement' | 'photo';
type DocumentsState = Record<DocKey | 'codeOfConduct' | 'sopEn' | 'sopKn', UploadedFile | null>;

interface Props {
  documents: DocumentsState;
  setDocuments: React.Dispatch<React.SetStateAction<DocumentsState>>;
  handleFileUpload: (docType: keyof DocumentsState) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
  onCancel?: () => void;
  canProceed?: boolean;
  submitButtonText?: string; // Custom text for the submit button
  // Live photo capture props
  cameraActive?: boolean;
  capturedPhoto?: string | null;
  loading?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  startCamera?: () => void;
  stopCamera?: () => void;
  capturePhoto?: () => void;
  retakePhoto?: () => void;
  handleConfirmSelfie?: () => void;
  onSelfieCaptured?: (file: File) => void;
  clearPhoto?: () => void;
  aspirantId?: number | null;
  onAspirantUpdated?: (data: any) => void;
}

const DOC_CONFIG: Array<{
  key: DocKey;
  titleKey: string;
  formatKey: string;
  buttonKey: string;
  accept: string;
  accent: string;
}> = [
    // Resume removed — not required
    // EPIC / Voter ID (Front & Back) removed
    // Recent Photo upload removed
  ];

const DocumentsUploadStep = ({
  documents,
  setDocuments,
  handleFileUpload,
  onBack,
  onNext,
  onCancel,
  canProceed,
  submitButtonText,
  cameraActive,
  capturedPhoto,
  loading,
  videoRef,
  canvasRef,
  startCamera,
  stopCamera,
  capturePhoto,
  retakePhoto,
  handleConfirmSelfie,

  onSelfieCaptured,
  clearPhoto,
  aspirantId,
  onAspirantUpdated,
}: Props) => {
  const { t } = useTranslation();
  // Placeholder SOP download URLs — replace with actual hosted files
  const SOP_EN_URL = '/documents/SOP-English.pdf';
  const SOP_KN_URL = '/documents/SOP-Kannada.pdf';
  const theme = useTheme();

  const [sopEnUrl, setSopEnUrl] = useState<string>(SOP_EN_URL);
  const [sopKnUrl, setSopKnUrl] = useState<string>(SOP_KN_URL);
  const [downloading, setDownloading] = useState(false);

  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const downloadPdf = async (url: string, filename: string) => {
    setDownloading(true);

    // iOS Safari ignores the download attribute entirely — open in new tab
    // so the user can use the Share sheet to save the file
    if (isIOS()) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloading(false);
      return;
    }

    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoke so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch {
      // Fallback (e.g. CORS-blocked cross-origin URL): open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/media/admin/documents');
        const docs = Array.isArray(res.data) ? res.data : (res.data?.documents || []);
        if (!mounted) return;
        const sop = docs.find((d: any) => d.documentType === 'sop');
        const sopKn = docs.find((d: any) => d.documentType === 'sop_kannada');
        if (sop && sop.documentUrl) setSopEnUrl(sop.documentUrl);
        if (sopKn && sopKn.documentUrl) setSopKnUrl(sopKn.documentUrl);
      } catch (e) {
        // ignore — keep defaults
      }
    })();
    return () => { mounted = false; };
  }, []);
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? DARK : 'linear-gradient(180deg,#fffdfa 0%,#f9f4ec 100%)';
  const cardBorder = isDark ? BORDER : 'rgba(245,168,0,0.24)';
  const textPrimary = isDark ? '#fff' : 'rgba(15,23,42,0.94)';
  const textSecondary = isDark ? 'rgba(255,255,255,0.56)' : 'rgba(15,23,42,0.62)';
  const surface1 = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.04)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.14)';

  return (
    <Box sx={{
      bgcolor: DARK,
      borderRadius: 2,
      overflow: 'hidden',
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(17,24,39,0.08)',
    }}>
      {/* Live Photo Capture Section */}
      {cameraActive !== undefined &&
        capturedPhoto !== undefined &&
        loading !== undefined &&
        videoRef &&
        canvasRef &&
        stopCamera &&
        capturePhoto &&
        retakePhoto &&
        handleConfirmSelfie && (
          <Box sx={{ mt: 3 }}>
            <motion.div variants={itemVariants}>
              <LivePhotoCaptureStep
                cameraActive={cameraActive!}
                capturedPhoto={capturedPhoto!}
                loading={loading!}
                videoRef={videoRef!}
                canvasRef={canvasRef!}
                startCamera={startCamera}
                stopCamera={stopCamera!}
                capturePhoto={capturePhoto!}
                retakePhoto={retakePhoto!}
                handleConfirmSelfie={handleConfirmSelfie!}

                onBack={() => { }} // Not needed for inline use
                onSelfieCaptured={onSelfieCaptured}
                clearPhoto={clearPhoto}
                aspirantId={aspirantId ?? undefined}
                alreadyUploaded={!!documents.photo?.uploaded}
                onUploadSuccess={(result) => {
                  // Mark photo as uploaded so the parent can proceed
                  setDocuments(prev => ({ ...prev, photo: { name: 'selfie.png', size: 0, uploaded: true, progress: 100 } }));
                  // Notify parent page so it can refresh aspirant/profile state
                  try { onAspirantUpdated?.(result); } catch (e) { /* ignore */ }
                }}
                onUploadError={(err) => {
                  // Optional: mark photo as errored in documents state
                  setDocuments(prev => ({ ...prev, photo: { name: 'selfie.png', size: 0, uploaded: false, progress: 0, error: true, errorKey: 'forms.aspirant.messages.profilePictureUploadFailed' } }));
                  try { onAspirantUpdated?.(null); } catch (e) { /* ignore */ }
                }}
              />
            </motion.div>
          </Box>
        )}

      <Box sx={{ display: 'flex', height: '5px' }}>
        {['#C8180A', '#253A9A', '#6B3A00'].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
      </Box>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
        <Box sx={{
          px: { xs: 2.5, sm: 4 },
          pt: 3.25,
          pb: 2.2,
          borderBottom: `1px solid ${cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{
            width: 52,
            minWidth: 52,
            height: 52,
            minHeight: 52,
            borderRadius: '12px',
            background: 'linear-gradient(135deg,rgba(200,24,10,.24),rgba(37,58,154,.22))',
            border: '1.5px solid rgba(245,168,0,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <UploadFileIcon sx={{ color: GOLD, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: FF,
              fontWeight: 800,
              fontSize: { xs: '1.08rem', sm: '1.32rem' },
              color: textPrimary,
            }}>
              {t('forms.aspirant.documents.title')}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ px: { xs: 2, sm: 4 }, py: 2.5 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2.2}>
            {DOC_CONFIG.map((doc) => {
              const current = documents[doc.key];
              return (
                <Grid key={doc.key} item xs={12} md={6}>
                  <motion.div variants={itemVariants}>
                    <Box sx={{
                      borderRadius: '11px',
                      background: surface1,
                      border: `1px solid ${surfaceBorder}`,
                      overflow: 'hidden',
                      transition: 'all .25s ease',
                      '&:hover': { borderColor: 'rgba(245,168,0,.35)', transform: 'translateY(-1px)' },
                    }}>
                      <Box sx={{ height: '3px', bgcolor: doc.accent }} />
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UploadFileIcon sx={{ color: doc.accent }} />
                          <Typography sx={{ fontFamily: FF, fontWeight: 700, color: textPrimary, fontSize: '0.9rem' }}>
                            {t(doc.titleKey)}
                          </Typography>
                          {current?.uploaded && <CheckCircleIcon sx={{ ml: 'auto', color: '#2fbf71' }} />}
                          {current?.error && <ErrorIcon sx={{ ml: 'auto', color: '#ff6d6d' }} />}
                        </Box>

                        <Typography sx={{ mt: 0.8, fontFamily: FF, fontSize: '0.78rem', color: textSecondary }}>
                          {t(doc.formatKey)}
                        </Typography>

                        {current?.error && (
                          <Alert severity="error" sx={{ mt: 1.2, py: 0.3, bgcolor: isDark ? 'rgba(255,65,65,0.08)' : 'rgba(255,65,65,0.12)', color: isDark ? '#ffd3d3' : '#8b1111' }}>
                            <Typography sx={{ fontFamily: FF, fontSize: '0.76rem' }}>{current.errorKey ? t(current.errorKey, { defaultValue: current.errorKey }) : current.errorMessage}</Typography>
                          </Alert>
                        )}

                        {current && !current.uploaded && !current.error && (
                          <Box sx={{ mt: 1.2 }}>
                            <Typography sx={{ fontFamily: FF, fontSize: '0.76rem', color: isDark ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.72)' }}>
                              {current.name}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={current.progress}
                              sx={{
                                mt: 0.9,
                                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
                                '& .MuiLinearProgress-bar': { bgcolor: doc.accent },
                              }}
                            />
                          </Box>
                        )}

                        {current?.uploaded && (
                          <Chip
                            label={current.name}
                            onDelete={() => setDocuments(prev => ({ ...prev, [doc.key]: null }))}
                            size="small"
                            sx={{
                              mt: 1.2,
                              fontFamily: FF,
                              color: isDark ? '#d8ffe9' : '#0f5132',
                              bgcolor: isDark ? 'rgba(43,180,104,0.2)' : 'rgba(43,180,104,0.22)',
                              border: '1px solid rgba(43,180,104,0.38)',
                            }}
                          />
                        )}

                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          disabled={current?.uploaded}
                          onClick={() => {
                            if (current?.error) {
                              setDocuments(prev => ({ ...prev, [doc.key]: null }));
                            }
                          }}
                          sx={{
                            mt: 1.6,
                            fontFamily: FF,
                            fontWeight: 700,
                            color: isDark ? 'rgba(255,255,255,0.76)' : 'rgba(15,23,42,0.8)',
                            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.2)',
                            '&:hover': { borderColor: GOLDD, color: GOLD, bgcolor: 'rgba(245,168,0,0.06)' },
                            '&.Mui-disabled': { color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.36)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)' },
                          }}
                        >
                          {t(doc.buttonKey)}
                          <input type="file" hidden accept={doc.accept} onChange={handleFileUpload(doc.key)} />
                        </Button>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>




          {/* SOP Download and Upload Section styled like document cards */}
          <Box sx={{ px: { xs: 2, sm: 4 }, py: 2 }}>
            <Grid container spacing={2.2}>
              <Grid item xs={12}>
                <motion.div variants={itemVariants}>
                  <Box sx={{ borderRadius: '11px', background: surface1, border: `1px solid ${surfaceBorder}`, overflow: 'hidden' }}>
                    <Box sx={{ height: '3px', bgcolor: '#C8180A' }} />
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileDownloadIcon sx={{ color: '#C8180A' }} />
                        <Typography sx={{ fontFamily: FF, fontWeight: 700, color: textPrimary, fontSize: '0.95rem' }}>
                            {t('forms.aspirant.documents.downloadSop') || 'Download SOP (English & Kannada)'}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 1.6 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<FileDownloadIcon />}
                          disabled={downloading}
                          onClick={() => downloadPdf(sopEnUrl, 'SOP-English-Kannada.pdf')}
                          size="small"
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, fontSize: '0.78rem', py: 0.6, px: 1.5 }}
                        >
                          {downloading ? 'Downloading...' : (t('userDashboard.framePrompt.download') || 'Download')}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>

              {/* Upload cards for signed SOPs */}
              <Grid item xs={12}>
                <Box sx={{ borderRadius: 2, background: surface1, border: `1px solid ${surfaceBorder}`, p: 2 }}>
                  <Typography sx={{ fontFamily: FF, fontWeight: 800, mb: 1 }}>{t('forms.aspirant.documents.signAndUploadSop') || 'Sign and Upload SOP (English & Kannada)'}</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box>
                        {documents.sopEn?.uploaded && (
                          <Chip label={documents.sopEn.name} size="small" sx={{ mb: 1 }} onDelete={() => setDocuments(prev => ({ ...prev, sopEn: null }))} />
                        )}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {(() => {
                            const sopUploading = !!documents.sopEn && !documents.sopEn.uploaded && !documents.sopEn.error;
                            return (
                          <Button
                            fullWidth
                            component="label"
                            variant="contained"
                            startIcon={sopUploading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CloudUploadIcon />}
                            disabled={documents.sopEn?.uploaded || sopUploading}
                            size="small"
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, fontSize: '0.78rem', py: 0.6, px: 1.5 }}
                          >
                            {sopUploading
                              ? ((t('common.uploading') || 'Uploading…') + (documents.sopEn?.progress ? ` ${documents.sopEn.progress}%` : ''))
                              : (t('forms.aspirant.documents.signAndUpload') || 'Sign and Upload')}
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const ext = file.name.split('.').pop()?.toLowerCase();
                                if (ext !== 'pdf') {
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0, error: true, errorKey: 'forms.aspirant.messages.pdfOnly' } }));
                                  e.target.value = '';
                                  return;
                                }
                                if (file.type && !file.type.includes('pdf')) {
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0, error: true, errorKey: 'forms.aspirant.messages.pdfOnly' } }));
                                  e.target.value = '';
                                  return;
                                }
                                if (file.size > 20 * 1024 * 1024) {
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0, error: true, errorKey: 'forms.aspirant.messages.fileSize10mb' } }));
                                  e.target.value = '';
                                  return;
                                }
                                setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0 } }));
                                if (!aspirantId) {
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0, error: true, errorMessage: 'Missing aspirantId' } }));
                                  return;
                                }
                                try {
                                  const form = new FormData();
                                  form.append('documentType', 'sop');
                                  form.append('file', file, file.name);
                                  const res = await apiClient.post(`/media/aspirant/${aspirantId}/document`, form, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                    onUploadProgress: (ev) => {
                                      const pct = ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
                                      setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: pct } }));
                                    }
                                  });
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: true, progress: 100 } }));
                                  try { onAspirantUpdated?.(res.data); } catch { };
                                } catch (err: any) {
                                  let errorKey = 'forms.aspirant.messages.uploadFailed';
                                  let errorMessage: string | undefined;
                                  if (err?.response?.status === 413) {
                                    errorKey = 'forms.aspirant.messages.fileSize10mb';
                                  } else if (err?.response?.data?.message) {
                                    errorMessage = err.response.data.message;
                                  }
                                  setDocuments(prev => ({ ...prev, sopEn: { name: file.name, size: file.size, uploaded: false, progress: 0, error: true, errorKey, errorMessage } }));
                                } finally {
                                  // reset the file input value so re-selecting the same file after delete triggers onChange
                                  e.target.value = '';
                                }
                              }}
                            />
                          </Button>
                            );
                          })()}
                        </Box>
                        {documents.sopEn?.error && (
                          <Alert severity="error" sx={{ mt: 1.2, py: 0.3, bgcolor: isDark ? 'rgba(255,65,65,0.08)' : 'rgba(255,65,65,0.12)', color: isDark ? '#ffd3d3' : '#8b1111' }}>
                            <Typography sx={{ fontFamily: FF, fontSize: '0.76rem' }}>{documents.sopEn.errorKey ? t(documents.sopEn.errorKey, { defaultValue: documents.sopEn.errorKey }) : documents.sopEn.errorMessage}</Typography>
                          </Alert>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>


        </motion.div>
      </Box>

      <Box sx={{
        px: { xs: 2, sm: 4 },
        py: 2.4,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(17,24,39,0.02)',
        borderTop: `1px solid ${cardBorder}`,
      }}>
        <Stack direction="row" spacing={1.5} justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                sx={{
                  fontFamily: FF,
                  fontWeight: 700,
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.22)',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)',
                  '&:hover': { borderColor: 'rgba(245,168,0,0.45)', color: '#F5A800', bgcolor: 'rgba(245,168,0,0.06)' },
                }}
              >
                {t('common.home')}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              sx={{
                fontFamily: FF,
                fontWeight: 700,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.74)',
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.22)',
                '&:hover': { borderColor: GOLDD, color: GOLD, bgcolor: 'rgba(245,168,0,0.06)' },
              }}
            >
              {t('forms.aspirant.navigation.back')}
            </Button>
          </Stack>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={!canProceed}
            sx={{
              fontFamily: FF,
              fontWeight: 800,
              px: { xs: 2.8, sm: 3.5 },
              background: 'linear-gradient(135deg,#C8180A 0%,#F5A800 100%)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(200,24,10,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg,#e01c0c 0%,#ffb800 100%)',
                boxShadow: '0 6px 24px rgba(200,24,10,0.55)',
              },
              '&.Mui-disabled': {
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.38)',
                boxShadow: 'none'
              },
            }}
          >
            {submitButtonText || t('forms.aspirant.navigation.next')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', height: '3px' }}>
        {['#6B3A00', '#253A9A', '#C8180A'].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
      </Box>
    </Box>
  );
};

export default DocumentsUploadStep;
