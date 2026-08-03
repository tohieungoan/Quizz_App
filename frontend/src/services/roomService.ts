import { apiClient } from './apiClient'

export const roomService = {
  launchRoom: (params: {
    quiz_id: number
    group_id: number | null
    mode?: 'CLASSIC' | 'TEAM' | 'EXAM'
    progression_mode: 'manual' | 'auto'
    allow_skip_question?: boolean
    allow_show_rank?: boolean
    allow_anonymous_question?: boolean
    allow_voice_question?: boolean
    use_ai_question?: boolean
    shuffle_options?: boolean
  }): Promise<any> => apiClient.post<any>('/rooms/launch', params),

  getLiveSession: (roomId: number | string): Promise<any> =>
    apiClient.get<any>(`/rooms/${roomId}/live-session`),

  nextQuestion: (roomId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomId}/next-question`, {}),

  endRoom: (roomId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomId}/end`, {}),

  getAdminRooms: (params: { skip: number; limit: number; search?: string; status?: string }): Promise<any> => {
    const query = new URLSearchParams();
    query.append('skip', params.skip.toString());
    query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    return apiClient.get<any>(`/admin/rooms/?${query.toString()}`);
  },

  getRoomParticipants: (roomId: number | string): Promise<any> =>
    apiClient.get<any>(`/rooms/${roomId}/participants`),

  joinRoom: (roomCode: string, nickname: string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomCode}/join`, { nickname }),

  getRoom: (roomCode: string): Promise<any> =>
    apiClient.get<any>(`/rooms/${roomCode}`),

  startRoom: (roomId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomId}/start`, {}),

  getParticipants: (roomId: number | string): Promise<any> =>
    apiClient.get<any>(`/rooms/${roomId}/participants`),

  getMyActiveRooms: (): Promise<any> =>
    apiClient.get<any>('/rooms/my-active-rooms'),

  leaveRoom: (participantId: number | string): Promise<any> =>
    apiClient.post<any>(`/rooms/participants/${participantId}/leave`, {}),

  submitAnswer: (roomCode: string, params: {
    participant_id: number
    question_id: number
    selected_option_id?: number | null
    answer_text?: string
    active_power_up?: string
    streak?: number
  }): Promise<any> =>
    apiClient.post<any>(`/rooms/${roomCode}/submit-answer`, params),
}