import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  ReportProblem as ReportProblemIcon,
  PanTool as HandRaiseIcon,
  CheckCircle as CheckCircleIcon,
  Security as ShieldIcon,
  Park as ParkIcon,
  Favorite as FavoriteIcon,
  Build as BuildIcon,
  FlashOn as FlashOnIcon,
  Apartment as BuildingIcon,
  AccountBalance as BridgeIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import {
  getIssuesByElectionAndConstituency,
  raiseHandForCategoryByElectionConstituency,
  IssueCategory,
  CivicIssue,
} from '../services/civicIssuesService';
import {
  fetchElections, fetchConstituencies, fetchMunicipalities, fetchConstituenciesByScope,
  fetchGPStates, fetchGPDistricts, fetchGPTaluks, fetchGPGrams, fetchGPVillages,
  type Election, type Constituency, type GPVillage,
} from '../services/electionService';
import { BRAND } from '../theme';
import roadMapImg from '../assets/images/road-map.png';
import architectImg from '../assets/images/architect.png';
import wasteImg from '../assets/images/waste.png';
import waterTapImg from '../assets/images/water-tap.png';
import garbageImg from '../assets/images/garbage.png';
import streetLightImg from '../assets/images/street-light.png';
import savePlanetImg from '../assets/images/save-the-planet.png';

const FF = "'Baloo 2', sans-serif";

const CivicIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t, i18n } = useTranslation();
  const isKannada = (i18n.language || '').startsWith('kn');
  const { user } = useAuthStore();

  // Get filters from location state (passed from WardCandidateListPage)
  const filterElectionId = (location.state as any)?.electionId ?? null;
  const filterElectionName = (location.state as any)?.electionName ?? null;
  const filterConstituencyId = (location.state as any)?.constituencyId ?? null;
  const filterConstituencyName = (location.state as any)?.constituencyName ?? null;

  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Elections and constituencies state
  const [elections, setElections] = useState<Election[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<number | ''>('');
  const [selectedElectionType, setSelectedElectionType] = useState<string>('');
  const [selectedConstituency, setSelectedConstituency] = useState<Constituency | null>(null);

  // Municipalities state (for municipal_corporation elections)
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string; state: string }[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<{ id: number; name: string; state: string } | null>(null);

  // Gram Panchayat state
  const [gpStates, setGpStates] = useState<string[]>([]);
  const [gpDistricts, setGpDistricts] = useState<string[]>([]);
  const [gpTaluks, setGpTaluks] = useState<string[]>([]);
  const [gpGrams, setGpGrams] = useState<string[]>([]);
  const [gpVillages, setGpVillages] = useState<GPVillage[]>([]);
  const [selectedGpState, setSelectedGpState] = useState<string | null>(null);
  const [selectedGpDistrict, setSelectedGpDistrict] = useState<string | null>(null);
  const [selectedGpTaluk, setSelectedGpTaluk] = useState<string | null>(null);
  const [selectedGpGram, setSelectedGpGram] = useState<string | null>(null);
  const [selectedGpVillage, setSelectedGpVillage] = useState<GPVillage | null>(null);
  const [loadingGpStates, setLoadingGpStates] = useState(false);
  const [loadingGpDistricts, setLoadingGpDistricts] = useState(false);
  const [loadingGpTaluks, setLoadingGpTaluks] = useState(false);
  const [loadingGpGrams, setLoadingGpGrams] = useState(false);
  const [loadingGpVillages, setLoadingGpVillages] = useState(false);

  const resetGpState = () => {
    setGpStates([]); setGpDistricts([]); setGpTaluks([]); setGpGrams([]); setGpVillages([]);
    setSelectedGpState(null); setSelectedGpDistrict(null); setSelectedGpTaluk(null);
    setSelectedGpGram(null); setSelectedGpVillage(null);
  };

  const isGramPanchayat = selectedElectionType === 'gram_panchayat';

  const [raisingCat, setRaisingCat] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'success' });

  // Colours
  const GOLD = isDark ? BRAND.yellow : BRAND.yellowLight;
  const BG = theme.palette.background.paper;
  const borderFaint = isDark ? 'rgba(245,168,0,0.18)' : 'rgba(245,168,0,0.28)';
  const textPrimary = theme.palette.text.primary;
  const textMid = isDark ? 'rgba(255,255,255,0.64)' : 'rgba(17,24,39,0.65)';
  const textDim = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(17,24,39,0.46)';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      
      // If filters from WardCandidateListPage are provided, use them directly
      if (filterElectionId && filterConstituencyId) {
        const data = await getIssuesByElectionAndConstituency(filterElectionId, filterConstituencyId, user?.id);
        setCategories(data.categories);
        setIssues(data.issues);
      } else if (selectedElectionId && selectedGpVillage && isGramPanchayat) {
        // Use GP village as constituency
        const data = await getIssuesByElectionAndConstituency(Number(selectedElectionId), Number(selectedGpVillage.id), user?.id);
        setCategories(data.categories);
        setIssues(data.issues);
      } else if (selectedElectionId && selectedConstituency) {
        // Use user-selected election and constituency
        const data = await getIssuesByElectionAndConstituency(Number(selectedElectionId), selectedConstituency.id, user?.id);
        setCategories(data.categories);
        setIssues(data.issues);
      } else {
        // No valid context selected yet
        setCategories([]);
        setIssues([]);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setFetchError(err?.response?.data?.message || err?.message || t('civicIssues.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [filterElectionId, filterConstituencyId, selectedElectionId, selectedConstituency, selectedGpVillage, isGramPanchayat, user?.id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch elections on mount
  useEffect(() => {
    let mounted = true;
    fetchElections()
      .then((resp) => {
        if (!mounted) return;
        const data = Array.isArray(resp.data) ? resp.data : [];
        setElections(data);
        // If filters from WardCandidateListPage, pre-select election
        if (filterElectionId) {
          const matching = data.find((e) => e.id === filterElectionId);
          if (matching) {
            setSelectedElectionId(matching.id);
            setSelectedElectionType(matching.type);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch elections:', err));
    return () => { mounted = false; };
  }, [filterElectionId]);

  // Fetch constituencies when election type changes
  useEffect(() => {
    if (!selectedElectionType) {
      setConstituencies([]);
      setSelectedConstituency(null);
      resetGpState();
      return;
    }

    // gram panchayat flow: fetch GP states instead of constituencies
    if (selectedElectionType === 'gram_panchayat') {
      setConstituencies([]); setSelectedConstituency(null);
      setMunicipalities([]); setSelectedMunicipality(null);
      resetGpState();
      setLoadingGpStates(true);
      fetchGPStates()
        .then((resp) => {
          const data = Array.isArray(resp.data) ? resp.data : [];
          setGpStates(data);
        })
        .catch((err) => console.error('Failed to fetch GP states:', err))
        .finally(() => setLoadingGpStates(false));
      return;
    }

    // Reset GP state for non-GP elections
    resetGpState();

    const selected = elections.find((e) => e.type === selectedElectionType);
    if (!selected) return;

    setLoadingConstituencies(true);
    setConstituencies([]);
    fetchConstituencies(selected.type)
      .then((resp) => {
        const data = resp.data?.constituencies ?? [];
        setConstituencies(data);
        // If filters from WardCandidateListPage, pre-select constituency
        if (filterConstituencyId) {
          const matching = data.find((c) => c.id === filterConstituencyId);
          if (matching) {
            setSelectedConstituency(matching);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch constituencies:', err))
      .finally(() => setLoadingConstituencies(false));
  }, [selectedElectionType, filterConstituencyId, elections]);

  // Fetch municipalities when election type is municipal_corporation
  useEffect(() => {
    if (selectedElectionType !== 'municipal_corporation') {
      setMunicipalities([]);
      setSelectedMunicipality(null);
      return;
    }
    setLoadingMunicipalities(true);
    fetchMunicipalities('Karnataka')
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setMunicipalities(data);
      })
      .catch((err) => console.error('Failed to fetch municipalities:', err))
      .finally(() => setLoadingMunicipalities(false));
  }, [selectedElectionType]);

  // Fetch constituencies when municipality is selected (for municipal_corporation)
  useEffect(() => {
    if (!selectedMunicipality) {
      setConstituencies([]);
      setSelectedConstituency(null);
      return;
    }
    setLoadingConstituencies(true);
    fetchConstituenciesByScope(selectedMunicipality.name)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setConstituencies(data);
      })
      .catch((err) => console.error('Failed to fetch constituencies by scope:', err))
      .finally(() => setLoadingConstituencies(false));
  }, [selectedMunicipality]);

  // ── Gram Panchayat cascading fetches ──
  useEffect(() => {
    if (!selectedGpState) {
      setGpDistricts([]); setSelectedGpDistrict(null);
      setGpTaluks([]); setSelectedGpTaluk(null);
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      return;
    }
    setLoadingGpDistricts(true);
    setGpDistricts([]); setSelectedGpDistrict(null);
    setGpTaluks([]); setSelectedGpTaluk(null);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    fetchGPDistricts(selectedGpState)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpDistricts(data);
      })
      .catch((err) => console.error('Failed to fetch GP districts:', err))
      .finally(() => setLoadingGpDistricts(false));
  }, [selectedGpState]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict) {
      setGpTaluks([]); setSelectedGpTaluk(null);
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      return;
    }
    setLoadingGpTaluks(true);
    setGpTaluks([]); setSelectedGpTaluk(null);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    fetchGPTaluks(selectedGpState, selectedGpDistrict)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpTaluks(data);
      })
      .catch((err) => console.error('Failed to fetch GP taluks:', err))
      .finally(() => setLoadingGpTaluks(false));
  }, [selectedGpState, selectedGpDistrict]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict || !selectedGpTaluk) {
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      return;
    }
    setLoadingGpGrams(true);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    fetchGPGrams(selectedGpState, selectedGpDistrict, selectedGpTaluk)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpGrams(data);
      })
      .catch((err) => console.error('Failed to fetch GP grams:', err))
      .finally(() => setLoadingGpGrams(false));
  }, [selectedGpState, selectedGpDistrict, selectedGpTaluk]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict || !selectedGpTaluk || !selectedGpGram) {
      setGpVillages([]); setSelectedGpVillage(null);
      return;
    }
    setLoadingGpVillages(true);
    setGpVillages([]); setSelectedGpVillage(null);
    fetchGPVillages(selectedGpState, selectedGpDistrict, selectedGpTaluk, selectedGpGram)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpVillages(data);
      })
      .catch((err) => console.error('Failed to fetch GP villages:', err))
      .finally(() => setLoadingGpVillages(false));
  }, [selectedGpState, selectedGpDistrict, selectedGpTaluk, selectedGpGram]);

  // Fetch issues when both election and constituency are selected by user
  useEffect(() => {
    if (selectedElectionId && selectedConstituency && !filterElectionId) {
      fetchData();
    }
  }, [selectedElectionId, selectedConstituency, filterElectionId, fetchData]);

  // Fetch issues when GP village is selected
  useEffect(() => {
    if (selectedElectionId && selectedGpVillage && isGramPanchayat && !filterElectionId) {
      fetchData();
    }
  }, [selectedElectionId, selectedGpVillage, isGramPanchayat, filterElectionId, fetchData]);

  const handleRaise = async (category: IssueCategory) => {
    // Can only raise if we have election/constituency filters
    const hasContext = (filterElectionId && filterConstituencyId) || (selectedElectionId && selectedConstituency) || (selectedElectionId && selectedGpVillage && isGramPanchayat);
    if (!hasContext || category.isRaised) return;  // Don't allow re-raising if already raised
    try {
      setRaisingCat(category.name);
      // Prioritize filter-based election/constituency
      if (filterElectionId && filterConstituencyId) {
        await raiseHandForCategoryByElectionConstituency(filterElectionId, filterConstituencyId, category.name);
      } else if (selectedElectionId && selectedGpVillage && isGramPanchayat) {
        await raiseHandForCategoryByElectionConstituency(Number(selectedElectionId), Number(selectedGpVillage.id), category.name);
      } else if (selectedElectionId && selectedConstituency) {
        // Use user-selected election/constituency
        await raiseHandForCategoryByElectionConstituency(Number(selectedElectionId), selectedConstituency.id, category.name);
      }
      // Pick display name according to current language (Kannada when active)
      const display = (i18n.language || '').toLowerCase().startsWith('kn') && (category as any).nameKn ? (category as any).nameKn : category.name;
      setSnack({ open: true, msg: t('civicIssues.reportedSuccess', { category: display }), severity: 'success' });
      // Update only the raised category in local state instead of refetching everything
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.name === category.name ? { ...cat, count: cat.count + 1, isRaised: true } : cat
        )
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('civicIssues.failedToReport');
      setSnack({ open: true, msg, severity: 'error' });
    } finally {
      setRaisingCat(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 1, sm: 0 } }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <Box sx={{
          bgcolor: BG,
          borderRadius: 3,
          border: `1px solid ${borderFaint}`,
          overflow: 'hidden',
          boxShadow: isDark ? '0 14px 32px rgba(0,0,0,0.32)' : '0 4px 14px rgba(17,24,39,0.06)',
          mb: 3,
        }}>
          {/* Tri-colour bar */}
          <Box sx={{ display: 'flex', height: '4px' }}>
            {[BRAND.red, BRAND.blue, BRAND.brown].map(c => (
              <Box key={c} sx={{ flex: 1, bgcolor: c }} />
            ))}
          </Box>

          <Box sx={{
            px: { xs: 2.5, sm: 4 },
            py: 3,
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: '12px',
                background: 'linear-gradient(135deg,rgba(200,24,10,.22),rgba(37,58,154,.18))',
                border: '1.5px solid rgba(245,168,0,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ReportProblemIcon sx={{ color: GOLD, fontSize: 26 }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: FF, fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.4rem' }, color: textPrimary, lineHeight: 1.1 }}>
                  {t('civicIssues.title')}
                </Typography>
                {filterElectionName && filterConstituencyName ? (
                  <Box>
                    <Typography sx={{ fontFamily: FF, fontSize: '0.9rem', color: isDark ? '#fff' : 'text.primary', mt: 0.5, fontWeight: 800 }}>
                      {filterElectionName}
                    </Typography>
                    <Typography sx={{ fontFamily: FF, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.3, fontWeight: 600 }}>
                      {t('civicIssues.constituency')}: {filterConstituencyName}
                    </Typography>
                  </Box>
                ) : (selectedElectionId && selectedConstituency) ? (
                  <Box>
                    <Typography sx={{ fontFamily: FF, fontSize: '0.9rem', color: isDark ? '#fff' : 'text.primary', mt: 0.5, fontWeight: 800 }}>
                      {elections.find((e) => e.id === selectedElectionId)?.name}
                    </Typography>
                    {selectedElectionType === 'municipal_corporation' && selectedMunicipality ? (
                      <>
                        <Typography sx={{ fontFamily: FF, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.3, fontWeight: 600 }}>
                          {t('civicIssues.municipality', { defaultValue: 'Municipality' })}: {selectedMunicipality.name}
                        </Typography>
                        <Typography sx={{ fontFamily: FF, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.2, fontWeight: 600 }}>
                          {t('civicIssues.ward', { defaultValue: 'Ward' })}: {selectedConstituency?.number} - {selectedConstituency?.name}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontFamily: FF, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.3, fontWeight: 600 }}>
                        {t('civicIssues.constituency')}: {selectedConstituency.name}
                      </Typography>
                    )}
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* ── Filters (Election Type & Constituency) ────────────────────────────── */}
      {!filterElectionName || !filterConstituencyName ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.1 }}>
          <Box sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${borderFaint}`,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(17,24,39,0.02)',
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
              <TextField
                select
                label={t('civicIssues.electionType', { defaultValue: 'Election Type' })}
                value={selectedElectionId}
                onChange={(e) => {
                  const electionId = e.target.value ? Number(e.target.value) : '';
                  setSelectedElectionId(electionId);
                  const election = elections.find((el) => el.id === electionId);
                  setSelectedElectionType(election?.type || '');
                  setSelectedConstituency(null);
                }}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                    '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                    '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                  },
                  '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                  '& .MuiSelect-select': { color: isDark ? '#fff' : 'rgba(15,23,42,0.9)' },
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        bgcolor: isDark ? '#1a1515' : '#ffffff',
                        '& .MuiMenuItem-root': { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.85)' },
                        '& .MuiMenuItem-root:hover': { bgcolor: isDark ? 'rgba(245,168,0,0.08)' : 'rgba(245,168,0,0.1)' },
                        '& .MuiMenuItem-root.Mui-selected': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.2)', color: BRAND.yellow },
                      },
                    },
                  },
                }}
              >
                {elections.map((el) => (
                  <MenuItem key={el.id} value={el.id}>{el.name}</MenuItem>
                ))}
              </TextField>

              {isGramPanchayat ? (
                <Autocomplete
                  options={gpStates}
                  value={selectedGpState}
                  onChange={(_, val) => setSelectedGpState(val)}
                  disabled={!selectedElectionType}
                  loading={loadingGpStates}
                  sx={{ flex: 1, minWidth: 200 }}
                  ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
                  renderInput={(params) => (
                    <TextField {...params} label="State" sx={{
                      '& .MuiOutlinedInput-root': {
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                        '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                      },
                      '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                    }} />
                  )}
                />
              ) : (
                <>
                  <Autocomplete
                    options={selectedElectionType === 'municipal_corporation' ? municipalities : constituencies}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedElectionType === 'municipal_corporation' ? selectedMunicipality : selectedConstituency}
                    onChange={(_, value) => {
                      if (selectedElectionType === 'municipal_corporation') {
                        setSelectedMunicipality(value as any);
                      } else {
                        setSelectedConstituency(value as any);
                      }
                    }}
                    disabled={!selectedElectionType || (selectedElectionType === 'municipal_corporation' ? loadingMunicipalities : loadingConstituencies)}
                    loading={selectedElectionType === 'municipal_corporation' ? loadingMunicipalities : loadingConstituencies}
                    sx={{
                      flex: 1,
                      minWidth: 220,
                      '& .MuiAutocomplete-popupIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
                      '& .MuiAutocomplete-clearIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
                    }}
                    ListboxProps={{
                      sx: {
                        bgcolor: isDark ? '#1a1515' : '#fff',
                        '& .MuiAutocomplete-option': {
                          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.9)',
                          '&[aria-selected="true"]': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.1)' },
                          '&.Mui-focused': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.04)' },
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={selectedElectionType === 'municipal_corporation' ? t('civicIssues.municipality', { defaultValue: 'Municipality' }) : t('civicIssues.constituency', { defaultValue: 'Constituency' })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                            '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                            '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                          },
                          '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                          '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                        }}
                      />
                    )}
                  />

                  {/* Show City Corporation Name when municipality is selected for municipal_corporation */}
                  {selectedElectionType === 'municipal_corporation' && selectedMunicipality && (
                    <Autocomplete
                      options={constituencies}
                      getOptionLabel={(option) => `${option.number} - ${option.name}`}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={selectedConstituency}
                      onChange={(_, value) => setSelectedConstituency(value)}
                      disabled={loadingConstituencies}
                      loading={loadingConstituencies}
                      sx={{
                        flex: 1,
                        minWidth: 220,
                        '& .MuiAutocomplete-popupIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
                        '& .MuiAutocomplete-clearIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
                      }}
                      ListboxProps={{
                        sx: {
                          bgcolor: isDark ? '#1a1515' : '#fff',
                          '& .MuiAutocomplete-option': {
                            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.9)',
                            '&[aria-selected="true"]': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.1)' },
                            '&.Mui-focused': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.04)' },
                          },
                        },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('civicIssues.ward', { defaultValue: 'Ward/Constituency' })}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                              '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                              '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                            },
                            '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                            '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                          }}
                        />
                      )}
                    />
                  )}
                </>
              )}
            </Stack>

            {/* Gram Panchayat second row: District, Taluk, Gram, Village */}
            {isGramPanchayat && selectedGpState && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', mt: 2, flexWrap: 'wrap' }}>
                <Autocomplete
                  options={gpDistricts}
                  value={selectedGpDistrict}
                  onChange={(_, val) => setSelectedGpDistrict(val)}
                  disabled={!selectedGpState}
                  loading={loadingGpDistricts}
                  sx={{ flex: 1, minWidth: 180 }}
                  ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
                  renderInput={(params) => (
                    <TextField {...params} label="District" sx={{
                      '& .MuiOutlinedInput-root': {
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                        '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                      },
                      '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                    }} />
                  )}
                />
                <Autocomplete
                  options={gpTaluks}
                  value={selectedGpTaluk}
                  onChange={(_, val) => setSelectedGpTaluk(val)}
                  disabled={!selectedGpDistrict}
                  loading={loadingGpTaluks}
                  sx={{ flex: 1, minWidth: 180 }}
                  ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
                  renderInput={(params) => (
                    <TextField {...params} label="Taluk" sx={{
                      '& .MuiOutlinedInput-root': {
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                        '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                      },
                      '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                    }} />
                  )}
                />
                <Autocomplete
                  options={gpGrams}
                  value={selectedGpGram}
                  onChange={(_, val) => setSelectedGpGram(val)}
                  disabled={!selectedGpTaluk}
                  loading={loadingGpGrams}
                  sx={{ flex: 1, minWidth: 180 }}
                  ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
                  renderInput={(params) => (
                    <TextField {...params} label="Gram Panchayat" sx={{
                      '& .MuiOutlinedInput-root': {
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                        '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                      },
                      '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                    }} />
                  )}
                />
                <Autocomplete
                  options={gpVillages}
                  getOptionLabel={(option) => option.villageName}
                  value={selectedGpVillage}
                  onChange={(_, val) => setSelectedGpVillage(val)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={!selectedGpGram}
                  loading={loadingGpVillages}
                  sx={{ flex: 1, minWidth: 0 }}
                  ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
                  renderInput={(params) => (
                    <TextField {...params} label="Village" sx={{
                      '& .MuiOutlinedInput-root': {
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(245,168,0,0.45)' },
                        '&.Mui-focused fieldset': { borderColor: BRAND.yellow, borderWidth: '1.5px' },
                      },
                      '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: BRAND.yellow },
                    }} />
                  )}
                />
              </Stack>
            )}
            {isGramPanchayat && (
              <Typography sx={{ fontFamily: FF, fontSize: '0.85rem', color: '#F5A800', mt: 1.5 }}>
                {(() => {
                  const msg = t('civicIssues.gpVillageNotFound', { defaultValue: 'If you are unable to find your Grama Panchayat or village, please report it to support@prajaakeeya.org' });
                  const email = 'support@prajaakeeya.org';
                  const idx = msg.indexOf(email);
                  if (idx === -1) return msg;
                  return (
                    <>
                      {msg.slice(0, idx)}
                      <Box component="a" href={`mailto:${email}`} sx={{ color: '#F5A800', textDecoration: 'underline' }}>
                        {email}
                      </Box>
                      {msg.slice(idx + email.length)}
                    </>
                  );
                })()}
              </Typography>
            )}
          </Box>
        </motion.div>
      ) : null}

      {/* ── Issues List ────────────────────────────────────────────────────── */}
      {!loading && !fetchError && issues.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: FF, fontWeight: 800, fontSize: '1.1rem', color: textPrimary, mb: 2 }}>
              {t('civicIssues.reportedIssues', { defaultValue: 'Reported Issues' })} ({issues.length})
            </Typography>
            <Stack spacing={1.5}>
              <AnimatePresence>
                {issues.map((issue, idx) => {
                  const createdDate = new Date(issue.createdAt);
                  const displayName = (i18n.language || '').toLowerCase().startsWith('kn') ? issue.description : issue.title;
                  return (
                    <motion.div
                      key={issue.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                    >
                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(17,24,39,0.02)',
                        border: `1px solid ${borderFaint}`,
                        boxShadow: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.04)',
                          borderColor: GOLD,
                        },
                      }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Box sx={{
                            width: 40, height: 40, borderRadius: '50%',
                            bgcolor: isDark ? 'rgba(245,168,0,0.1)' : 'rgba(245,168,0,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <ReportProblemIcon sx={{ color: GOLD, fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: textPrimary, mb: 0.3 }}>
                              {displayName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: textDim, lineHeight: 1.4 }}>
                              {issue.description !== issue.title ? issue.description : ''}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: textDim, mt: 0.5 }}>
                              {createdDate.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Stack>
          </Box>
        </motion.div>
      )}

      {/* ── Category list ─────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: GOLD }} />
        </Box>
      ) : fetchError ? (
        <Box sx={{ bgcolor: BG, borderRadius: 3, border: `1px solid ${borderFaint}`, py: 6, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: FF, color: '#C8180A', fontWeight: 700, mb: 1 }}>{t('civicIssues.error')}</Typography>
          <Typography sx={{ fontFamily: FF, fontSize: '0.88rem', color: textMid }}>{fetchError}</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          <AnimatePresence>
            {[...categories].sort((a, b) => {
              const priority = ['jobs', 'education', 'health'];
              const ai = priority.indexOf(a.name.toLowerCase());
              const bi = priority.indexOf(b.name.toLowerCase());
              const ap = ai >= 0 ? ai : priority.length;
              const bp = bi >= 0 ? bi : priority.length;
              return ap - bp;
            }).map((cat, idx) => {
              const isRaised = cat.isRaised ?? false;  // Use isRaised from API response
              const isRaising = raisingCat === cat.name;
              // pick an icon + color based on the category name (case-insensitive match)
              // use the API `name` (English) for logic keys; display may use `nameKn` when Kannada is active
              const nameLower = (cat.name || '').toLowerCase();
              const displayName = (i18n.language || '').toLowerCase().startsWith('kn') && (cat as any).nameKn ? (cat as any).nameKn : cat.name;
              const getIcon = () => {
                if (nameLower.includes('construction') || nameLower === 'construction') return { imgSrc: architectImg, color: '#FF6B6B' }; // Construction → architect image
                if (nameLower.includes('roads') || nameLower === 'roads' || nameLower.includes('road')) return { imgSrc: roadMapImg, color: '#FF6B6B' }; // Roads → use road-map image
                if (nameLower.includes('water')) return { imgSrc: waterTapImg, color: '#4FC3F7' }; // Water → water-tap image
                if (nameLower.includes('sew') || nameLower.includes('sewage') || nameLower.includes('drain') || nameLower.includes('pipe')) return { imgSrc: wasteImg, color: '#00BFA6' }; // Sewage → waste image
                if (nameLower.includes('garbage') || nameLower.includes('trash') || nameLower.includes('waste')) return { imgSrc: garbageImg, color: '#9CCC65' }; // Garbage → waste image
                if (nameLower.includes('street') || nameLower.includes('light') || nameLower.includes('street lights')) return { imgSrc: streetLightImg, color: '#FFD54F' }; // Street Lights → street-light image
                if (nameLower.includes('safety') || nameLower.includes('safe') || nameLower.includes('shield')) return { Icon: ShieldIcon, color: '#FF8A65' }; // Safety → shield-alert
                if (nameLower.includes('park') || nameLower.includes('parks') || nameLower.includes('tree')) return { Icon: ParkIcon, color: '#66BB6A' }; // Parks → tree-pine
                if (nameLower.includes('health') || nameLower.includes('hospital') || nameLower.includes('clinic')) return { Icon: FavoriteIcon, color: '#FF6B81' }; // Health → heart-pulse
                if (nameLower === 'construction' || nameLower.includes('hammer') || nameLower.includes('build')) return { Icon: BuildIcon, color: '#FF7043' }; // Construction → hammer
                if (nameLower.includes('electric') || nameLower.includes('power') || nameLower.includes('zap')) return { Icon: FlashOnIcon, color: '#FFD54F' }; // Electricity → zap
                if (nameLower.includes('environment') || nameLower.includes('env') || nameLower.includes('eco') || nameLower.includes('leaf')) return { imgSrc: savePlanetImg, color: '#8BC34A' }; // Environment → save-the-planet image
                if (nameLower.includes('government') || nameLower.includes('gov') || nameLower.includes('service') || nameLower.includes('services')) return { Icon: BuildingIcon, color: '#90CAF9' }; // Government Services → building-2
                if (nameLower.includes('public infrastructure') || nameLower.includes('infrastructure') || nameLower.includes('bridge')) return { Icon: BridgeIcon, color: '#8D6E63' }; // Public Infrastructure → bridge
                if (nameLower.includes('others') || nameLower.includes('other') || nameLower.trim() === '') return { Icon: MoreHorizIcon, color: '#BDBDBD' }; // Others → more-horizontal
                return { Icon: ReportProblemIcon, color: GOLD };
              };
              const iconResult = getIcon();
              const IssueIcon = iconResult.Icon ?? ReportProblemIcon;
              const issueColor = iconResult.color;
              const imgSrc = (iconResult as any).imgSrc as string | undefined;
              // always allow the display name to wrap so long names don't overflow on small screens

              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28, delay: idx * 0.03 }}
                >
                  <Card
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: BG,
                      border: `1px solid ${borderFaint}`,
                      boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.28)' : '0 2px 8px rgba(17,24,39,0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ display: 'flex' }}>
                      {/* Left accent bar */}
                      <Box sx={{ width: '4px', flexShrink: 0, bgcolor: idx % 3 === 0 ? BRAND.red : idx % 3 === 1 ? BRAND.blue : BRAND.brown }} />
                      <CardContent sx={{ flex: 1, py: 2, px: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                          {/* Category name + count */}
                          <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
                            <Box sx={{ width: 28, height: 28, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                              {imgSrc ? (
                                <Box component="img" src={imgSrc} alt="road" sx={{ width: 24, height: 24, objectFit: 'contain', filter: isDark ? 'drop-shadow(0 0 6px rgba(0,0,0,0.6))' : 'none' }} />
                              ) : (
                                <IssueIcon sx={{ color: issueColor, fontSize: 22, filter: `drop-shadow(0 0 8px ${issueColor}33)` }} />
                              )}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{
                                fontFamily: FF, fontWeight: 800,
                                fontSize: { xs: '0.98rem', sm: '1.06rem' },
                                color: textPrimary, mb: 0.3,
                                whiteSpace: 'normal',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                                display: 'block'
                              }}>
                                {displayName}
                              </Typography>
                              <Typography sx={{ fontFamily: FF, fontSize: '0.78rem', color: textDim }}>
                                {t('civicIssues.handRaise', { count: cat.count })}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Report / Raised button */}
                          <Box sx={{ flexShrink: 0, mt: { xs: 1, sm: 0 } }}>
                            {isRaised ? (
                              <Button
                                disabled
                                size="small"
                                startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  fontFamily: FF, fontWeight: 700, textTransform: 'none',
                                  borderRadius: 2, fontSize: '0.82rem',
                                  color: isDark ? 'rgba(76,175,80,0.85)' : '#388e3c',
                                  borderColor: isDark ? 'rgba(76,175,80,0.35)' : 'rgba(76,175,80,0.5)',
                                  '&.Mui-disabled': {
                                    color: isDark ? 'rgba(76,175,80,0.85)' : '#388e3c',
                                    borderColor: isDark ? 'rgba(76,175,80,0.35)' : 'rgba(76,175,80,0.5)',
                                  },
                                }}
                                variant="outlined"
                              >
                                {t('civicIssues.reportedBtn', { defaultValue: 'Reported' })}
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                disabled={isRaising}
                                onClick={() => handleRaise(cat)}
                                startIcon={isRaising ? <CircularProgress size={14} sx={{ color: GOLD }} /> : <HandRaiseIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  fontFamily: FF, fontWeight: 700, textTransform: 'none',
                                  borderRadius: 2, fontSize: '0.82rem',
                                  borderColor: 'rgba(245,168,0,0.45)',
                                  color: GOLD,
                                  '&:hover': { bgcolor: 'rgba(245,168,0,0.08)', borderColor: GOLD },
                                }}
                                variant="outlined"
                              >
                                {t('common.yes', { defaultValue: 'Yes' })}
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Box>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Stack>
      )}

      {/* Proceed button */}
      <Box sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/user/sop')}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: FF,
            py: 1.5,
            fontSize: '0.95rem',
            color: '#fff',
            background: 'linear-gradient(135deg, #C8180A 0%, #F5A800 100%)',
            boxShadow: '0 6px 24px rgba(200,24,10,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #df210f 0%, #ffbe1a 100%)',
              boxShadow: '0 8px 30px rgba(200,24,10,0.55)',
            },
          }}
        >
          {isKannada ? 'ಪರಿಹಾರ (SOP)' : 'Solutions (SOP)'}
        </Button>
      </Box>
    </Box>
  );
};

export default CivicIssuesPage;
