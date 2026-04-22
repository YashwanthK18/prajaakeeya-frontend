import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Box, Typography, Avatar } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Props {
    reports: any[];
    loading?: boolean;
    onView: (id: string) => void;
}

const statusColor = (s: string) => {
    switch (s) {
        case 'pending': return 'warning';
        case 'resolved': return 'success';
        case 'rejected': return 'error';
        default: return 'default';
    }
};

const truncateOneLineStyle = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 } as const;

const ReportsTable: React.FC<Props> = ({ reports, onView }) => {
    if (!reports || reports.length === 0) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No reports found</Typography>
            </Box>
        );
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Reported User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reported User Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reported By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reported On</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {reports.map((r) => {
                    const id = r.id ?? r.reportId ?? r.report_id ?? '';
                    const reportedUserName = r.reportedUser?.nameEn || r.reportedUser?.name || '';
                    const reportedUserPic = r.reportedUser?.profilePicture || null;
                    const reportedUserType = r.reportedUserType || r.reportedUser?.role || '';
                    const reportedByName = r.reportedBy?.nameEn || r.reportedBy?.name || '';
                    const reportedByPic = r.reportedBy?.profilePicture || null;
                    const reason = r.reason || r.description || r.title || '';
                    const status = r.status || r.currentStatus || '';
                    const createdAt = r.createdAt || r.created_at || r.created || '';

                    return (
                        <TableRow key={id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar src={reportedUserPic} alt={reportedUserName} sx={{ width: 32, height: 32 }}>
                                        {reportedUserName?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{reportedUserName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>{reportedUserType}</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar src={reportedByPic} alt={reportedByName} sx={{ width: 32, height: 32 }}>
                                        {reportedByName?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2">{reportedByName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={truncateOneLineStyle} title={reason}>
                                    {reason}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip label={status} color={statusColor(status)} size="small" />
                            </TableCell>
                            <TableCell>{createdAt ? new Date(createdAt).toLocaleString() : ''}</TableCell>
                            <TableCell>
                                <IconButton size="small" onClick={() => onView(id)} title="View details">
                                    <VisibilityIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default ReportsTable;
