import { apiClient } from './apiClient'

export interface UploadSignatureResponse {
  signature: string
  timestamp: number
  api_key: string
  cloud_name: string
  folder: string
  public_id: string
  asset_id: number
  resource_type: 'image' | 'video'
}

export const uploadService = {
  requestSignature: (params: {
    fileName: string
    fileType: string
    fileSize: number
    quizId?: number
  }): Promise<UploadSignatureResponse> =>
    apiClient.post<UploadSignatureResponse>('/upload/request-signature', params),

  completeUpload: (params: {
    asset_id: number
    public_id: string
    secure_url: string
    resource_type: 'image' | 'video'
    bytes: number
    format?: string
  }): Promise<any> => apiClient.post<any>('/upload/complete', params),

  deleteAsset: (url: string): Promise<any> =>
    apiClient.delete<any>(`/upload/delete-asset?url=${encodeURIComponent(url)}`),
}
