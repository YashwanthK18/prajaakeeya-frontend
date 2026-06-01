import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Stack, Typography, Card, CardContent, Avatar, TextField, Button, Divider, IconButton, Snackbar, Alert, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ForumIcon from '@mui/icons-material/Forum';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import useAuthStore from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { getAspirantMessages, postUserChatMessage, AspirantChatMessageDto } from '../services/aspirantChatService';
import { fetchWardAspirants, fetchWardAspirantsByNumber } from '../services/aspirantService';

const UserChatPage: React.FC = () => {
    const { aspirantId } = useParams<{ aspirantId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const candidate = (location.state as any)?.candidate;

    const [messages, setMessages] = React.useState<AspirantChatMessageDto[]>([]);
    const [aspirantUserIds, setAspirantUserIds] = React.useState<Set<number>>(new Set());
    const [aspirantNames, setAspirantNames] = React.useState<Set<string>>(new Set());
    const [loading, setLoading] = React.useState(false);
    const [posting, setPosting] = React.useState(false);
    const [text, setText] = React.useState('');
    const [successOpen, setSuccessOpen] = React.useState(false);
    const [errorOpen, setErrorOpen] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState('');
    const [refreshing, setRefreshing] = React.useState(false);

    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const fetchMessages = React.useCallback(async (options?: { showLoading?: boolean; scroll?: boolean }) => {
        if (!aspirantId) return;
        if (options?.showLoading) setLoading(true);
        try {
            const resp = await getAspirantMessages(Number(aspirantId), 1, 50);
            const data = (resp.data?.data ?? resp.data) as AspirantChatMessageDto[];
            data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setMessages(data || []);
            if (options?.scroll) setTimeout(scrollToBottom, 50);
        } catch (err: any) {
            if (options?.showLoading) {
                setMessages([]);
                setErrorMsg(err?.response?.data?.message || 'Failed to load messages');
                setErrorOpen(true);
            }
        } finally {
            if (options?.showLoading) setLoading(false);
        }
    }, [aspirantId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchMessages({ scroll: true });
        setRefreshing(false);
    };

    React.useEffect(() => {
        fetchMessages({ showLoading: true, scroll: true });
    }, [fetchMessages]);

    // Poll for new messages every 5 seconds so other users see them without a refresh
    React.useEffect(() => {
        if (!aspirantId) return;
        const id = setInterval(() => fetchMessages(), 5000);
        return () => clearInterval(id);
    }, [aspirantId, fetchMessages]);

    React.useEffect(() => {
        let mounted = true;
        const loadAspirants = async () => {
            if (!user) return;
            try {
                let resp;
                if (user.wardId) {
                    resp = await fetchWardAspirants(user.wardId);
                } else if (user.wardNumber) {
                    resp = await fetchWardAspirantsByNumber(String(user.wardNumber));
                }
                const list = (resp?.data?.data ?? resp?.data) || [];
                const ids = new Set<number>();
                const names = new Set<string>();
                (list as any[]).forEach((a) => {
                    if (!a) return;
                    if (typeof a.userId === 'number') ids.add(a.userId);
                    if (a.user && typeof a.user.id === 'number') ids.add(a.user.id);
                    if (typeof a.id === 'number') ids.add(a.id);
                    if (a.name) names.add(String(a.name).toLowerCase().trim());
                });
                if (!mounted) return;
                setAspirantUserIds(ids);
                setAspirantNames(names);
            } catch (err) {
                // ignore aspirant fetch errors
            }
        };
        loadAspirants();
        return () => { mounted = false; };
    }, [user]);

    const handleSend = async () => {
        if (!text.trim() || !aspirantId) return;
        setPosting(true);
        try {
            const resp = await postUserChatMessage(Number(aspirantId), { content: text.trim() });
            const m = resp.data as AspirantChatMessageDto;
            setMessages((prev) => [...prev, m]);
            setText('');
            setTimeout(scrollToBottom, 50);
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.message || 'Failed to send message');
            setErrorOpen(true);
        } finally {
            setPosting(false);
        }
    };

    return (
        <Stack spacing={3} sx={{ p: { xs: 2, md: 4 }, height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{(candidate?.wardName || user?.wardName || 'W').charAt(0)}</Avatar>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={t('discussion.labels.aspirant') || 'Aspirant'} sx={{ bgcolor: '#FFF7ED', color: '#F97316', fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: 6 }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{t('discussion.roomLabel') || 'Interview room'}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={() => navigate(-1)}><CloseIcon /></IconButton>
            </Box>

            <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 }, height: '100%', flex: 1 }}>
                    <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                        {loading && <Typography variant="body2">{t('common.loading') || 'Loading messages...'}</Typography>}
                        {messages.map((m) => {
                            const isMe = m.userId === user?.id;
                            const isAspirant = !!(m.user && 'role' in m.user && (m.user as any).role === 'aspirant');
                            return (
                                <Stack key={m.id} direction="row" spacing={2} alignItems="flex-start" justifyContent={isMe ? 'flex-end' : 'flex-start'}>
                                    {!isMe && (
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>{(m.user?.name || 'U').charAt(0)}</Avatar>
                                    )}
                                    <Box sx={{
                                        bgcolor: isMe ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.04)' : 'grey.100'),
                                        color: isMe ? '#fff' : (isDark ? 'rgba(255,255,255,0.9)' : 'text.primary'),
                                        px: 2.5,
                                        py: 1.75,
                                        borderRadius: 2,
                                        minWidth: 0,
                                        maxWidth: { xs: '90%', sm: '75%' },
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word'
                                    }}>
                                        {!isMe && (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>{m.user?.name}</Typography>
                                                {isAspirant && <Chip size="small" label={t('discussion.labels.aspirant') || 'Aspirant'} sx={{ bgcolor: '#FFF7ED', color: '#F97316', fontWeight: 600, fontSize: '0.6rem', height: 20, borderRadius: 6 }} />}
                                            </Stack>
                                        )}
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{m.content}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>{new Date(m.createdAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</Typography>
                                    </Box>
                                </Stack>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                    fullWidth
                    placeholder={t('discussion.placeholder') || 'Write a question...'}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            await handleSend();
                        }
                    }}
                />
                <Button variant="contained" endIcon={<SendIcon />} onClick={handleSend} disabled={posting} sx={{ whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' } }}>{t('discussion.send') || 'Send'}</Button>
            </Box>

            <Snackbar open={successOpen} autoHideDuration={2500} onClose={() => setSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSuccessOpen(false)}>{t('discussion.sent') || 'Message posted'}</Alert>
            </Snackbar>
            <Snackbar open={errorOpen} autoHideDuration={3500} onClose={() => setErrorOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="error" onClose={() => setErrorOpen(false)}>{errorMsg}</Alert>
            </Snackbar>
        </Stack>
    );
};

export default UserChatPage;
