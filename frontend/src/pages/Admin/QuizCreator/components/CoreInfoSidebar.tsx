import React from 'react';

interface CoreInfoSidebarProps {
  quizTitle: string;
  setQuizTitle: (val: string) => void;
  quizDescription: string;
  setQuizDescription: (val: string) => void;
  quizSubject: string;
  setQuizSubject: (val: string) => void;
  quizDifficulty: string;
  setQuizDifficulty: (val: string) => void;
}

export const CoreInfoSidebar: React.FC<CoreInfoSidebarProps> = ({
  quizTitle,
  setQuizTitle,
  quizDescription,
  setQuizDescription,
  quizSubject,
  setQuizSubject,
  quizDifficulty,
  setQuizDifficulty,
}) => {
  return (
    <aside className="w-full md:w-80 h-auto md:h-full max-h-[35vh] md:max-h-none overflow-y-auto border-b md:border-b-0 md:border-r border-outline-variant/50 p-4 md:p-6 flex flex-col gap-4 md:gap-6 bg-surface-container-low shrink-0">
      <div className="bg-surface-container-lowest rounded-xl p-4 md:p-5 border border-outline-variant/50 shadow-sm flex flex-col gap-4 md:gap-5">
        <h2 className="font-headline-md text-lg">Core Information</h2>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">
            Quiz Title <span className="text-error">*</span>
          </label>
          <input
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Enter quiz title..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">Description</label>
          <textarea
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface min-h-[80px] resize-y"
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            placeholder="Enter quiz description..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">
            Subject <span className="text-error">*</span>
          </label>
          <select
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface cursor-pointer"
            value={quizSubject}
            onChange={(e) => setQuizSubject(e.target.value)}
          >
            <option value="Science">Science</option>
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Biology">Biology</option>
            <option value="Literature">Literature</option>
            <option value="History">History</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Chemistry">Chemistry</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">
            Difficulty <span className="text-error">*</span>
          </label>
          <select
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface cursor-pointer"
            value={quizDifficulty}
            onChange={(e) => setQuizDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="h-px w-full bg-outline-variant/50 my-2"></div>

        <h3 className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider mb-1">Settings</h3>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="font-label-bold text-on-surface-variant text-sm">Public Access</label>
            <span className="text-xs text-on-surface-variant">Allow anyone to take this quiz</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="font-label-bold text-on-surface-variant text-sm">Shuffle Options</label>
            <span className="text-xs text-on-surface-variant">Randomize answers order</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </aside>
  );
};
