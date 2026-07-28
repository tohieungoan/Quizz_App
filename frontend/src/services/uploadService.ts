import { apiClient } from './apiClient'

export interface UploadSignatureResponse {
  signature: string
  timestamp: number
  api_key: string
  cloud_name: string
  folder: string
}

export const uploadService = {
  requestSignature: (params: {
    fileName: string
    fileType: string
    fileSize: number
  }): Promise<UploadSignatureResponse> =>
    apiClient.post<UploadSignatureResponse>('/upload/request-signature', params),

  deleteAsset: (url: string): Promise<any> =>
    apiClient.delete<any>(`/upload/delete-asset?url=${encodeURIComponent(url)}`),
}
