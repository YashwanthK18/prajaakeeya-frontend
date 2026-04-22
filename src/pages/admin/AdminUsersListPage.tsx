import { useEffect, useState, useCallback } from 'react';
import {
    Box, Card, CardContent, Stack, Typography, TextField, InputAdornment,
    Button, CircularProgress, Pagination, Grid, Dialog, DialogTitle,
    DialogContent, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import UsersTable from '../../components/admin/UsersTable';
import adminUsersService, { AdminUser } from '../../services/adminUsersService';

const AdminUsersListPage: React.FC = () => {
    const navigate = useNavigate();
    const isAdmin = useAuthStore((s) => s.isAdmin);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;
    const [confirm, setConfirm] = useState<{ open: boolean; id?: number; action?: 'block' | 'unblock' }>({ open: false });

    const load = useCallback((pageNum: number, searchTerm: string) => {
        setLoading(true);
        adminUsersService.getVoters({ page: pageNum, limit, search: searchTerm || undefined })
            .then((resp) => {
                setUsers(resp.data);
                setTotal(resp.totalUsers ?? resp.total ?? resp.data.length);
                setTotalPages(resp.totalPages ?? 1);
            })
            .catch((e) => console.error('Failed to load users', e))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isAdmin) { navigate('/'); return; }
        load(1, '');
    }, [isAdmin, load, navigate]);

    // Debounce search — fires 400ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            load(1, search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePageChange = (_: any, value: number) => {
        setPage(value);
        load(value, search);
    };

    const handleToggleBlock = (user: AdminUser) => {
        setConfirm({ open: true, id: user.id, action: user.isBlocked ? 'unblock' : 'block' });
    };

    const performConfirm = async () => {
        if (!confirm.id || !confirm.action) return setConfirm({ open: false });
        try {
            if (confirm.action === 'block') {
                await adminUsersService.blockUser(confirm.id);
                setUsers(prev => prev.map(u => u.id === confirm.id ? { ...u, isBlocked: true } : u));
            } else {
                await adminUsersService.unblockUser(confirm.id);
                setUsers(prev => prev.map(u => u.id === confirm.id ? { ...u, isBlocked: false } : u));
            }
        } catch (e) {
            console.error('Action failed', e);
            load(page, search);
        } finally {
            setConfirm({ open: false });
        }
    };

    if (!isAdmin) return null;

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>User List</Typography>
                    <Typography variant="body2" color="text.secondary">{total} user{total !== 1 ? 's' : ''} total</Typography>
                </Box>
            </Box>

            <Card>
                <CardContent>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            size="small"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 280 }}
                        />
                    </Box>

                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
                    ) : (
                        <>
                            <UsersTable
                                users={users}
                                onView={(id) => navigate(`/admin/users/${id}`)}
                                onToggleBlock={handleToggleBlock}
                            />
                            <Grid container justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                                <Grid item>
                                    <Typography variant="body2">Total: {total}</Typography>
                                </Grid>
                                <Grid item>
                                    <Pagination count={Math.max(1, totalPages)} page={page} onChange={handlePageChange} />
                                </Grid>
                            </Grid>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={confirm.open} onClose={() => setConfirm({ open: false })}>
                <DialogTitle>Confirm</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to {confirm.action} this user?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirm({ open: false })}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={performConfirm}>Yes</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default AdminUsersListPage;
