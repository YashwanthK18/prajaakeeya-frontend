import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Avatar,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import { Send as SendIcon, Forum as ForumIcon } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import { getWardMessages, postWardMessage, deleteMessage, ForumMessageDto } from '../services/forumService';
import { fetchWardAspirants, fetchWardAspirantsByNumber } from '../services/aspirantService';

interface Message {
  id: number;
  name: string;
  text: string;
  time: string;
  isMe?: boolean;
  isAspirant?: boolean;
}
const WardDiscussionPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = theme.palette.background.paper;
  const otherMessageBg = isDark ? 'rgba(255,255,255,0.04)' : 'grey.100';
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [aspirantNames, setAspirantNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number } | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const wardName = user?.wardName || 'Ward 101 - Central';
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const loadMessages = async (wardId?: number, p = page) => {
    if (!wardId) return;
    setLoading(true);
    try {
      const resp = await getWardMessages(wardId, p, limit);
      const data = resp.data.data as ForumMessageDto[];
      // Ensure messages are ordered oldest -> newest so newest appears at the bottom
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      // We rely on `m.user.role` from the API to mark aspirant messages.
      // Keep existing aspirantNames state for backwards compatibility but don't use it for labeling.

      const mapped: Message[] = data.map((m) => ({
        id: m.id,
        name: m.user?.name || user?.name || 'User',
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: m.userId === user?.id,
        isAspirant: m.user?.role === 'aspirant'
      }));

      setMessages(mapped);
      setMeta(resp.data.meta || null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load messages');
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const wardId = user?.wardId;
    if (!wardId) {
      setErrorMsg(t('discussion.noWardAssigned') || 'No ward assigned');
      setErrorOpen(true);
      return;
    }
    setPosting(true);
    try {
      const resp = await postWardMessage(wardId, { content: message.trim() });
      const m = resp.data as ForumMessageDto;
      const mapped: Message = {
        id: m.id,
        name: m.user?.name || user?.name || 'You',
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: m.userId === user?.id
      };
      // mark aspirant status based on returned user role
      mapped.isAspirant = m.user?.role === 'aspirant';
      setMessages((prev) => [...prev, mapped]);
      setMessage('');
      setSuccessMsg(t('discussion.sent') || 'Message posted');
      setSuccessOpen(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send message');
      setErrorOpen(true);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!messageId) return;
    setDeletingMessageId(messageId);
    try {
      // call delete API
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setSuccessMsg(t('discussion.deleted') || 'Message deleted');
      setSuccessOpen(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete message');
      setErrorOpen(true);
    } finally {
      setDeletingMessageId(null);
    }
  };



  useEffect(() => {
    const wardId = user?.wardId;
    if (wardId) loadMessages(wardId, 1);
    // start polling to update messages from other users
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted || !wardId) return;
      void loadMessages(wardId, 1);
    }, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [user?.wardId]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t('discussion.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('discussion.subtitle')}
        </Typography>
      </Box>

      <Card sx={{ bgcolor: cardBg, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ForumIcon />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {wardName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('discussion.roomLabel')}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2} sx={{ maxHeight: 420, overflowY: 'auto', pr: 1, mb: 2 }}>
            {loading && <Typography variant="body2">{t('discussion.loading') || 'Loading messages...'}</Typography>}
            {messages.map((msg) => (
              <Stack
                key={msg.id}
                direction="row"
                spacing={2}
                alignItems="flex-start"
                justifyContent={msg.isMe ? 'flex-end' : 'flex-start'}
              >
                {!msg.isMe && (
                  <Avatar sx={{ width: 36, height: 36, bgcolor: msg.isAspirant ? 'secondary.main' : 'primary.main' }}>
                    {msg.name.charAt(0)}
                  </Avatar>
                )}
                <Box
                  sx={{
                    bgcolor: msg.isMe ? 'primary.main' : otherMessageBg,
                    color: msg.isMe ? '#fff' : theme.palette.text.primary,
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    maxWidth: '70%',
                    borderLeft: msg.isAspirant ? '4px solid' : undefined,
                    borderLeftColor: msg.isAspirant ? 'primary.main' : undefined
                  }}
                >
                  {!msg.isMe && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: msg.isAspirant ? 'primary.main' : 'text.primary' }}>
                        {msg.name}
                      </Typography>
                      {msg.isAspirant && (
                        <Chip label={t('discussion.labels.aspirant') || 'Aspirant'} size="small" color="primary" sx={{ height: 22, fontWeight: 700 }} />
                      )}
                    </Stack>
                  )}
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                    {msg.time}
                  </Typography>
                </Box>
                {msg.isMe && (
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(msg.id)}
                    disabled={deletingMessageId === msg.id}
                    sx={{ alignSelf: 'center' }}
                    aria-label="delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            ))}
            <div ref={messagesEndRef} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder={t('discussion.placeholder')}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: isDark ? 'rgba(255,255,255,0.02)' : undefined,
                  color: theme.palette.text.primary
                }
              }}
              inputProps={{
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: false,
                autoComplete: 'off'
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSend}
              disabled={posting}
              sx={{ minWidth: 140 }}
            >
              {t('discussion.send')}
            </Button>
          </Stack>
          <Snackbar
            open={successOpen}
            autoHideDuration={3000}
            onClose={() => setSuccessOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert severity="success" onClose={() => setSuccessOpen(false)}>
              {t('discussion.sent') || 'Message posted'}
            </Alert>
          </Snackbar>

          <Snackbar
            open={errorOpen}
            autoHideDuration={4000}
            onClose={() => setErrorOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert severity="error" onClose={() => setErrorOpen(false)}>
              {errorMsg}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default WardDiscussionPage;
