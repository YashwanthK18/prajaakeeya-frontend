import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Grid,
    Stack,
    Card,
    CardContent,
    Avatar,
    Typography,
    Chip,
    Divider,
    Button,
    IconButton,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert,
    useTheme,
    Container
} from '@mui/material';
import {
    Chat as ChatIcon,
    VideoCall as VideoCallIcon,
    Link as MeetIcon,
    Description as DescriptionIcon,
    Verified as VerifiedIcon,
    FileDownload as FileDownloadIcon,
    ExpandMore as ExpandMoreIcon,
    AccessTime as AccessTimeIcon,
    Schedule as ScheduleIcon,
    Send as SendIcon
} from '@mui/icons-material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import useAuthStore from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { getAspirantMessages, postUserChatMessage, AspirantChatMessageDto } from '../services/aspirantChatService';
import { getAspirantById, fetchWardAspirantsByNumber, bookAspirant, getAspirantVisits, respondVisit } from '../services/aspirantService';
import apiClient from '../services/apiClient';
import PhoneRevealCard from '../components/PhoneRevealCard';
import { BRAND } from '../theme';

type DocumentType = { name: string; verified: boolean; href?: string; required?: boolean };

interface Candidate {
    id: number;
    name: string;
    wardNo?: number | string;
    wardName?: string;
    assembly?: string;
    state?: string;
    parliamentary?: string;
    party?: string;
    status?: string[]; // e.g. ['Verified', 'SOP']
    age?: number;
    gender?: string;
    education?: string;
    occupation?: string;
    address?: string;
    yearsOfService?: number;
    about?: string;
    focusAreas?: string[];
    documents?: DocumentType[];
    interviewActive?: boolean;
    interviewDate?: string;
    meetings?: any[];
    selfieUrl?: string;
    phone?: string;
    electionName?: string;
    constituencyName?: string;
    instagramLink?: string | null;
    facebookLink?: string | null;
    linkedinLink?: string | null;
}

const normalizeUrl = (url: string) => url && !/^https?:\/\//i.test(url.trim()) ? `https://${url.trim()}` : url;

const dummyOther: Candidate[] = [];

const DocumentCard: React.FC<{ doc: DocumentType; onView?: (d: DocumentType) => void }> = ({ doc, onView }) => {
    const { t } = useTranslation();
    const localTr = (key: string, fallback: string) => {
        const res = t(key);
        return typeof res === 'string' && res === key ? fallback : (res || fallback);
    };
    return (
        <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.paper', borderColor: 'rgba(245,168,0,0.2)' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ width: 34, height: 34, borderRadius: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(245,168,0,0.14)', color: '#f5a800' }}>
                    <DescriptionIcon />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{doc.name}</Typography>
                    {doc.verified && (
                        <Typography variant="caption" color="success.main">
                            {localTr('pages.candidateDetails.labels.verified', 'Verified')}
                        </Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title={localTr('pages.candidateDetails.labels.view', 'View')}>
                        <IconButton size="small" onClick={() => onView ? onView(doc) : window.open(doc.href || '#', '_blank')}>
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
        </Paper>
    );
};

const CandidateDetailsPage: React.FC = () => {
    const { t } = useTranslation();
    const tr = (key: string, fallback: string) => {
        const res = t(key);
        return typeof res === 'string' && res === key ? fallback : (res || fallback);
    };
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [docViewOpen, setDocViewOpen] = useState(false);
    const [docViewUrl, setDocViewUrl] = useState<string | undefined>(undefined);
    const [docViewTitle, setDocViewTitle] = useState<string | undefined>(undefined);
    // Render all sections in a single-page layout (no tabs)
    // Chat is now a separate page; we navigate to it instead of opening a dialog

    // Check if candidate is passed via state (navigation)
    const stateCandidate = (location.state as any)?.candidate as Candidate | undefined;

    const [apiCandidate, setApiCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(!stateCandidate); // Don't show loading if we have state candidate
    const [meetings, setMeetings] = useState<any[]>([]);
    const [meetingNotesOpen, setMeetingNotesOpen] = useState(false);
    const [meetingNotesContent, setMeetingNotesContent] = useState<string | undefined>(undefined);
    const [meetingNotesTitle, setMeetingNotesTitle] = useState<string | undefined>(undefined);
    const [directPost, setDirectPost] = useState<any | null>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [attendErrorOpen, setAttendErrorOpen] = useState(false);
    const [attendErrorMsg, setAttendErrorMsg] = useState('');
    const [interactionMsg, setInteractionMsg] = useState<string | null>(null);
    const [interactionOpen, setInteractionOpen] = useState(false);

    // Candidate data: use API data first, then state-passed data, then fallback
    const candidate: Candidate = apiCandidate ?? stateCandidate ?? {
        id: Number(params.id || 1),
        name: 'Unknown Candidate',
        wardNo: undefined,
        wardName: undefined,
        assembly: undefined,
        party: undefined,
        status: undefined,
        age: undefined,
        gender: undefined,
        education: undefined,
        occupation: undefined,
        about: 'No information available.',
        documents: []
    };

    // Localized display for party: translate 'Independent' when appropriate
    const displayParty = (candidate.party && String(candidate.party).toLowerCase() !== 'independent')
        ? candidate.party
        : t('forms.aspirant.defaults.party');

    const otherAspirants = dummyOther;
    const [otherAspirantsState, setOtherAspirantsState] = useState<Candidate[]>([]);

    useEffect(() => {
        const loadWardAspirants = async () => {
            const wardNo = candidate?.wardNo;
            if (!wardNo) return;
            try {
                const resp = await fetchWardAspirantsByNumber(String(wardNo));
                const list = Array.isArray(resp?.data) ? resp.data : [];
                const mapped: Candidate[] = list
                    .filter((a: any) => a.id !== candidate.id)
                    .map((a: any) => ({
                        id: a.id,
                        name: a.name,
                        wardNo: a.ward?.number ?? a.wardId ?? wardNo,
                        wardName: a.ward?.name ?? '',
                        selfieUrl: a.selfieUrl ?? a.recentPhotoUrl ?? null
                    }));
                setOtherAspirantsState(mapped);
            } catch (e) {
                console.warn('Failed to fetch ward aspirants', e);
            }
        };
        loadWardAspirants();
    }, [candidate?.wardNo, candidate?.id]);

    const loggedIn = !!user;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const FF = "'Baloo 2', sans-serif";
    const sectionCardSx = {
        borderRadius: 3,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.12)'}`,
        background: isDark
            ? 'linear-gradient(160deg, rgba(28,18,18,0.96) 0%, rgba(20,14,14,0.96) 100%)'
            : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.38)' : '0 10px 24px rgba(17,24,39,0.08)',
        overflow: 'hidden'
    } as const;
    const sectionTitleSx = {
        fontWeight: 800,
        fontFamily: FF,
        letterSpacing: '-0.01em',
        color: isDark ? '#FFD27A' : '#B45309'
    } as const;
    const infoTileSx = {
        p: 1.2,
        borderRadius: 2,
        bgcolor: isDark
            ? 'linear-gradient(135deg, rgba(37,58,154,0.18) 0%, rgba(245,168,0,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(37,58,154,0.06) 0%, rgba(245,168,0,0.05) 100%)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(17,24,39,0.1)'}`,
        borderLeft: `3px solid ${isDark ? BRAND.yellow : BRAND.saffron}`
    } as const;
    const profileLabelSx = {
        fontWeight: 700,
        fontFamily: FF,
        color: isDark ? 'rgba(255,255,255,0.68)' : 'rgba(17,24,39,0.62)',
        fontSize: '0.78rem',
        letterSpacing: '.02em'
    } as const;
    const profileValueSx = {
        fontFamily: FF,
        color: isDark ? '#FFFFFF' : '#0f172a',
        fontWeight: 700,
        fontSize: '1rem'
    } as const;

    // Fetch aspirant data from API
    useEffect(() => {
        const fetchAspirant = async () => {
            const aspirantId = Number(params.id);
            if (!aspirantId || isNaN(aspirantId)) {
                setLoading(false);
                return;
            }

            const storageKey = `aspirant_${aspirantId}`;
            try {
                const cached = localStorage.getItem(storageKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed?.candidate) {
                        setApiCandidate(parsed.candidate);
                    }
                    if (Array.isArray(parsed?.meetings)) setMeetings(parsed.meetings);
                }
            } catch (e) {
                // ignore localStorage parse errors
            }

            try {
                const resp = await getAspirantById(aspirantId);
                const data = resp?.data;
                if (data) {
                    // Defensive mapping: backend may return ward fields with different keys
                    const ward = data.ward || {};
                    const wardNumber = ward?.number ?? data.wardNo ?? data.wardNumber ?? data.wardId;
                    const wardName = ward?.name ?? data.wardName ?? data.ward_name;
                    const assembly = ward?.assembly ?? data.assembly ?? data.assemblyName;
                    const stateName = ward?.state ?? data.state ?? data.stateName;
                    const parliamentary = ward?.parliamentary ?? data.parliamentary ?? data.parliamentaryName;

                    // Update the candidate with API data
                    // normalize and sort meetings: upcoming (future) ascending, then past descending
                    const rawMeetings = Array.isArray(data.meetings) ? data.meetings : [];
                    const now = Date.now();
                    const upcoming = rawMeetings.filter((m: any) => Number(m.scheduledAt) > now).sort((a: any, b: any) => Number(a.scheduledAt) - Number(b.scheduledAt));
                    const past = rawMeetings.filter((m: any) => Number(m.scheduledAt) <= now).sort((a: any, b: any) => Number(b.scheduledAt) - Number(a.scheduledAt));
                    const meetingsSorted = [...upcoming, ...past];

                    const updatedCandidate: Candidate = {
                        id: data.id,
                        name: data.name,
                        wardNo: wardNumber,
                        wardName: wardName,
                        assembly: assembly,
                        state: stateName,
                        parliamentary: parliamentary,
                        party: data.party,
                        status: [data.status === 'approved' ? 'Verified' : data.status],
                        age: data.age,
                        gender: data.gender ?? data.sex ?? undefined,
                        education: data.education,
                        occupation: data.occupation,
                        about: data.manifesto ?? data.about,
                        selfieUrl: data.selfieUrl ?? data.recentPhotoUrl,
                        phone: data.phone,
                        documents: [
                            { name: 'EPIC Card (Front)', verified: (data.epicCardStatus === 'verified') || false, href: data.epicCardUrl ?? null },
                            { name: 'EPIC Card (Back)', verified: (data.epicCardBackStatus === 'verified') || false, href: data.epicCardBackUrl ?? null },
                        ],
                        interviewActive: meetingsSorted.length > 0,
                        interviewDate: upcoming.length > 0
                            ? new Date(Number(upcoming[0].scheduledAt)).toISOString()
                            : meetingsSorted.length > 0
                                ? new Date(Number(meetingsSorted[0].scheduledAt)).toISOString()
                                : undefined,
                        meetings: meetingsSorted,
                        electionName: data.electionName ?? undefined,
                        constituencyName: data.constituencyName ?? undefined,
                        instagramLink: data.instagramLink ?? null,
                        facebookLink: data.facebookLink ?? null,
                        linkedinLink: data.linkedinLink ?? null,
                    };
                    // include address if provided by API
                    if (data.address) {
                        (updatedCandidate as any).address = data.address;
                    }
                    // Store fetched candidate and meetings in state so UI updates
                    setApiCandidate(updatedCandidate);
                    setMeetings(meetingsSorted);
                    // Normalize direct meet post if present
                    const rawPost = data.directMeetPost || data.direct_meet_post || data.post || data.directPost || null;
                    if (rawPost) {
                        const normalized = {
                            id: rawPost.id ?? 'direct-post',
                            content: rawPost.content ?? rawPost.message ?? rawPost.text ?? String(rawPost),
                            likes: Number(rawPost.likes) || 0,
                            liked: false
                        };
                        setDirectPost(normalized);
                    }
                    // Fetch visits for this aspirant
                    try {
                        const vresp = await getAspirantVisits(aspirantId);
                        const vdata = Array.isArray(vresp?.data) ? vresp.data : [];
                        // sort ascending by scheduledAt and add local liked flag
                        const visitsSorted = vdata
                            .slice()
                            .sort((a: any, b: any) => Number(a.scheduledAt) - Number(b.scheduledAt))
                            .map((v: any) => ({ ...v, liked: false }));
                        setVisits(visitsSorted);
                    } catch (e) {
                        console.warn('Failed to fetch aspirant visits', e);
                    }
                    try {
                        localStorage.setItem(storageKey, JSON.stringify({ candidate: updatedCandidate, meetings: meetingsSorted }));
                    } catch (e) {
                        // ignore localStorage write errors
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Failed to fetch aspirant:', err);
                setLoading(false);
            }
        };
        fetchAspirant();
    }, [params.id]);

    const handleViewDoc = (d?: DocumentType) => {
        if (!d || !d.href) return;
        setDocViewUrl(d.href);
        setDocViewTitle(d.name);
        setDocViewOpen(true);
    };

    // Also load aspirant ward meetings on mount / when candidate changes
    useEffect(() => {
        let cancelled = false;
        const loadMyMeetings = async () => {
            try {
                const resp = await apiClient.get('/aspirant-ward-meetings/my');
                const data = Array.isArray(resp?.data) ? resp.data : [];
                if (cancelled) return;
                if (data.length === 0) return;

                // Merge with existing meetings by id
                const existing = Array.isArray(meetings) ? meetings : [];
                const map: Record<string | number, any> = {};
                existing.forEach((m: any) => { if (m && (m.id ?? null) != null) map[m.id] = m; });
                data.forEach((m: any) => { if (m && (m.id ?? null) != null) map[m.id] = m; });
                const merged = Object.values(map);

                // sort: upcoming (future) ascending, then past descending
                const now = Date.now();
                const upcoming = merged.filter((m: any) => Number(m.scheduledAt) > now).sort((a: any, b: any) => Number(a.scheduledAt) - Number(b.scheduledAt));
                const past = merged.filter((m: any) => Number(m.scheduledAt) <= now).sort((a: any, b: any) => Number(b.scheduledAt) - Number(a.scheduledAt));
                const sorted = [...upcoming, ...past];
                setMeetings(sorted);
            } catch (e) {
                console.warn('Failed to fetch aspirant ward meetings', e);
            }
        };
        void loadMyMeetings();
        return () => { cancelled = true; };
    }, [/* run on mount/candidate change */]);




    const handleOpenChat = async () => {
        try {
            // Track chat interaction
            const resp = await apiClient.post('/users/track/chat', { aspirantId: candidate.id });
            const returnedUser = resp?.data?.user ?? null;
            const msg = resp?.data?.message ?? resp?.data?.user?.lastInteractionMessage ?? null;
            if (msg) {
                setInteractionMsg(String(msg));
                setInteractionOpen(true);
            }
            // Update user's isChat flag in auth store (prefer server user if returned)
            const token = useAuthStore.getState().token;
            if (returnedUser && token) {
                useAuthStore.getState().setAuth(token, returnedUser as any);
            } else if (user) {
                const updatedUser = { ...user, isChat: true };
                if (token) useAuthStore.getState().setAuth(token, updatedUser as any);
            }
            // Refresh profile from API so changes persist without manual reload
            try {
                void useAuthStore.getState().fetchProfile();
            } catch (e) {
                console.warn('[track] fetchProfile failed', e);
            }
        } catch (err) {
            console.error('Failed to track chat:', err);
            // Continue to chat page even if tracking fails
        }
        // navigate to the chat page as a full page experience
        navigate(`/user/chat/${candidate.id}`, { state: { candidate } });
    };

    const handleJoinMeeting = async (meetingLink: string) => {
        try {
            // Track meeting interaction
            const resp = await apiClient.post('/users/track/meeting', { aspirantId: candidate.id });
            const returnedUser = resp?.data?.user ?? null;
            const msg = resp?.data?.message ?? resp?.data?.user?.lastInteractionMessage ?? null;
            if (msg) {
                setInteractionMsg(String(msg));
                setInteractionOpen(true);
            }
            const token = useAuthStore.getState().token;
            if (returnedUser && token) {
                useAuthStore.getState().setAuth(token, returnedUser as any);
            } else if (user) {
                const updatedUser = { ...user, isMeeting: true };
                if (token) useAuthStore.getState().setAuth(token, updatedUser as any);
            }
            try {
                void useAuthStore.getState().fetchProfile();
            } catch (e) {
                console.warn('[track] fetchProfile failed', e);
            }
        } catch (err) {
            console.error('Failed to track meeting:', err);
            // Continue to open meeting link even if tracking fails
        }
        // Open meeting link — fall back to same-window nav in iOS standalone /
        // wrapped WebView, where window.open('_blank') silently no-ops and
        // gives a blank page (Instagram links were the common symptom).
        const isStandalone =
            window.matchMedia?.('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true ||
            !!(window as any).ReactNativeWebView;
        if (isStandalone) window.location.href = meetingLink;
        else window.open(meetingLink, '_blank');
    };

    const handleDirectMeet = async () => {
        try {
            // Track direct meet interaction
            const resp = await apiClient.post('/users/track/direct-meet', { aspirantId: candidate.id });
            const returnedUser = resp?.data?.user ?? null;
            const msg = resp?.data?.message ?? resp?.data?.user?.lastInteractionMessage ?? null;
            if (msg) {
                setInteractionMsg(String(msg));
                setInteractionOpen(true);
            }
            const token = useAuthStore.getState().token;
            if (returnedUser && token) {
                useAuthStore.getState().setAuth(token, returnedUser as any);
            } else if (user) {
                const updatedUser = { ...user, isDirectMeet: true };
                if (token) useAuthStore.getState().setAuth(token, updatedUser as any);
            }
            try {
                void useAuthStore.getState().fetchProfile();
            } catch (e) {
                console.warn('[track] fetchProfile failed', e);
            }
        } catch (err) {
            console.error('Failed to track direct meet:', err);
            // Continue to open booking dialog even if tracking fails
        }
        // Direct meet flow removed: no UI action here anymore
    };

    const handlePhoneCall = async () => {
        try {
            // Track phone call interaction
            const resp = await apiClient.post('/users/track/phone-call', { aspirantId: candidate.id });
            const returnedUser = resp?.data?.user ?? null;
            const msg = resp?.data?.message ?? resp?.data?.user?.lastInteractionMessage ?? null;
            if (msg) {
                setInteractionMsg(String(msg));
                setInteractionOpen(true);
            }
            const token = useAuthStore.getState().token;
            if (returnedUser && token) {
                useAuthStore.getState().setAuth(token, returnedUser as any);
            } else if (user) {
                const updatedUser = { ...user, isPhoneCall: true };
                if (token) useAuthStore.getState().setAuth(token, updatedUser as any);
            }
            try {
                void useAuthStore.getState().fetchProfile();
            } catch (e) {
                console.warn('[track] fetchProfile failed', e);
            }
        } catch (err) {
            console.error('Failed to track phone call:', err);
            // Continue to initiate call even if tracking fails
        }
        // Initiate phone call
        if (candidate?.phone) {
            window.location.href = `tel:${candidate.phone}`;
        }
    };

    const handleOpenMeetLink = () => {
        if (!meetings || meetings.length === 0) return;
        const now = Date.now();
        const next = meetings.find((m: any) => Number(m.scheduledAt) > now) || meetings[0];
        const link = next?.meetingLink;
        if (!link) return;
        const url = normalizeUrl(link);
        const isStandalone =
            window.matchMedia?.('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true ||
            !!(window as any).ReactNativeWebView;
        if (isStandalone) window.location.href = url;
        else window.open(url, '_blank');
    };



    const handleLogout = () => {
        logout();
        // navigate to home
        try { window.location.href = '/'; } catch (e) { console.warn(e); }
    };

    const nextMeeting = meetings && meetings.length > 0 ? (meetings.find((m: any) => Number(m.scheduledAt) > Date.now()) || meetings[0]) : undefined;

    const handleToggleAttend = async (visitId: number | string) => {
        if (!loggedIn) {
            setAttendErrorMsg('Please login to mark attendance');
            setAttendErrorOpen(true);
            return;
        }

        const prev = visits;
        const updated = prev.map((v) => {
            if ((v.id ?? '') === visitId) {
                const liked = !v.liked;
                const likes = (Number(v.attendingCount) || 0) + (liked ? 1 : -1);
                return { ...v, liked, attendingCount: likes };
            }
            return v;
        });
        setVisits(updated);

        const toggled = updated.find((v) => (v.id ?? '') === visitId);
        try {
            await respondVisit(Number(visitId), { attending: !!toggled?.liked });
        } catch (err: any) {
            // rollback
            setVisits(prev);
            setAttendErrorMsg(err?.response?.data?.message || 'Failed to update attendance');
            setAttendErrorOpen(true);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2.5, md: 4 }, px: { xs: 0 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <Typography variant="h6" color="text.secondary">{t('common.loading')}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2.5, md: 4 }, px: { xs: 1, sm: 2 } }}>
            <Box sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 0 } }}>
                <Grid container spacing={3}>
                    {/* Left - main */}
                    <Grid item xs={12} md={8}>
                        <Stack spacing={3}>
                            {/* Header */}
                            <Card sx={sectionCardSx}>
                                <Box sx={{ display: 'flex', height: 4 }}>
                                    {['#C8180A', '#253A9A', '#6B3A00'].map(c => <Box key={c} sx={{ flex: 1, bgcolor: c }} />)}
                                </Box>
                                <CardContent sx={{ p: { xs: 1.6, sm: 2.4 } }}>
                                    <Stack direction="row" spacing={{ xs: 1.6, sm: 3 }} alignItems="center">
                                        <Box sx={{ p: '3px', borderRadius: '50%', background: 'conic-gradient(#C8180A 0deg 120deg, #F5A800 120deg 240deg, #253A9A 240deg 360deg)' }}>
                                            <Avatar src={candidate.selfieUrl} sx={{ width: { xs: 96, sm: 120 }, height: { xs: 96, sm: 120 }, bgcolor: 'primary.main', fontSize: 28, border: `3px solid ${isDark ? '#140f0f' : '#fff'}` }}>
                                                {!candidate.selfieUrl && candidate.name.charAt(0)}
                                            </Avatar>
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={1}>
                                                <Box>
                                                    <Typography variant="h5" sx={{ ...sectionTitleSx, fontSize: { xs: '1.2rem', sm: '1.9rem' }, lineHeight: 1.08 }}>{candidate.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: FF, fontSize: { xs: '0.92rem', sm: '1.05rem' } }}>
                                                        {candidate.electionName?.toLowerCase().includes('gram panchayat')
                                                            ? `${candidate.electionName}${candidate.constituencyName ? ` · ${candidate.constituencyName}` : ''}`
                                                            : `${candidate.wardName ?? ''} (${t('pages.candidateDetails.labels.ward')} ${candidate.wardNo ?? ''})`}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                                    <Stack direction="row" alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                                        <Chip label={displayParty} color="primary" variant="outlined" sx={{ fontFamily: FF, fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.92rem' }, height: { xs: 32, sm: 36 } }} />
                                                        {Array.isArray(candidate.status) ? candidate.status.map((s) => (
                                                            <Chip key={s} label={s} size="small" icon={<VerifiedIcon />} color="success" sx={{ fontFamily: FF, fontWeight: 700, fontSize: { xs: '0.76rem', sm: '0.88rem' }, height: { xs: 30, sm: 34 } }} />
                                                        )) : (candidate.status ? <Chip label={String(candidate.status)} size="small" icon={<VerifiedIcon />} color="success" /> : null)}
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Personal Details */}
                            <Card sx={sectionCardSx}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ ...sectionTitleSx, mb: 2 }}>{t('pages.candidateDetails.tabs.profile')}</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.fullName')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.name}</Typography></Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.age')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.age ?? '—'}</Typography></Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.gender')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.gender ?? '—'}</Typography></Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.education')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.education ?? '—'}</Typography></Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.occupation')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.occupation ?? '—'}</Typography></Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.phone')}</Typography><Box sx={{ mt: 0.5 }}><PhoneRevealCard phone={candidate.phone} aspirantId={candidate?.id} inline /></Box></Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            {candidate.electionName?.toLowerCase().includes('gram panchayat') ? (
                                                <Box sx={infoTileSx}>
                                                    <Typography variant="subtitle2" sx={profileLabelSx}>{candidate.electionName}</Typography>
                                                    <Typography variant="body2" sx={profileValueSx}>{candidate.constituencyName ?? '—'}</Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.wardName')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.wardName ?? '—'}</Typography></Box>
                                            )}
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.address')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.address ?? '—'}</Typography></Box>
                                        </Grid>
                                        {candidate.state && (
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={infoTileSx}><Typography variant="subtitle2" sx={profileLabelSx}>{t('pages.candidateDetails.labels.state')}</Typography><Typography variant="body2" sx={profileValueSx}>{candidate.state}</Typography></Box>
                                        </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* About */}
                            <Card sx={sectionCardSx}>
                                <CardContent sx={{ p: { xs: 1.4, sm: 2.2 }, '&:last-child': { pb: { xs: 1.4, sm: 2.2 } } }}>
                                    <Typography variant="h6" sx={sectionTitleSx}>{t('pages.candidateDetails.labels.about')}</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.8, fontFamily: FF, lineHeight: 1.65, color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {candidate.about || '—'}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* Social Platforms */}
                            {(candidate.instagramLink || candidate.facebookLink || candidate.linkedinLink) && (
                                <Card sx={sectionCardSx}>
                                    <CardContent sx={{ p: { xs: 1.4, sm: 2.2 }, '&:last-child': { pb: { xs: 1.4, sm: 2.2 } } }}>
                                        <Typography variant="h6" sx={sectionTitleSx}>{t('pages.candidateDetails.labels.socialPlatforms', { defaultValue: 'Social Platforms' })}</Typography>
                                        <Stack direction="row" spacing={2} sx={{ mt: 1.2 }}>
                                            {candidate.instagramLink && (
                                                <Box
                                                    component="a"
                                                    href={normalizeUrl(candidate.instagramLink!)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', px: 2, py: 1, borderRadius: '10px', border: '1px solid rgba(225,48,108,0.6)', background: 'rgba(225,48,108,0.08)', '&:hover': { background: 'rgba(225,48,108,0.16)' } }}
                                                >
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <defs>
                                                            <radialGradient id="ig-grad-dp" cx="30%" cy="107%" r="150%">
                                                                <stop offset="0%" stopColor="#fdf497" />
                                                                <stop offset="5%" stopColor="#fdf497" />
                                                                <stop offset="45%" stopColor="#fd5949" />
                                                                <stop offset="60%" stopColor="#d6249f" />
                                                                <stop offset="90%" stopColor="#285AEB" />
                                                            </radialGradient>
                                                        </defs>
                                                        <rect x="2" y="2" width="20" height="20" rx="6" ry="6" fill="url(#ig-grad-dp)" />
                                                        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none" />
                                                        <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
                                                    </svg>
                                                    <Typography variant="body2" sx={{ fontFamily: FF, color: '#E1306C', fontWeight: 600 }}>Instagram</Typography>
                                                </Box>
                                            )}
                                            {candidate.facebookLink && (
                                                <Box
                                                    component="a"
                                                    href={normalizeUrl(candidate.facebookLink!)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', px: 2, py: 1, borderRadius: '10px', border: '1px solid rgba(24,119,242,0.3)', background: 'rgba(24,119,242,0.08)', '&:hover': { background: 'rgba(24,119,242,0.16)' } }}
                                                >
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="12" cy="12" r="12" fill="#1877F2" />
                                                        <path d="M15.5 8H13.5C13.2 8 13 8.2 13 8.5V10H15.5L15.2 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.6 11.6 5.5 13.5 5.5H15.5V8Z" fill="white" />
                                                    </svg>
                                                    <Typography variant="body2" sx={{ fontFamily: FF, color: '#1877F2', fontWeight: 600 }}>Facebook</Typography>
                                                </Box>
                                            )}
                                            {candidate.linkedinLink && (
                                                <Box
                                                    component="a"
                                                    href={normalizeUrl(candidate.linkedinLink!)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', px: 2, py: 1, borderRadius: '10px', border: '1px solid rgba(10,102,194,0.3)', background: 'rgba(10,102,194,0.08)', '&:hover': { background: 'rgba(10,102,194,0.16)' } }}
                                                >
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="12" cy="12" r="12" fill="#0A66C2" />
                                                        <path d="M8.5 10H6.5V17.5H8.5V10ZM7.5 9C8.05 9 8.5 8.55 8.5 8C8.5 7.45 8.05 7 7.5 7C6.95 7 6.5 7.45 6.5 8C6.5 8.55 6.95 9 7.5 9ZM17.5 17.5H15.5V13.75C15.5 12.9 14.85 12.25 14 12.25C13.15 12.25 12.5 12.9 12.5 13.75V17.5H10.5V10H12.5V11.05C12.97 10.4 13.78 10 14.5 10C16.16 10 17.5 11.34 17.5 13V17.5Z" fill="white" />
                                                    </svg>
                                                    <Typography variant="body2" sx={{ fontFamily: FF, color: '#0A66C2', fontWeight: 600 }}>LinkedIn</Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}


                            {/* Documents & Declarations — hidden */}
                            {/* <Card sx={sectionCardSx}>
                                <CardContent>
                                    <Typography variant="h6" sx={sectionTitleSx}>{t('pages.candidateDetails.labels.documents')}</Typography>
                                    <Stack spacing={2} sx={{ mt: 2 }}>
                                        {Array.isArray(candidate.documents) ? candidate.documents.map((d) => (
                                            <DocumentCard key={d.name} doc={d} onView={handleViewDoc} />
                                        )) : (candidate.documents ? <DocumentCard key={String((candidate.documents as any).name || 'doc')} doc={candidate.documents as any} onView={handleViewDoc} /> : null)}
                                    </Stack>
                                </CardContent>
                            </Card> */}
                        </Stack>
                    </Grid>

                </Grid >



                <Snackbar open={attendErrorOpen} autoHideDuration={4000} onClose={() => setAttendErrorOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity="error" onClose={() => setAttendErrorOpen(false)}>{attendErrorMsg}</Alert>
                </Snackbar>

                <Snackbar open={interactionOpen} autoHideDuration={4500} onClose={() => setInteractionOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity="info" onClose={() => setInteractionOpen(false)}>{interactionMsg}</Alert>
                </Snackbar>

                {/* Meeting Notes Dialog */}
                <Dialog open={meetingNotesOpen} onClose={() => setMeetingNotesOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>{meetingNotesTitle || t('pages.candidateDetails.dialog.meetingNotes')}</DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{meetingNotesContent || t('pages.candidateDetails.dialog.noNotes')}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setMeetingNotesOpen(false)}>{t('pages.candidateDetails.dialog.close')}</Button>
                    </DialogActions>
                </Dialog>

                {/* Request For Direct Meet removed */}

                {/* Document viewer dialog */}
                <Dialog open={docViewOpen} onClose={() => setDocViewOpen(false)} fullWidth maxWidth="lg">
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {docViewTitle}
                        <IconButton size="small" onClick={() => setDocViewOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        {docViewUrl ? (
                            <Box component="iframe" src={docViewUrl} width="100%" height={600} sx={{ border: 0 }} />
                        ) : (
                            <Box sx={{ p: 2 }}>
                                <Typography>{t('pages.candidateDetails.dialog.noDocument')}</Typography>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>

            </Box >
        </Container >
    );
};

export default CandidateDetailsPage;
