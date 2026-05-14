import apiClient from './apiClient';

export interface UnreadCountResponse {
  unreadCount: number;
}

export type NotificationType =
  | 'chat_message'
  | 'voting_window'
  | 'civic_issue'
  | 'new_aspirant'
  | 'meeting'
  | 'visit'
  | 'announcement'
  | (string & {}); // allow future server-side types without breaking the build

export interface ApiNotification {
  id: number;
  createdAt: number;
  updatedAt: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string | null;
  aspirantId: number | null;
  aspirantName: string | null;
  electionId: number | null;
  constituencyId: number | null;
  constituencyName: string | null;
  meetingId: number | null;
  visitId: number | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: number | null;
}

export interface NotificationsListResponse {
  data: ApiNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const getUnreadCount = () =>
  apiClient.get<UnreadCountResponse>('/notifications/unread-count');

export const listNotifications = (params: ListNotificationsParams = {}) =>
  apiClient.get<NotificationsListResponse>('/notifications', { params });
