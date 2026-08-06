import { apiClient } from './apiClient';

export interface AdminSettingsPayload {
  email_alerts_enabled: boolean;
  lifecycle_user_registered_inapp: boolean;
  lifecycle_user_registered_email: boolean;
  lifecycle_user_deleted_inapp: boolean;
  lifecycle_user_deleted_email: boolean;
  lifecycle_user_status_inapp: boolean;
  lifecycle_user_status_email: boolean;
  lifecycle_user_imported_inapp: boolean;
  lifecycle_user_imported_email: boolean;
  security_permission_changes_inapp: boolean;
  security_permission_changes_email: boolean;
  security_critical_data_deletion_inapp: boolean;
  security_critical_data_deletion_email: boolean;
}

export interface AdminSettingsResponse extends AdminSettingsPayload {
  id: number;
  user_id?: number | null;
  updated_at?: string;
}

export const adminSettingService = {
  getSettings: (): Promise<AdminSettingsResponse> =>
    apiClient.get<AdminSettingsResponse>('/admin/settings'),

  updateSettings: (payload: AdminSettingsPayload): Promise<AdminSettingsResponse> =>
    apiClient.put<AdminSettingsResponse>('/admin/settings', payload),
};
