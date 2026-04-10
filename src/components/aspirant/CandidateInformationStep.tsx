import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue, UseFormTrigger, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  CircularProgress,
  Autocomplete,
  useTheme,
  Alert,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BRAND } from '../../theme';
import { getMinAgeForElectionType } from '../../utils/validation';
import {
  fetchElections,
  fetchConstituencies,
  fetchMunicipalities,
  fetchConstituenciesByScope,
  fetchGPStates,
  fetchGPDistricts,
  fetchGPTaluks,
  fetchGPGrams,
  fetchGPVillages,
  type Election,
  type Constituency,
  type GPVillage,
} from '../../services/electionService';

// ── Theme constants — sourced from central BRAND palette ──────────────────
const GOLD = BRAND.yellow;                    // '#F5A800'
const GOLDD = 'rgba(245,168,0,0.45)';
const DARK = BRAND.black;                     // '#0A0808'
const DARK2 = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(245,168,0,0.18)';
const FF = "'Baloo 2', sans-serif";

// ── Framer-motion variants ─────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, type: 'spring' as const, stiffness: 260, damping: 22 } },
};

// ── Field row accent colours (cycling through brand palette) ───────────────
const FIELD_ACCENTS = [
  BRAND.red,    // red
  BRAND.blue,   // blue
  BRAND.brown,  // brown
  BRAND.red,
  BRAND.blue,
  BRAND.yellow, // gold
  BRAND.red,
  BRAND.blue,
  BRAND.brown,
  BRAND.yellow,
  BRAND.red,
];

// ── AspirantForm type (minimal, matching parent) ───────────────────────────
interface AspirantForm {
  name: string;
  manifesto: string;
  electionId: number | string;
  constituencyId: number | string;
  party?: string;
  age?: number | string;
  education?: string;
  occupation?: string;
  gender?: string;
  phone?: string;
  address?: string;
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  twitterLink?: string;
  whatsappNumber?: string;
}

// ── User shape (subset from useAuthStore) ──────────────────────────────────
interface UserInfo {
  name?: string;
  epicId?: string;
  voterEpic?: string;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
  wardId?: number | null;
  category?: string | null;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  register: UseFormRegister<AspirantForm>;
  errors: FieldErrors<AspirantForm>;
  watch: UseFormWatch<AspirantForm>;
  setValue: UseFormSetValue<AspirantForm>;
  trigger?: UseFormTrigger<AspirantForm>;
  setError?: UseFormSetError<AspirantForm>;
  clearErrors?: UseFormClearErrors<AspirantForm>;
  reset?: () => void;
  loading: boolean;
  user: UserInfo | null;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

// ── Autofill override (prevents browser from painting white background) ─────
const getAutofillOverride = (isDark: boolean) => ({
  '& input:-webkit-autofill': {
    WebkitBoxShadow: `0 0 0px 1000px ${isDark ? '#0d0b0b' : '#ffffff'} inset !important`,
    WebkitTextFillColor: `${isDark ? '#fff' : 'rgba(15,23,42,0.92)'} !important`,
    caretColor: isDark ? '#fff' : 'rgba(15,23,42,0.92)',
    borderRadius: 'inherit',
  },
  '& input:-webkit-autofill:hover': {
    WebkitBoxShadow: `0 0 0px 1000px ${isDark ? '#0d0b0b' : '#ffffff'} inset !important`,
  },
  '& input:-webkit-autofill:focus': {
    WebkitBoxShadow: `0 0 0px 1000px ${isDark ? '#0d0b0b' : '#ffffff'} inset !important`,
  },
});

// ── Dark-styled TextField helper ───────────────────────────────────────────
const getFieldSx = (isDark: boolean) => ({
  '& .MuiOutlinedInput-root': {
    background: isDark ? DARK2 : 'rgba(255,255,255,0.88)',
    fontFamily: FF,
    '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.2)' },
    '&:hover fieldset': { borderColor: GOLDD },
    '&.Mui-focused fieldset': { borderColor: GOLD, borderWidth: '1.5px' },
    '& input': { color: isDark ? '#fff' : 'rgba(15,23,42,0.92)', fontFamily: FF, WebkitTextFillColor: isDark ? '#fff' : 'rgba(15,23,42,0.92)' },
    '& textarea': { color: isDark ? '#fff' : 'rgba(15,23,42,0.92)', fontFamily: FF },
  },
  '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)', fontFamily: FF },
  '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
  '& .MuiFormHelperText-root': { color: 'rgba(255,80,80,0.85)', fontFamily: FF, fontSize: '0.72rem' },
  '& .MuiSelect-select': { color: isDark ? '#fff' : 'rgba(15,23,42,0.9)', fontFamily: FF },
  '& .MuiSvgIcon-root': { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.55)' },
  ...getAutofillOverride(isDark),
});

const getDisabledFieldSx = (isDark: boolean) => ({
  '& .MuiOutlinedInput-root': {
    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.04)',
    fontFamily: FF,
    '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.16)' },
    '& input': { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.75)', fontFamily: FF, WebkitTextFillColor: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.75)' },
  },
  '& .MuiInputLabel-root': { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.62)', fontFamily: FF },
  '& .MuiInputLabel-root.Mui-disabled': { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.62)' },
});

// ── Component ──────────────────────────────────────────────────────────────
const CandidateInformationStep = ({
  register, errors, watch, setValue, trigger, setError, clearErrors,
  loading, user,
  onNext, onBack, onCancel,
}: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const darkFieldSx = getFieldSx(isDark);
  const disabledFieldSx = getDisabledFieldSx(isDark);
  const cardBg = isDark ? DARK : 'linear-gradient(180deg,#fffdfa 0%,#f9f4ec 100%)';
  const cardBorder = isDark ? BORDER : 'rgba(245,168,0,0.24)';
  const textPrimary = isDark ? '#fff' : 'rgba(15,23,42,0.94)';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.62)';
  const fieldWrapBg = isDark ? DARK2 : 'rgba(15,23,42,0.04)';
  const fieldWrapBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.12)';

  const watchedGender = watch('gender');
  const watchedElectionId = watch('electionId');
  const watchedAge = watch('age');

  // Election & Constituency state
  const [elections, setElections] = useState<Election[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [selectedConstituency, setSelectedConstituency] = useState<Constituency | null>(null);
  // Municipal flow state
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string; state: string }[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<{ id: number; name: string; state: string } | null>(null);
  const [cityConstituencies, setCityConstituencies] = useState<Constituency[]>([]);
  const [loadingCityConstituencies, setLoadingCityConstituencies] = useState(false);
  const [selectedCityConstituency, setSelectedCityConstituency] = useState<Constituency | null>(null);
  // Gram Panchayat flow state
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

  // Derive current election type and minimum age for validation
  const selectedElectionForAge = elections.find((e) => String(e.id) === String(watchedElectionId));
  const currentMinAge = getMinAgeForElectionType(selectedElectionForAge?.type ?? '');

  // Validate age against election type minimum whenever either changes
  useEffect(() => {
    if (!watchedAge || !watchedElectionId || !setError || !clearErrors) return;
    const ageNum = Number(watchedAge);
    if (isNaN(ageNum)) return;
    const electionType = selectedElectionForAge?.type ?? '';
    const minAge = getMinAgeForElectionType(electionType);
    if (ageNum < minAge) {
      setError('age', { type: 'manual', message: `validation.ageMinElection:${minAge}` });
    } else {
      clearErrors('age');
    }
  }, [watchedAge, watchedElectionId, selectedElectionForAge, setError, clearErrors]);

  const resetGpState = () => {
    setGpStates([]); setGpDistricts([]); setGpTaluks([]); setGpGrams([]); setGpVillages([]);
    setSelectedGpState(null); setSelectedGpDistrict(null); setSelectedGpTaluk(null);
    setSelectedGpGram(null); setSelectedGpVillage(null);
  };

  // Fetch elections on mount
  useEffect(() => {
    fetchElections()
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setElections(data);
      })
      .catch((err) => console.error('Failed to fetch elections:', err));
  }, [setValue]);

  // Fetch constituencies when election type changes
  useEffect(() => {
    if (!watchedElectionId) {
      setConstituencies([]);
      setSelectedConstituency(null);
      setMunicipalities([]); setSelectedMunicipality(null);
      setCityConstituencies([]); setSelectedCityConstituency(null);
      resetGpState();
      setValue('constituencyId', '');
      return;
    }
    const selected = elections.find((e) => String(e.id) === String(watchedElectionId));
    if (!selected) return;

    // reset previous selections/values
    setConstituencies([]);
    setSelectedConstituency(null);
    setSelectedMunicipality(null);
    setSelectedCityConstituency(null);
    resetGpState();
    setValue('constituencyId', '');

    // gram panchayat flow
    if (selected.type === 'gram_panchayat') {
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

    if (selected.type === 'municipal_corporation') {
      setLoadingMunicipalities(true);
      setMunicipalities([]);
      fetchMunicipalities('Karnataka')
        .then((resp) => {
          const data = Array.isArray(resp.data) ? resp.data : [];
          setMunicipalities(data);
        })
        .catch((err) => console.error('Failed to fetch municipalities:', err))
        .finally(() => setLoadingMunicipalities(false));
      return;
    }

    setLoadingConstituencies(true);
    fetchConstituencies(selected.type)
      .then((resp) => {
        const data = resp.data?.constituencies ?? [];
        setConstituencies(data);
      })
      .catch((err) => console.error('Failed to fetch constituencies:', err))
      .finally(() => setLoadingConstituencies(false));
  }, [watchedElectionId, elections, setValue]);

  // when a municipality is selected, fetch constituencies for that municipality (city wards)
  useEffect(() => {
    if (!selectedMunicipality) {
      setCityConstituencies([]);
      setSelectedCityConstituency(null);
      setValue('constituencyId', '');
      return;
    }
    setLoadingCityConstituencies(true);
    setCityConstituencies([]);
    setSelectedCityConstituency(null);
    setValue('constituencyId', '');
    fetchConstituenciesByScope(selectedMunicipality.name)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setCityConstituencies(data);
      })
      .catch((err) => console.error('Failed to fetch city constituencies:', err))
      .finally(() => setLoadingCityConstituencies(false));
  }, [selectedMunicipality, setValue]);

  // ── Gram Panchayat cascading fetches ──
  useEffect(() => {
    if (!selectedGpState) {
      setGpDistricts([]); setSelectedGpDistrict(null);
      setGpTaluks([]); setSelectedGpTaluk(null);
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      setValue('constituencyId', '');
      return;
    }
    setLoadingGpDistricts(true);
    setGpDistricts([]); setSelectedGpDistrict(null);
    setGpTaluks([]); setSelectedGpTaluk(null);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    setValue('constituencyId', '');
    fetchGPDistricts(selectedGpState)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpDistricts(data);
      })
      .catch((err) => console.error('Failed to fetch GP districts:', err))
      .finally(() => setLoadingGpDistricts(false));
  }, [selectedGpState, setValue]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict) {
      setGpTaluks([]); setSelectedGpTaluk(null);
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      setValue('constituencyId', '');
      return;
    }
    setLoadingGpTaluks(true);
    setGpTaluks([]); setSelectedGpTaluk(null);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    setValue('constituencyId', '');
    fetchGPTaluks(selectedGpState, selectedGpDistrict)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpTaluks(data);
      })
      .catch((err) => console.error('Failed to fetch GP taluks:', err))
      .finally(() => setLoadingGpTaluks(false));
  }, [selectedGpState, selectedGpDistrict, setValue]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict || !selectedGpTaluk) {
      setGpGrams([]); setSelectedGpGram(null);
      setGpVillages([]); setSelectedGpVillage(null);
      setValue('constituencyId', '');
      return;
    }
    setLoadingGpGrams(true);
    setGpGrams([]); setSelectedGpGram(null);
    setGpVillages([]); setSelectedGpVillage(null);
    setValue('constituencyId', '');
    fetchGPGrams(selectedGpState, selectedGpDistrict, selectedGpTaluk)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpGrams(data);
      })
      .catch((err) => console.error('Failed to fetch GP grams:', err))
      .finally(() => setLoadingGpGrams(false));
  }, [selectedGpState, selectedGpDistrict, selectedGpTaluk, setValue]);

  useEffect(() => {
    if (!selectedGpState || !selectedGpDistrict || !selectedGpTaluk || !selectedGpGram) {
      setGpVillages([]); setSelectedGpVillage(null);
      setValue('constituencyId', '');
      return;
    }
    setLoadingGpVillages(true);
    setGpVillages([]); setSelectedGpVillage(null);
    setValue('constituencyId', '');
    fetchGPVillages(selectedGpState, selectedGpDistrict, selectedGpTaluk, selectedGpGram)
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setGpVillages(data);
      })
      .catch((err) => console.error('Failed to fetch GP villages:', err))
      .finally(() => setLoadingGpVillages(false));
  }, [selectedGpState, selectedGpDistrict, selectedGpTaluk, selectedGpGram, setValue]);

  // Destructure phone register so we can chain onChange properly
  const { onChange: phoneOnChange, ...phoneRest } = register('phone');
  const electionReg = register('electionId');

  // Ordered field groups for animated rendering
  const fields: Array<{ id: string; colXs: number; colMd: number; node: React.ReactNode }> = [
    {
      id: 'name', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.name')}
          {...register('name')}
          defaultValue={user?.name || ''}
          error={!!errors.name}
          helperText={errors.name && t(errors.name.message || 'validation.required')}
          placeholder={t('forms.aspirant.name')}
          disabled={loading}
          InputLabelProps={{ shrink: true, sx: { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)', fontFamily: FF } }}
          inputProps={{ style: { fontFamily: FF }, autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
        />
      ),
    },
    {
      id: 'phone', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('profile.mobileNumberOptional')}
          {...phoneRest}
          disabled={loading}
          error={!!errors.phone}
          helperText={errors.phone && t((errors.phone as any).message || 'validation.phone')}
          inputProps={{ maxLength: 10, inputMode: 'tel' as const, pattern: '[6-9][0-9]{9}', autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          onChange={e => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            phoneOnChange(e);
          }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'whatsappNumber', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.whatsappNumber')}
          {...register('whatsappNumber')}
          defaultValue=""
          disabled={loading}
          error={!!errors.whatsappNumber}
          helperText={errors.whatsappNumber && t((errors.whatsappNumber as any).message || 'validation.whatsappNumber')}
          inputProps={{ maxLength: 10, inputMode: 'tel' as const, pattern: '[6-9][0-9]{9}', autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#25D366" />
                  <path d="M16.6 14.2c-.3-.15-1.7-.85-2-.95-.3-.1-.5-.15-.7.15-.2.3-.75.95-.9 1.15-.15.2-.35.2-.65.05-.3-.15-1.25-.45-2.4-1.45-.9-.8-1.5-1.75-1.65-2.05-.15-.3 0-.45.15-.6.1-.1.25-.3.35-.45.1-.15.15-.25.2-.4.05-.15.05-.3-.05-.45-.1-.15-.7-1.7-.95-2.3-.25-.6-.5-.5-.7-.5h-.6c-.2 0-.5.05-.75.35-.25.3-1 1-1 2.4s1 2.8 1.15 3c.15.2 2 3.05 4.85 4.3.7.3 1.2.45 1.65.6.7.2 1.3.2 1.8.1.55-.1 1.7-.7 1.95-1.35.25-.65.25-1.2.15-1.35-.1-.15-.3-.2-.6-.35z" fill="white" />
                </svg>
              </Box>
            ),
          }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'gender', colXs: 12, colMd: 3,
      node: (
        <TextField
          fullWidth select
          label={t('forms.aspirant.gender') || 'Gender'}
          {...register('gender')}
          value={watchedGender || ''}
          disabled={loading}
          sx={{
            ...darkFieldSx,
            '& .MuiSelect-select': { color: watchedGender ? (isDark ? '#fff' : 'rgba(15,23,42,0.9)') : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.5)'), fontFamily: FF },
          }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  bgcolor: isDark ? '#1a1515' : '#ffffff',
                  '& .MuiMenuItem-root': { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.85)', fontFamily: FF },
                  '& .MuiMenuItem-root:hover': { bgcolor: isDark ? 'rgba(245,168,0,0.08)' : 'rgba(245,168,0,0.1)' },
                  '& .MuiMenuItem-root.Mui-selected': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.2)', color: GOLD },
                },
              },
            },
          }}
        >
          <MenuItem value="Male">{t('profile.male')}</MenuItem>
          <MenuItem value="Female">{t('profile.female')}</MenuItem>
          <MenuItem value="Other">{t('profile.other')}</MenuItem>
        </TextField>
      ),
    },
    {
      id: 'address', colXs: 12, colMd: 9,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.address') || 'Address'}
          {...register('address')}
          defaultValue=""
          disabled={loading}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.45)', fontFamily: FF }, shrink: undefined }}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'party', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.party')}
          value={t('forms.aspirant.defaults.party')}
          placeholder={t('forms.aspirant.party')}
          disabled
          InputLabelProps={{ shrink: true, sx: { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.62)', fontFamily: FF } }}
          sx={disabledFieldSx}
        />
      ),
    },
    {
      id: 'age', colXs: 12, colMd: 2,
      node: (
        <TextField
          fullWidth
          label={<>
            <span>{t('pages.candidateDetails.labels.age')}</span>
            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
          </>}
          type="number"
          {...register('age')}
          disabled={loading}
          error={!!errors.age}
          helperText={errors.age && (() => {
            const msg: string = (errors.age as any).message || 'validation.required';
            if (msg.startsWith('validation.ageMinElection:')) {
              const minAge = msg.split(':')[1];
              return t('validation.ageMinElection', { minAge });
            }
            return t(msg);
          })()}
          inputProps={{ min: currentMinAge, max: 150, step: 1, inputMode: 'numeric' as const, autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          onKeyDown={e => { if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault(); }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'education', colXs: 12, colMd: 4,
      node: (
        <TextField
          fullWidth
          label={t('pages.candidateDetails.labels.education')}
          {...register('education')}
          defaultValue=""
          disabled={loading}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'occupation', colXs: 12, colMd: 4,
      node: (
        <TextField
          fullWidth
          label={t('pages.candidateDetails.labels.occupation')}
          {...register('occupation')}
          defaultValue=""
          disabled={loading}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'electionType', colXs: 12, colMd: 6,
      node: (
        <>
          <TextField
            fullWidth
            select
            label={
              <>
                <span>{t('forms.aspirant.electionType', { defaultValue: 'Election Type' })}</span>
                <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
              </>
            }
            {...electionReg}
            value={watchedElectionId || ''}
            onChange={(e) => {
              try { electionReg.onChange?.(e as any); } catch (err) { /* ignore */ }
              const val = e.target.value;
              setValue('electionId', val === '' ? '' : Number(val));
            }}
            disabled={loading}
            error={!!errors.electionId}
            helperText={errors.electionId && t((errors.electionId as any).message || 'validation.required')}
            sx={{
              ...darkFieldSx,
              '& .MuiSelect-select': { color: watchedElectionId ? (isDark ? '#fff' : 'rgba(15,23,42,0.9)') : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.5)'), fontFamily: FF },
            }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: isDark ? '#1a1515' : '#ffffff',
                    '& .MuiMenuItem-root': { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.85)', fontFamily: FF },
                    '& .MuiMenuItem-root:hover': { bgcolor: isDark ? 'rgba(245,168,0,0.08)' : 'rgba(245,168,0,0.1)' },
                    '& .MuiMenuItem-root.Mui-selected': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.2)', color: GOLD },
                  },
                },
              },
            }}
          >
            {elections.map((el) => (
              <MenuItem key={el.id} value={el.id}>{el.name}</MenuItem>
            ))}
          </TextField>
          {selectedElectionForAge?.type === 'gram_panchayat' && (
            <Typography variant="body2" sx={{ color: isDark ? 'rgb(245, 168, 0)' : 'red', fontStyle: 'italic', mt: 1, fontFamily: FF, fontSize: '0.78rem' }}>
              {t('civicIssues.gpVillageNotFound')}
            </Typography>
          )}
        </>
      ),
    },
    {
      id: 'constituency', colXs: 12, colMd: 6,
      node: (() => {
        const selectedElection = elections.find((e) => String(e.id) === String(watchedElectionId));
        const isMunicipal = selectedElection?.type === 'municipal_corporation';
        const isGP = selectedElection?.type === 'gram_panchayat';

        if (isGP) {
          return (
            <Stack spacing={1}>
              <Autocomplete
                options={gpStates}
                value={selectedGpState}
                onChange={(_, val) => setSelectedGpState(val)}
                disabled={loading || !watchedElectionId}
                loading={loadingGpStates}
                renderInput={(params) => (
                  <TextField {...params} label={<><span>State</span><Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box></>} sx={darkFieldSx} />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />
              <Autocomplete
                options={gpDistricts}
                value={selectedGpDistrict}
                onChange={(_, val) => setSelectedGpDistrict(val)}
                disabled={loading || !selectedGpState}
                loading={loadingGpDistricts}
                renderInput={(params) => (
                  <TextField {...params} label={<><span>District</span><Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box></>} sx={darkFieldSx} />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />
              <Autocomplete
                options={gpTaluks}
                value={selectedGpTaluk}
                onChange={(_, val) => setSelectedGpTaluk(val)}
                disabled={loading || !selectedGpDistrict}
                loading={loadingGpTaluks}
                renderInput={(params) => (
                  <TextField {...params} label={<><span>Taluk</span><Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box></>} sx={darkFieldSx} />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />
              <Autocomplete
                options={gpGrams}
                value={selectedGpGram}
                onChange={(_, val) => setSelectedGpGram(val)}
                disabled={loading || !selectedGpTaluk}
                loading={loadingGpGrams}
                renderInput={(params) => (
                  <TextField {...params} label={<><span>Gram Panchayat</span><Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box></>} sx={darkFieldSx} />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />
              <Autocomplete
                options={gpVillages}
                getOptionLabel={(option) => option.villageName}
                value={selectedGpVillage}
                onChange={(_, val) => {
                  setSelectedGpVillage(val);
                  setValue('constituencyId', val ? Number(val.id) : '');
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loading || !selectedGpGram}
                loading={loadingGpVillages}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={<><span>Village</span><Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box></>}
                    error={!!errors.constituencyId}
                    helperText={errors.constituencyId && t((errors.constituencyId as any).message || 'validation.required')}
                    sx={darkFieldSx}
                  />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />
            </Stack>
          );
        }

        if (isMunicipal) {
          return (
            <>
              <Autocomplete
                options={municipalities}
                getOptionLabel={(option) => option.name}
                getOptionDisabled={(option) => !/greater bengaluru authority/i.test(option.name)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedMunicipality}
                onChange={(_, selected) => {
                  setSelectedMunicipality(selected);
                }}
                disabled={loading || !watchedElectionId}
                loading={loadingMunicipalities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      <>
                        <span>{t('forms.aspirant.municipality', { defaultValue: 'Corporation / Municipality' })}</span>
                        <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                      </>
                    }
                    sx={darkFieldSx}
                  />
                )}
                sx={{ mb: 1 }}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />

              <Autocomplete
                options={cityConstituencies}
                getOptionLabel={(option) => `${option.number} - ${option.name}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedCityConstituency}
                onChange={(_, selected) => {
                  setSelectedCityConstituency(selected);
                  setValue('constituencyId', selected ? selected.id : '');
                }}
                disabled={loading || !selectedMunicipality}
                loading={loadingCityConstituencies}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      <>
                        <span>{t('forms.aspirant.cityCorporationName', { defaultValue: 'City Corporation Ward' })}</span>
                        <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                      </>
                    }
                    error={!!errors.constituencyId}
                    helperText={errors.constituencyId && t((errors.constituencyId as any).message || 'validation.required')}
                    sx={darkFieldSx}
                  />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? '#1a1515' : '#fff' } }}
              />

              {selectedCityConstituency?.category && (
                <Alert
                  severity="info"
                  icon={<InfoOutlinedIcon />}
                  sx={{ mt: 1 }}
                >
                  <Typography variant="body2">
                    <strong>{t('forms.aspirant.reservedCategory', { defaultValue: 'Reserved Category' })}:</strong>{' '}
                    {selectedCityConstituency.category}
                  </Typography>
                </Alert>
              )}
            </>
          );
        }

        return (
          <Autocomplete
            options={constituencies}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedConstituency}
            onChange={(_, selected) => {
              setSelectedConstituency(selected);
              setValue('constituencyId', selected ? selected.id : '');
            }}
            disabled={loading || !watchedElectionId}
            loading={loadingConstituencies}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  <>
                    <span>{t('forms.aspirant.constituency', { defaultValue: 'Constituency' })}</span>
                    <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                  </>
                }
                error={!!errors.constituencyId}
                helperText={errors.constituencyId && t((errors.constituencyId as any).message || 'validation.required')}
                sx={darkFieldSx}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
              '& .MuiAutocomplete-clearIndicator': { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.55)' },
            }}
            ListboxProps={{
              sx: {
                bgcolor: isDark ? '#1a1515' : '#fff',
                '& .MuiAutocomplete-option': {
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.9)',
                  fontFamily: FF,
                  '&[aria-selected="true"]': { bgcolor: isDark ? 'rgba(245,168,0,0.15)' : 'rgba(245,168,0,0.1)' },
                  '&.Mui-focused': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.04)' },
                },
              },
            }}
          />
        );
      })(),
    },
    {
      id: 'manifesto', colXs: 12, colMd: 12,
      node: (
        <TextField
          fullWidth
          label={<>
            <span>{t('pages.candidateDetails.labels.about')}</span>
            <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
          </>}
          multiline
          rows={6}
          {...register('manifesto')}
          defaultValue=""
          error={!!errors.manifesto}
          helperText={errors.manifesto && t(errors.manifesto.message || 'validation.required')}
          placeholder={t('pages.candidateDetails.labels.about')}
          disabled={loading}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'instagramLink', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.instagramLink')}
          {...register('instagramLink')}
          defaultValue=""
          placeholder="https://instagram.com/yourprofile"
          disabled={loading}
          error={!!errors.instagramLink}
          helperText={errors.instagramLink && t((errors.instagramLink as any).message || 'validation.instagramLink')}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497" />
                      <stop offset="5%" stopColor="#fdf497" />
                      <stop offset="45%" stopColor="#fd5949" />
                      <stop offset="60%" stopColor="#d6249f" />
                      <stop offset="90%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="6" ry="6" fill="url(#ig-grad)" />
                  <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
                </svg>
              </Box>
            ),
          }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'facebookLink', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.facebookLink')}
          {...register('facebookLink')}
          defaultValue=""
          placeholder="https://facebook.com/yourprofile"
          disabled={loading}
          error={!!errors.facebookLink}
          helperText={errors.facebookLink && t((errors.facebookLink as any).message || 'validation.facebookLink')}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#1877F2" />
                  <path d="M15.5 8H13.5C13.2 8 13 8.2 13 8.5V10H15.5L15.2 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.6 11.6 5.5 13.5 5.5H15.5V8Z" fill="white" />
                </svg>
              </Box>
            ),
          }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'linkedinLink', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.linkedinLink')}
          {...register('linkedinLink')}
          defaultValue=""
          placeholder="https://linkedin.com/in/yourprofile"
          disabled={loading}
          error={!!errors.linkedinLink}
          helperText={errors.linkedinLink && t((errors.linkedinLink as any).message || 'validation.linkedinLink')}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#0A66C2" />
                  <path d="M8.5 10H6.5V17.5H8.5V10ZM7.5 9C8.05 9 8.5 8.55 8.5 8C8.5 7.45 8.05 7 7.5 7C6.95 7 6.5 7.45 6.5 8C6.5 8.55 6.95 9 7.5 9ZM17.5 17.5H15.5V13.75C15.5 12.9 14.85 12.25 14 12.25C13.15 12.25 12.5 12.9 12.5 13.75V17.5H10.5V10H12.5V11.05C12.97 10.4 13.78 10 14.5 10C16.16 10 17.5 11.34 17.5 13V17.5Z" fill="white" />
                </svg>
              </Box>
            ),
          }}
          sx={darkFieldSx}
        />
      ),
    },
    {
      id: 'twitterLink', colXs: 12, colMd: 6,
      node: (
        <TextField
          fullWidth
          label={t('forms.aspirant.twitterLink')}
          {...register('twitterLink')}
          defaultValue=""
          placeholder="https://twitter.com/yourprofile"
          disabled={loading}
          error={!!errors.twitterLink}
          helperText={errors.twitterLink && t((errors.twitterLink as any).message || 'validation.twitterLink')}
          inputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#000000" />
                  <path d="M13.6 10.8L17.7 6H16.7L13.2 10.2L10.4 6H7L11.3 12.7L7 17.8H8L11.7 13.4L14.6 17.8H18L13.6 10.8ZM12.2 12.8L11.8 12.2L8.4 6.8H10L12.5 10.5L12.9 11.1L16.7 17.1H15L12.2 12.8Z" fill="white" />
                </svg>
              </Box>
            ),
          }}
          sx={darkFieldSx}
        />
      ),
    },
  ];

  return (
    <Box sx={{
      bgcolor: DARK, borderRadius: 2, overflow: 'hidden',
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(17,24,39,0.08)',
    }}>

      {/* Top colour bar */}
      <Box sx={{ display: 'flex', height: '5px' }}>
        {['#C8180A', '#253A9A', '#6B3A00'].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
      </Box>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Box sx={{
          px: { xs: 2.5, sm: 4 }, pt: 3.5, pb: 2.5,
          borderBottom: `1px solid ${cardBorder}`,
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(37,58,154,.28),rgba(245,168,0,.18))',
            border: `1.5px solid rgba(245,168,0,.35)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PersonAddIcon sx={{ color: GOLD, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: FF, fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.35rem' },
              color: textPrimary, lineHeight: 1.2,
            }}>
              {t('forms.aspirant.formTitle')}
            </Typography>
            <Typography sx={{ fontFamily: FF, fontSize: '0.9rem', color: textSecondary, mt: '2px' }}>
              {t('forms.aspirant.formSubtitle', { defaultValue: 'Fill in your candidate details' })}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* ── Form fields ── */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pt: 3, pb: 1 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2.5}>
            {fields.map(({ id, colXs, colMd, node }, idx) => (
              <React.Fragment key={id}>
                {/* {id === 'electionType' && (
                  <Grid item xs={12}>
                    <Alert
                      severity="info"
                      icon={<InfoOutlinedIcon sx={{ color: '#F5A800' }} />}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(245,168,0,0.08)' : 'rgba(245,168,0,0.06)',
                        border: `1px solid ${isDark ? 'rgba(245,168,0,0.2)' : 'rgba(245,168,0,0.25)'}`,
                        color: isDark ? '#FFCB00' : 'rgba(15,23,42,0.8)',
                        fontFamily: FF,
                        fontSize: '0.78rem',
                        '& .MuiAlert-message': { fontFamily: FF },
                      }}
                    >
                      {t('forms.aspirant.electionInfoMessage')}
                    </Alert>
                  </Grid>
                )} */}
                <Grid item xs={colXs} md={colMd}>
                  <motion.div variants={itemVariants}>
                    <Box sx={{
                      p: { xs: '10px 12px', sm: '12px 14px' }, borderRadius: '10px',
                      background: fieldWrapBg,
                      border: `1px solid ${fieldWrapBorder}`,
                      borderLeft: `3px solid ${FIELD_ACCENTS[idx] ?? GOLDD}`,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderLeftColor: GOLD },
                      '&:focus-within': { borderLeftColor: GOLD, background: 'rgba(245,168,0,0.03)' },
                    }}>
                      {node}
                    </Box>
                  </motion.div>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </motion.div>
      </Box>

      {/* ── Bottom bar ── */}
      <Box sx={{
        px: { xs: 2, sm: 4 }, py: 2.5, mt: 2,
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(17,24,39,0.02)',
        borderTop: `1px solid ${cardBorder}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap',
      }}>

        {(() => {
          const commonBtnSx = {
            fontFamily: FF,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '8px',
            height: 44,
            width: { xs: '100%', sm: 140 },
            minWidth: { xs: 'auto', sm: 140 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          } as const;

          return (
            <Stack direction="row" spacing={1.5} sx={{ ml: 'auto', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                  sx={{
                    ...commonBtnSx,
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.22)',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)',
                  }}
                >
                  {t('common.home')}
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                disabled={loading}
                sx={{
                  ...commonBtnSx,
                  fontSize: '0.82rem',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.22)',
                  color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.72)',
                  '&:hover': { borderColor: GOLDD, color: GOLD, bgcolor: 'rgba(245,168,0,0.06)' },
                }}
              >
                {t('forms.aspirant.navigation.back')}
              </Button>

              <Button
                variant="contained"
                endIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <ArrowForwardIcon />}
                onClick={onNext}
                disabled={loading}
                sx={{
                  ...commonBtnSx,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  px: { xs: 2, sm: 0 },
                  background: `linear-gradient(135deg, #C8180A 0%, #F5A800 100%)`,
                  color: '#fff',
                  boxShadow: `0 4px 20px rgba(200,24,10,0.35)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, #e01c0c 0%, #ffb800 100%)`,
                    boxShadow: `0 6px 24px rgba(200,24,10,0.55)`,
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0px)' },
                  transition: 'all 0.2s ease',
                  '&.Mui-disabled': {
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.38)',
                    boxShadow: 'none'
                  },
                }}
              >
                {t('forms.aspirant.navigation.next')}
              </Button>
            </Stack>
          );
        })()}
      </Box>

      {/* Bottom colour bar */}
      <Box sx={{ display: 'flex', height: '3px' }}>
        {['#6B3A00', '#253A9A', '#C8180A'].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
      </Box>
    </Box>
  );
};

export default CandidateInformationStep;
