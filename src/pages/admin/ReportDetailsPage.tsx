import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    CircularProgress,
    Divider,
    Grid,
    Button,
    Chip,
    Avatar,
} from '@mui/material';
import { adminReportsService, Report, ReportStatus } from '../../services/adminReportsService';
import ReportStatusModal from '../../components/admin/ReportStatusModal';
import PersonIcon from '@mui/icons-material/Person';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ReportDetailsPage: React.FC = () => {
    const { id } = useParams();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        adminReportsService
            .getReportById(id)
            .then((response) => setReport(response))
            .catch(() => setError('Failed to load report'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusUpdate = async (status: ReportStatus, remarks?: string) => {
        if (!report) return;
        try {
            const updated = await adminReportsService.updateReportStatus(report.id.toString(), status, remarks);
            // Merge updated shallow fields into existing report to preserve nested objects (ward, reportedUser, etc.)
            setReport((prev) => {
                if (!prev) return updated as Report;
                const merged: any = { ...prev, ...updated };
                if (prev.reportedUser && !updated.reportedUser) merged.reportedUser = prev.reportedUser;
                if (prev.reportedBy && !updated.reportedBy) merged.reportedBy = prev.reportedBy;
                if (prev.ward && !updated.ward) merged.ward = prev.ward;
                if (prev.resolvedBy && !updated.resolvedBy) merged.resolvedBy = prev.resolvedBy;
                return merged as Report;
            });
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message || 'Failed to update');
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;
    if (!report) return <Typography color="error">Report not found</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
                {/* Header Section */}
                <Card>
                    <CardContent>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Grid item>
                                <Typography variant="h5">Report Details</Typography>
                                <Typography variant="subtitle1">Report #{report.id}</Typography>
                                <Typography>Reason: {report.reason}</Typography>
                            </Grid>
                            <Grid item>
                                <Chip label={report.status} color={report.status === 'resolved' ? 'success' : 'warning'} />
                                <Typography variant="body2" color="textSecondary">
                                    {new Date(report.createdAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Reported User and Reported By Sections */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" /> Reported User
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <Avatar
                                        src={report.reportedUser?.profilePicture || undefined}
                                        alt={report.reportedUser?.nameEn || report.reportedUser?.name}
                                        sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}
                                    >
                                        {(report.reportedUser?.nameEn || report.reportedUser?.name)?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography fontWeight={500}>{report.reportedUser?.nameEn || report.reportedUser?.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{report.reportedUser?.role}</Typography>
                                    </Box>
                                </Box>
                                {report.reportedUser?.epicId && <Typography>VOTER ID: {report.reportedUser.epicId}</Typography>}
                                {report.reportedUser?.wardName && <Typography>Ward: {report.reportedUser.wardName}</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ReportProblemIcon color="error" /> Reported By
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                    <Avatar
                                        src={report.reportedBy?.profilePicture || undefined}
                                        alt={report.reportedBy?.nameEn || report.reportedBy?.name}
                                        sx={{ width: 48, height: 48, bgcolor: 'error.main' }}
                                    >
                                        {(report.reportedBy?.nameEn || report.reportedBy?.name)?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                        <Typography fontWeight={500}>{report.reportedBy?.nameEn || report.reportedBy?.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{report.reportedBy?.role}</Typography>
                                    </Box>
                                </Box>
                                {report.reportedBy?.epicId && <Typography>VOTER ID: {report.reportedBy.epicId}</Typography>}
                                {report.reportedBy?.wardName && <Typography>Ward: {report.reportedBy.wardName}</Typography>}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Ward Details Section */}
                {report.ward && (report.ward.number || report.ward.name) && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOnIcon color="action" /> Ward Details
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography># Ward: {report.ward.number} • {report.ward.name}{report.ward.zone ? ` • ${report.ward.zone}` : ''}</Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Admin Notes Section (moved below Ward Details) */}
                {report.adminNotes && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Admin Notes</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography>{report.adminNotes}</Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                    <Button variant="contained" color="primary" sx={{ color:'white' }}  onClick={() => setModalOpen(true)}>
                        Change Status
                    </Button>
                </Box>

                <ReportStatusModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleStatusUpdate}
                    currentStatus={report.status as ReportStatus}
                />
            </Stack>
        </Box>
    );
};

export default ReportDetailsPage;
