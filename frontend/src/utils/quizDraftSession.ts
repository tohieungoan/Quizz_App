const createClientDraftId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
};

const getUserScope = (): string => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return String(user.id || user.email || 'anonymous');
  } catch {
    return 'anonymous';
  }
};

export const getActiveQuizDraftPointerKey = (): string =>
  `quizz_creator_active_draft_${getUserScope()}`;

export const getOrCreateActiveQuizDraftId = (): string => {
  const pointerKey = getActiveQuizDraftPointerKey();
  const existing = localStorage.getItem(pointerKey);
  if (existing) return existing;

  const created = createClientDraftId();
  localStorage.setItem(pointerKey, created);
  return created;
};

// A deliberate Create Quiz action must always start a separate draft. The
// pointer remains stable afterward so refreshing the editor resumes that same
// newly-created draft instead of losing unsaved work.
export const startNewQuizDraftSession = (): string => {
  const created = createClientDraftId();
  localStorage.setItem(getActiveQuizDraftPointerKey(), created);
  return created;
};
