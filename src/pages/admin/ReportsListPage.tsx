import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography, MenuItem, Select, InputLabel, FormControl, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReportsTable from '../../components/admin/ReportsTable';
import { adminReportsService, ReportStatus, Report } from '../../services/adminReportsService';

const ReportsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    // Removed ward and search filters

    const load = () => {
        setLoading(true);
        adminReportsService
            .getReports({ status: (statusFilter as ReportStatus) || undefined })
            .then((data) => setReports(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterApply = () => load();

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin Reports</Typography>
                <Typography color="text.secondary">View and manage user-submitted reports</Typography>
            </Box>

            <Card>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel id="status-filter-label">Status</InputLabel>
                            <Select labelId="status-filter-label" value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="contained" sx={{ color: 'white' }} onClick={handleFilterApply}>Apply</Button>
                    </Stack>

                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ReportsTable reports={reports} onView={(id) => navigate(`/admin/reports/${id}`)} />
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
};

export default ReportsListPage;
