import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  SkipNext as SkipNextIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
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
} from "../services/electionService";
import { BRAND } from "../theme";
import prajakeeyaLogo from "../assets/images/prajakeeya.png";

type StepKey =
  | "electionType"
  | "constituency"
  | "municipality"
  | "cityWard"
  | "gpState"
  | "gpDistrict"
  | "gpTaluk"
  | "gpGram"
  | "gpVillage";

interface OnboardingAnswers {
  election?: Election;
  constituency?: Constituency;
  municipality?: { id: number; name: string; state: string };
  cityWard?: Constituency;
  gpState?: string;
  gpDistrict?: string;
  gpTaluk?: string;
  gpGram?: string;
  gpVillage?: GPVillage;
}

const STORAGE_KEY = "__USER_LOCATION_ANSWERS__";

const STEP_META: Record<
  StepKey,
  { icon: string; title: string; question: string; placeholder: string }
> = {
  electionType: {
    icon: "🗳️",
    title: "Election Type",
    question: "Which election are you setting up?",
    placeholder: "Select election type",
  },
  constituency: {
    icon: "📍",
    title: "Constituency",
    question: "Which constituency does your area belong to?",
    placeholder: "Select your constituency",
  },
  municipality: {
    icon: "🏙️",
    title: "Municipal Corporation",
    question: "Which Municipal Corporation are you in?",
    placeholder: "Select your Municipal Corporation",
  },
  cityWard: {
    icon: "🏘️",
    title: "City Corporation Ward",
    question: "Which ward do you belong to?",
    placeholder: "Select your ward",
  },
  gpState: {
    icon: "🗺️",
    title: "State",
    question: "Which state is your village in?",
    placeholder: "Select your state",
  },
  gpDistrict: {
    icon: "🌐",
    title: "District",
    question: "Which district is your village under?",
    placeholder: "Select your district",
  },
  gpTaluk: {
    icon: "🏞️",
    title: "Taluk",
    question: "Which taluk does your village belong to?",
    placeholder: "Select your taluk",
  },
  gpGram: {
    icon: "🌿",
    title: "Gram Panchayat",
    question: "Which Gram Panchayat is your village under?",
    placeholder: "Select your Gram Panchayat",
  },
  gpVillage: {
    icon: "🏡",
    title: "Village",
    question: "Which village do you live in?",
    placeholder: "Select your village",
  },
};

const UserConstituencyOnboardingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ─── Step engine ────────────────────────────────────────────────
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  // ─── Source data ────────────────────────────────────────────────
  const [elections, setElections] = useState<Election[]>([]);
  const [loadingElections, setLoadingElections] = useState(false);

  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);

  const [municipalities, setMunicipalities] = useState<
    { id: number; name: string; state: string }[]
  >([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  const [cityWards, setCityWards] = useState<Constituency[]>([]);
  const [loadingCityWards, setLoadingCityWards] = useState(false);

  const [gpStates, setGpStates] = useState<string[]>([]);
  const [gpDistricts, setGpDistricts] = useState<string[]>([]);
  const [gpTaluks, setGpTaluks] = useState<string[]>([]);
  const [gpGrams, setGpGrams] = useState<string[]>([]);
  const [gpVillages, setGpVillages] = useState<GPVillage[]>([]);
  const [loadingGp, setLoadingGp] = useState(false);

  // ─── Derive the dynamic step list from the chosen election ──────
  const steps: StepKey[] = useMemo(() => {
    const electionType = answers.election?.type;
    if (!electionType) return ["electionType"];
    if (electionType === "municipal_corporation") {
      return ["electionType", "municipality", "cityWard"];
    }
    if (electionType === "gram_panchayat") {
      return [
        "electionType",
        "gpState",
        "gpDistrict",
        "gpTaluk",
        "gpGram",
        "gpVillage",
      ];
    }
    return ["electionType", "constituency"];
  }, [answers.election?.type]);

  const totalSteps = steps.length;
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === totalSteps - 1;
  const progress = ((stepIdx + 1) / totalSteps) * 100;

  // ─── Load initial elections ────────────────────────────────────
  useEffect(() => {
    setLoadingElections(true);
    fetchElections()
      .then((resp) => {
        const data = Array.isArray(resp.data) ? resp.data : [];
        setElections(data);
      })
      .catch(() => {
        // ignore; user can still skip
      })
      .finally(() => setLoadingElections(false));
  }, []);

  // ─── React to election type change ──────────────────────────────
  useEffect(() => {
    const election = answers.election;
    if (!election) {
      setConstituencies([]);
      setMunicipalities([]);
      setCityWards([]);
      setGpStates([]);
      return;
    }
    if (election.type === "municipal_corporation") {
      setLoadingMunicipalities(true);
      fetchMunicipalities()
        .then((resp) =>
          setMunicipalities(Array.isArray(resp.data) ? resp.data : []),
        )
        .catch(() => setMunicipalities([]))
        .finally(() => setLoadingMunicipalities(false));
      return;
    }
    if (election.type === "gram_panchayat") {
      setLoadingGp(true);
      fetchGPStates()
        .then((resp) => setGpStates(Array.isArray(resp.data) ? resp.data : []))
        .catch(() => setGpStates([]))
        .finally(() => setLoadingGp(false));
      return;
    }
    setLoadingConstituencies(true);
    fetchConstituencies(election.type)
      .then((resp) => setConstituencies(resp.data?.constituencies ?? []))
      .catch(() => setConstituencies([]))
      .finally(() => setLoadingConstituencies(false));
  }, [answers.election]);

  // ─── React to municipality change ───────────────────────────────
  useEffect(() => {
    if (!answers.municipality) {
      setCityWards([]);
      return;
    }
    setLoadingCityWards(true);
    fetchConstituenciesByScope(answers.municipality.name)
      .then((resp) => setCityWards(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setCityWards([]))
      .finally(() => setLoadingCityWards(false));
  }, [answers.municipality]);

  // ─── GP cascading fetches ───────────────────────────────────────
  useEffect(() => {
    if (!answers.gpState) {
      setGpDistricts([]);
      return;
    }
    setLoadingGp(true);
    fetchGPDistricts(answers.gpState)
      .then((resp) =>
        setGpDistricts(Array.isArray(resp.data) ? resp.data : []),
      )
      .catch(() => setGpDistricts([]))
      .finally(() => setLoadingGp(false));
  }, [answers.gpState]);

  useEffect(() => {
    if (!answers.gpState || !answers.gpDistrict) {
      setGpTaluks([]);
      return;
    }
    setLoadingGp(true);
    fetchGPTaluks(answers.gpState, answers.gpDistrict)
      .then((resp) => setGpTaluks(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setGpTaluks([]))
      .finally(() => setLoadingGp(false));
  }, [answers.gpState, answers.gpDistrict]);

  useEffect(() => {
    if (!answers.gpState || !answers.gpDistrict || !answers.gpTaluk) {
      setGpGrams([]);
      return;
    }
    setLoadingGp(true);
    fetchGPGrams(answers.gpState, answers.gpDistrict, answers.gpTaluk)
      .then((resp) => setGpGrams(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setGpGrams([]))
      .finally(() => setLoadingGp(false));
  }, [answers.gpState, answers.gpDistrict, answers.gpTaluk]);

  useEffect(() => {
    if (
      !answers.gpState ||
      !answers.gpDistrict ||
      !answers.gpTaluk ||
      !answers.gpGram
    ) {
      setGpVillages([]);
      return;
    }
    setLoadingGp(true);
    fetchGPVillages(
      answers.gpState,
      answers.gpDistrict,
      answers.gpTaluk,
      answers.gpGram,
    )
      .then((resp) => setGpVillages(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => setGpVillages([]))
      .finally(() => setLoadingGp(false));
  }, [answers.gpState, answers.gpDistrict, answers.gpTaluk, answers.gpGram]);

  // ─── Per-step has-value check ───────────────────────────────────
  const stepHasValue = (step: StepKey) => {
    switch (step) {
      case "electionType":
        return !!answers.election;
      case "constituency":
        return !!answers.constituency;
      case "municipality":
        return !!answers.municipality;
      case "cityWard":
        return !!answers.cityWard;
      case "gpState":
        return !!answers.gpState;
      case "gpDistrict":
        return !!answers.gpDistrict;
      case "gpTaluk":
        return !!answers.gpTaluk;
      case "gpGram":
        return !!answers.gpGram;
      case "gpVillage":
        return !!answers.gpVillage;
    }
  };

  // ─── Finish + step controls ─────────────────────────────────────
  const finish = (finalAnswers: OnboardingAnswers) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalAnswers));
    } catch {
      // ignore storage failures
    }
    navigate("/user/dashboard", { replace: true });
  };

  const handleNext = () => {
    if (!stepHasValue(currentStep)) return;
    if (isLast) {
      finish(answers);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const handleSkip = () => {
    // Clear answer for the current step and any downstream answers
    const next: OnboardingAnswers = { ...answers };
    switch (currentStep) {
      case "electionType":
        // Skip all => finish with empty
        finish({});
        return;
      case "constituency":
        delete next.constituency;
        break;
      case "municipality":
        delete next.municipality;
        delete next.cityWard;
        break;
      case "cityWard":
        delete next.cityWard;
        break;
      case "gpState":
        delete next.gpState;
        delete next.gpDistrict;
        delete next.gpTaluk;
        delete next.gpGram;
        delete next.gpVillage;
        break;
      case "gpDistrict":
        delete next.gpDistrict;
        delete next.gpTaluk;
        delete next.gpGram;
        delete next.gpVillage;
        break;
      case "gpTaluk":
        delete next.gpTaluk;
        delete next.gpGram;
        delete next.gpVillage;
        break;
      case "gpGram":
        delete next.gpGram;
        delete next.gpVillage;
        break;
      case "gpVillage":
        delete next.gpVillage;
        break;
    }
    setAnswers(next);
    if (isLast) finish(next);
    else setStepIdx(stepIdx + 1);
  };

  const handleBack = () => {
    if (stepIdx === 0) return;
    setStepIdx(stepIdx - 1);
  };

  // ─── Field styling ──────────────────────────────────────────────
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.92)",
      "& fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.18)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(245,168,0,0.45)",
      },
      "&.Mui-focused fieldset": {
        borderColor: BRAND.yellow,
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.62)",
    },
    "& .MuiInputLabel-root.Mui-focused": { color: BRAND.yellow },
    "& .MuiInputBase-input": {
      color: isDark ? "#fff" : "rgba(15,23,42,0.94)",
      fontSize: "1rem",
      py: 1.3,
    },
  };

  const listboxSx = {
    bgcolor: isDark ? "#1a1515" : "#fff",
    "& .MuiAutocomplete-option": {
      color: isDark ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.9)",
      fontSize: "0.95rem",
      '&[aria-selected="true"]': {
        bgcolor: isDark ? "rgba(245,168,0,0.18)" : "rgba(245,168,0,0.14)",
      },
      "&.Mui-focused": {
        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.04)",
      },
    },
  };

  // ─── Render the input for the current step ──────────────────────
  const renderField = () => {
    switch (currentStep) {
      case "electionType":
        return (
          <TextField
            select
            fullWidth
            label={STEP_META.electionType.placeholder}
            value={answers.election?.id ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const el = elections.find((x) => x.id === id) ?? undefined;
              setAnswers({ election: el });
            }}
            disabled={loadingElections}
            sx={fieldSx}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: isDark ? "#1a1515" : "#fff",
                    "& .MuiMenuItem-root": {
                      color: isDark
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(15,23,42,0.9)",
                    },
                    "& .MuiMenuItem-root.Mui-selected": {
                      bgcolor: isDark
                        ? "rgba(245,168,0,0.18)"
                        : "rgba(245,168,0,0.14)",
                      color: BRAND.yellow,
                    },
                  },
                },
              },
            }}
          >
            {elections.map((el) => (
              <MenuItem key={el.id} value={el.id}>
                {el.name}
              </MenuItem>
            ))}
          </TextField>
        );
      case "constituency":
        return (
          <Autocomplete
            options={constituencies}
            getOptionLabel={(o) =>
              `${o.number ? `${o.number} - ` : ""}${o.name}`
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={answers.constituency ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({ ...p, constituency: v ?? undefined }))
            }
            loading={loadingConstituencies}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.constituency.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "municipality":
        return (
          <Autocomplete
            options={municipalities}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={answers.municipality ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({
                ...p,
                municipality: v ?? undefined,
                cityWard: undefined,
              }))
            }
            loading={loadingMunicipalities}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.municipality.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "cityWard":
        return (
          <Autocomplete
            options={cityWards}
            getOptionLabel={(o) =>
              `${o.number ? `${o.number} - ` : ""}${o.name}`
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={answers.cityWard ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({ ...p, cityWard: v ?? undefined }))
            }
            loading={loadingCityWards}
            disabled={!answers.municipality}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.cityWard.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "gpState":
        return (
          <Autocomplete
            options={gpStates}
            value={answers.gpState ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({
                ...p,
                gpState: v ?? undefined,
                gpDistrict: undefined,
                gpTaluk: undefined,
                gpGram: undefined,
                gpVillage: undefined,
              }))
            }
            loading={loadingGp}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.gpState.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "gpDistrict":
        return (
          <Autocomplete
            options={gpDistricts}
            value={answers.gpDistrict ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({
                ...p,
                gpDistrict: v ?? undefined,
                gpTaluk: undefined,
                gpGram: undefined,
                gpVillage: undefined,
              }))
            }
            loading={loadingGp}
            disabled={!answers.gpState}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.gpDistrict.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "gpTaluk":
        return (
          <Autocomplete
            options={gpTaluks}
            value={answers.gpTaluk ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({
                ...p,
                gpTaluk: v ?? undefined,
                gpGram: undefined,
                gpVillage: undefined,
              }))
            }
            loading={loadingGp}
            disabled={!answers.gpDistrict}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.gpTaluk.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "gpGram":
        return (
          <Autocomplete
            options={gpGrams}
            value={answers.gpGram ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({
                ...p,
                gpGram: v ?? undefined,
                gpVillage: undefined,
              }))
            }
            loading={loadingGp}
            disabled={!answers.gpTaluk}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.gpGram.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
      case "gpVillage":
        return (
          <Autocomplete
            options={gpVillages}
            getOptionLabel={(o) => o.villageName}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={answers.gpVillage ?? null}
            onChange={(_, v) =>
              setAnswers((p) => ({ ...p, gpVillage: v ?? undefined }))
            }
            loading={loadingGp}
            disabled={!answers.gpGram}
            ListboxProps={{ sx: listboxSx }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={STEP_META.gpVillage.placeholder}
                sx={fieldSx}
              />
            )}
          />
        );
    }
  };

  const stepLoading =
    (currentStep === "electionType" && loadingElections) ||
    (currentStep === "constituency" && loadingConstituencies) ||
    (currentStep === "municipality" && loadingMunicipalities) ||
    (currentStep === "cityWard" && loadingCityWards) ||
    (currentStep.startsWith("gp") && loadingGp);

  const meta = STEP_META[currentStep];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, #1a0a0a 0%, #0a0505 55%, #000 100%)"
          : "radial-gradient(ellipse at 50% 0%, #fff8ee 0%, #f5efe2 55%, #ece4d2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 5 },
      }}
    >
      {/* Brand strip */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{ mb: { xs: 3, sm: 5 } }}
      >
        <Box
          component="img"
          src={prajakeeyaLogo}
          alt="Prajaakeeya"
          sx={{ height: 36, objectFit: "contain" }}
        />
        <Typography
          sx={{
            fontFamily: '"Bebas Neue", "Impact", sans-serif',
            fontSize: { xs: "1.05rem", sm: "1.2rem" },
            letterSpacing: "0.08em",
            background:
              "linear-gradient(135deg, #E02010 0%, #FFCB00 45%, #F5A800 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PRAJAAKEEYA
        </Typography>
      </Stack>

      {/* Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          background: isDark
            ? "linear-gradient(160deg, rgba(28,16,16,0.92) 0%, rgba(19,11,11,0.96) 100%)"
            : "rgba(255,255,255,0.92)",
          border: isDark
            ? "1px solid rgba(245,168,0,0.18)"
            : "1px solid rgba(245,168,0,0.32)",
          borderRadius: 4,
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.55)"
            : "0 16px 48px rgba(17,24,39,0.10)",
          backdropFilter: "blur(12px)",
          p: { xs: 3, sm: 5 },
        }}
      >
        {/* Progress header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.2 }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: BRAND.yellow,
              textTransform: "uppercase",
            }}
          >
            Step {stepIdx + 1} of {totalSteps}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: isDark
                ? "rgba(255,255,255,0.45)"
                : "rgba(17,24,39,0.55)",
            }}
          >
            {Math.round(progress)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 4,
            borderRadius: 2,
            height: 6,
            bgcolor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(17,24,39,0.08)",
            "& .MuiLinearProgress-bar": {
              background:
                "linear-gradient(90deg, #F5A800 0%, #E02010 100%)",
              borderRadius: 2,
            },
          }}
        />

        {/* Question + field */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  background:
                    "linear-gradient(135deg, rgba(245,168,0,0.18) 0%, rgba(224,32,16,0.12) 100%)",
                  border: "1px solid rgba(245,168,0,0.35)",
                }}
              >
                {meta.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: "1.2rem", sm: "1.45rem" },
                  fontWeight: 800,
                  color: isDark ? "#fff" : "rgba(17,24,39,0.92)",
                  letterSpacing: "-0.01em",
                }}
              >
                {meta.title}
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                color: isDark
                  ? "rgba(255,255,255,0.65)"
                  : "rgba(17,24,39,0.65)",
                mb: 3,
                lineHeight: 1.55,
              }}
            >
              {meta.question}
            </Typography>

            <Box sx={{ mb: 1.5 }}>{renderField()}</Box>

            {stepLoading && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CircularProgress size={14} sx={{ color: BRAND.yellow }} />
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(17,24,39,0.55)",
                  }}
                >
                  Loading options…
                </Typography>
              </Stack>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 4 }}
        >
          {stepIdx > 0 && (
            <Button
              variant="text"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: isDark
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(17,24,39,0.6)",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(17,24,39,0.04)",
                },
              }}
            >
              Back
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            onClick={handleSkip}
            startIcon={<SkipNextIcon />}
            sx={{
              py: 1.25,
              px: 3,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem",
              borderColor: isDark
                ? "rgba(255,255,255,0.18)"
                : "rgba(17,24,39,0.2)",
              color: isDark
                ? "rgba(255,255,255,0.75)"
                : "rgba(17,24,39,0.72)",
              "&:hover": {
                borderColor: isDark
                  ? "rgba(255,255,255,0.32)"
                  : "rgba(17,24,39,0.38)",
                bgcolor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(17,24,39,0.04)",
              },
            }}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!stepHasValue(currentStep)}
            endIcon={isLast ? <CheckCircleIcon /> : <ArrowForwardIcon />}
            sx={{
              py: 1.25,
              px: 4,
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: "none",
              fontSize: "0.95rem",
              color: "#fff",
              background:
                "linear-gradient(135deg, #C8180A 0%, #E02010 100%)",
              boxShadow: "0 6px 20px rgba(200,24,10,0.35)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #E02010 0%, #C8180A 100%)",
                boxShadow: "0 8px 26px rgba(200,24,10,0.5)",
              },
              "&.Mui-disabled": {
                background: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(17,24,39,0.08)",
                color: isDark
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(17,24,39,0.35)",
                boxShadow: "none",
              },
            }}
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default UserConstituencyOnboardingPage;
