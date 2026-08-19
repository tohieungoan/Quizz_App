export type QuestionType = 'multiple' | 'truefalse' | 'short';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  mediaUrl?: string;
  audioUrl?: string;
  optionIds?: number[];
  isAIGenerated?: boolean;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple';
  options: string[];
  correctAnswer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'truefalse';
  correctAnswer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short';
  correctAnswer: string;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

interface ServerQuestionOption {
  id: number;
  content?: string | null;
  is_correct?: boolean;
}

export interface ServerQuestion {
  id: number | string;
  type?: string | null;
  content?: string | null;
  difficulty?: string | null;
  time_limit?: number | null;
  media_url?: string | null;
  audio_url?: string | null;
  is_original?: boolean;
  options?: ServerQuestionOption[];
}

export interface DraftQuestionSnapshot {
  id?: number;
  client_id?: string;
  type: string;
  content: string;
  difficulty: string;
  time_limit: number;
  position: number;
  media_url: string | null;
  audio_url: string | null;
  is_original: boolean;
  options: Array<{
    id?: number;
    content: string;
    is_correct: boolean;
  }>;
}

export const mapServerQuestion = (question: ServerQuestion): Question => {
  const normalizedType = (question.type || '').toLowerCase();
  const type: QuestionType = normalizedType.includes('true') || normalizedType.includes('false')
    ? 'truefalse'
    : normalizedType.includes('short') || normalizedType.includes('fill')
      ? 'short'
      : 'multiple';
  const options = question.options || [];
  const difficulty = (question.difficulty || 'MEDIUM').toUpperCase();
  const base: BaseQuestion = {
    id: String(question.id),
    type,
    text: question.content || '',
    difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM') as QuestionDifficulty,
    timeLimit: question.time_limit || 60,
    mediaUrl: question.media_url || undefined,
    audioUrl: question.audio_url || undefined,
    optionIds: options.map(option => option.id),
    isAIGenerated: question.is_original === false,
  };

  if (type === 'truefalse') {
    const trueOption = options.find(option => option.content?.toLowerCase() === 'true');
    const falseOption = options.find(option => option.content?.toLowerCase() === 'false');
    return {
      ...base,
      type,
      optionIds: [trueOption?.id, falseOption?.id].filter((id): id is number => id !== undefined),
      correctAnswer: trueOption?.is_correct === true,
    };
  }
  if (type === 'short') {
    const correctOption = options.find(option => option.is_correct);
    return {
      ...base,
      type,
      optionIds: correctOption ? [correctOption.id] : [],
      correctAnswer: correctOption?.content || '',
    };
  }
  const correctIndex = options.findIndex(option => option.is_correct);
  return {
    ...base,
    type,
    options: options.map(option => option.content || ''),
    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
  };
};

export const toDraftQuestionSnapshot = (
  question: Question,
  position: number,
): DraftQuestionSnapshot => {
  const persistedId = /^\d+$/.test(question.id) ? Number(question.id) : undefined;
  const common = {
    id: persistedId,
    client_id: persistedId ? undefined : question.id,
    type: question.type === 'multiple' ? 'Multiple Choice'
      : question.type === 'truefalse' ? 'True/False' : 'Short Answer',
    content: question.text,
    difficulty: question.difficulty.charAt(0) + question.difficulty.slice(1).toLowerCase(),
    time_limit: question.timeLimit,
    position,
    media_url: question.mediaUrl || null,
    audio_url: question.audioUrl || null,
    is_original: !question.isAIGenerated,
  };

  if (question.type === 'multiple') {
    return {
      ...common,
      options: question.options.map((content, optionIndex) => ({
        id: question.optionIds?.[optionIndex],
        content,
        is_correct: optionIndex === question.correctAnswer,
      })),
    };
  }
  if (question.type === 'truefalse') {
    return {
      ...common,
      options: [
        { id: question.optionIds?.[0], content: 'True', is_correct: question.correctAnswer },
        { id: question.optionIds?.[1], content: 'False', is_correct: !question.correctAnswer },
      ],
    };
  }
  return {
    ...common,
    options: [{ id: question.optionIds?.[0], content: question.correctAnswer, is_correct: true }],
  };
};
