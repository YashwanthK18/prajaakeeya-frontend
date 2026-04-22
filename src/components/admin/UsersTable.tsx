import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Box, Typography, Chip, Avatar,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { AdminUser } from '../../services/adminUsersService';

type Props = {
    users: AdminUser[];
    onView?: (id: number) => void;
    onToggleBlock?: (user: AdminUser) => void;
    onDelete?: (id: number) => void;
    onEdit?: (id: number) => void;
};

const UsersTable: React.FC<Props> = ({ users, onView, onToggleBlock }) => {
    if (!users || users.length === 0) return <Box sx={{ py: 4 }}><Typography>No users found.</Typography></Box>;

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((u) => (
                        <TableRow key={u.id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar
                                        src={u.profilePicture || undefined}
                                        alt={u.name}
                                        sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}
                                    >
                                        {u.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{u.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>{u.role}</TableCell>
                            <TableCell>
                                {u.isBlocked
                                    ? <Chip label="Blocked" color="error" size="small" />
                                    : <Chip label="Active" color="success" size="small" />
                                }
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="View">
                                    <IconButton size="small" onClick={() => onView && onView(u.id)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={u.isBlocked ? 'Unblock' : 'Block'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onToggleBlock && onToggleBlock(u)}
                                        color={u.isBlocked ? 'error' : 'default'}
                                    >
                                        {u.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default UsersTable;
