export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
export type AIQuestionType = 'multiple' | 'truefalse' | 'short' | 'all';
export type AIBloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface AIOptionItem {
  content: string;
  is_correct: boolean;
}

export interface AIQuestionItem {
  content: string;
  type: 'multiple' | 'truefalse' | 'short';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloom_level?: AIBloomLevel;
  time_limit: number;
  points: number;
  source?: string;
  explanation: string;
  keyword?: string;
  acceptable_answers?: string[];
  options: AIOptionItem[];
}

export interface AIQuizGenerateRequest {
  prompt_text?: string;
  filename?: string;
  num_questions: number;
  difficulty: AIDifficulty;
  question_type: AIQuestionType;
  language: string;
  start_page?: number;
  end_page?: number;
  existing_questions?: string[];
  deleted_blacklist?: string[];
}

export interface AIQuizGenerateResponse {
  success: boolean;
  model_used: string;
  total_questions: number;
  questions: AIQuestionItem[];
  processing_time_ms: number;
}

export interface DocumentPreviewResponse {
  filename: string;
  total_pages: number;
  character_count: number;
  preview_text: string;
}

export type ProgressStage = 'idle' | 'parsing' | 'generating' | 'validating' | 'completed' | 'error';
