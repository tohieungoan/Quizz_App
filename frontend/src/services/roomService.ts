import { apiClient } from './apiClient'

export const roomService = {
  launchRoom: (params: {
    quiz_id: number
    group_id: number | null
    mode: 'CLASSIC' | 'TEAM' | 'EXAM'
    progression_mode: 'manual' | 'auto'
    allow_skip_question: boolean
    allow_show_rank: boolean
    shuffle_options: boolean
  }): Promise<any> => apiClient.post<any>('/rooms/launch', params),

  getLiveSession: (roomId: number | string): Promise<any> =>
    apiClient.get<any>(`/rooms/${roomId}/live-session`),

  nextQuestion: (roomId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomId}/next-question`, {}),

  endRoom: (roomId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomId}/end`, {}),
}
