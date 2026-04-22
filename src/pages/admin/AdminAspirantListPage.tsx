import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert,
  Avatar, TextField, InputAdornment, Pagination, Stack, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAllAspirants, AdminAspirant } from '../../services/aspirantService';
import adminUsersService from '../../services/adminUsersService';

const AdminAspirantListPage: React.FC = () => {
  const [aspirants, setAspirants] = useState<AdminAspirant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; aspirant?: AdminAspirant; action?: 'block' | 'unblock' }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchAspirants = useCallback((pageNum: number, searchTerm: string) => {
    setLoading(true);
    setError('');
    getAllAspirants(pageNum, limit, searchTerm || undefined)
      .then((resp) => {
        setAspirants(resp.data.data);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load aspirants'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAspirants(1, '');
  }, [fetchAspirants]);

  // Debounce search — fires 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAspirants(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const openConfirm = (aspirant: AdminAspirant, action: 'block' | 'unblock') => {
    setActionError('');
    setConfirmDialog({ open: true, aspirant, action });
  };

  const handleBlockAction = async () => {
    const { aspirant, action } = confirmDialog;
    if (!aspirant || !action) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (action === 'block') {
        await adminUsersService.blockUser(aspirant.userId);
      } else {
        await adminUsersService.unblockUser(aspirant.userId);
      }
      setAspirants((prev) =>
        prev.map((a) => a.id === aspirant.id ? { ...a, isBlocked: action === 'block' } : a)
      );
      setConfirmDialog({ open: false });
    } catch (err: any) {
      setActionError(err?.response?.data?.message || `Failed to ${action} aspirant`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Aspirant List</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} aspirant{total !== 1 ? 's' : ''} total
            </Typography>
          </Box>
          <Box>
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
              sx={{ width: 260 }}
            />
          </Box>
        </Box>

        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Aspirant</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Party</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Election</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Constituency</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aspirants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                          <Typography color="text.secondary">No aspirants found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      aspirants.map((a, index) => (
                        <TableRow key={a.id} hover>
                          <TableCell sx={{ color: 'text.secondary', width: 56 }}>
                            {(page - 1) * limit + index + 1}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={a.selfieUrl || undefined}
                                alt={a.name}
                                sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                              >
                                {a.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.name}</Typography>
                                {a.isBlocked && (
                                  <Chip label="Blocked" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem', mt: 0.3 }} />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={a.party} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{a.electionName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{a.constituencyName}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            {a.isBlocked ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                onClick={() => openConfirm(a, 'unblock')}
                              >
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<BlockIcon fontSize="small" />}
                                onClick={() => openConfirm(a, 'block')}
                              >
                                Block
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              color="primary"
            />
          </Box>
        )}
      </Stack>

      {/* Block / Unblock Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => !actionLoading && setConfirmDialog({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmDialog.action === 'block' ? 'Block Aspirant' : 'Unblock Aspirant'}
        </DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Typography>
            Are you sure you want to{' '}
            <strong>{confirmDialog.action}</strong>{' '}
            <strong>{confirmDialog.aspirant?.name}</strong>?
            {confirmDialog.action === 'block' && ' They will no longer be able to access the platform.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'block' ? 'error' : 'success'}
            onClick={handleBlockAction}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {confirmDialog.action === 'block' ? 'Block' : 'Unblock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAspirantListPage;
