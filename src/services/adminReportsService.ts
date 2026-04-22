export type ReportStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';

export interface Report {
  id: number;
  createdAt: string;
  updatedAt: string;
  reportedUserId: number;
  reportedById: number;
  wardId: number;
  reportedUserType: string;
  reason: string;
  status: string;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedById?: number;
  reportedUser?: {
    id: number;
    name: string;
    nameEn: string;
    epicId: string;
    role: string;
    wardName: string;
    profilePicture?: string | null;
  };
  reportedBy?: {
    id: number;
    name: string;
    nameEn: string;
    epicId: string;
    role: string;
    wardName: string;
    profilePicture?: string | null;
  };
  ward?: {
    id: number;
    number: string;
    name: string;
    zone: string;
  };
  resolvedBy?: {
    id: number;
    name: string;
  };
}

import apiClient from './apiClient';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export const adminReportsService = {
  getReports: async (filters?: { status?: ReportStatus; ward?: string; search?: string }) => {
    // Try real API first, fall back to mock on error
    try {
      const params: any = {};
      if (filters?.status) params.status = String(filters.status).toLowerCase();
      if (filters?.ward) params.ward = filters.ward;
      if (filters?.search) params.search = filters.search;
      const resp = await apiClient.get('/admin/reports', { params });
      return resp.data;
    } catch (e) {
      // On error, return an empty list to let the caller render a friendly state.
      return [] as Report[];
    }
  },

  getReportById: async (id: string) => {
    try {
      const resp = await apiClient.get(`/admin/reports/${id}`);
      return resp.data;
    } catch (e) {
      // If API fails, return null so callers can handle 'not found' or show error state.
      return null;
    }
  },

  updateReportStatus: async (id: string, status: string, adminNotes?: string) => {
    try {
      // Normalize and validate status field (accept case-insensitive values)
      const allowedStatuses = ['pending', 'in progress', 'resolved', 'rejected']; // API enum values
      const normalizedStatus = String(status).toLowerCase();
      if (!allowedStatuses.includes(normalizedStatus)) {
        throw new Error(`Invalid status value: ${status}. Allowed values are: ${allowedStatuses.join(', ')}`);
      }

      // Validate adminNotes field
      if (adminNotes && adminNotes.length < 5) {
        throw new Error('Admin notes must be at least 5 characters long.');
      }

      const body: any = { status: normalizedStatus };
      if (adminNotes) body.adminNotes = adminNotes;
      const resp = await apiClient.patch(`/admin/reports/${id}/status`, body);
      return resp.data;
    } catch (e: any) {
      if (e?.response?.data) {
        const msg = e.response.data.message ?? e.response.data.error ?? JSON.stringify(e.response.data);
        const text = Array.isArray(msg) ? msg.join(', ') : String(msg);
        console.error('Server Response Error:', e.response.data);
        throw new Error(text || 'Failed to update report status');
      } else {
        console.error('Error in updateReportStatus:', e);
        throw new Error(e?.message || 'Failed to update report status');
      }
    }
  }
};

export default adminReportsService;
