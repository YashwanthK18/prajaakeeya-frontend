import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert,
  Avatar, TextField, InputAdornment, Pagination, Stack, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getAllAspirants, AdminAspirant } from '../../services/aspirantService';

const AdminAspirantListPage: React.FC = () => {
  const [aspirants, setAspirants] = useState<AdminAspirant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

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
    fetchAspirants(page, search);
  }, [page, search, fetchAspirants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
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
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              size="small"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aspirants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
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
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.name}</Typography>
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
    </Box>
  );
};

export default AdminAspirantListPage;
