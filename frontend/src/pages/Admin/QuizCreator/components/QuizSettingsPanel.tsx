import { Dropdown } from '@/components/ui/Dropdown';

interface QuizSettingsPanelProps {
  visibleOnMobile: boolean;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  isPublic: boolean;
  shuffleOptions: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
  onShuffleOptionsChange: (value: boolean) => void;
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={event => onChange(event.target.checked)} />
    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
  </label>
);

export function QuizSettingsPanel(props: QuizSettingsPanelProps) {
  return (
    <aside className={`${props.visibleOnMobile ? 'flex' : 'hidden'} md:flex w-full md:w-80 h-full overflow-y-auto border-r border-outline-variant/50 p-4 md:p-6 flex-col gap-4 md:gap-6 bg-surface-container-low shrink-0 animate-in slide-in-from-right-4 md:animate-none`}>
      <div className="bg-surface-container-lowest rounded-xl p-4 md:p-5 border border-outline-variant/50 shadow-sm flex flex-col gap-4 md:gap-5">
        <h2 className="font-headline-md text-lg">Core Information</h2>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">Quiz Title <span className="text-error">*</span></label>
          <input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface" value={props.title} onChange={event => props.onTitleChange(event.target.value)} placeholder="Enter quiz title..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold text-on-surface-variant text-sm">Description</label>
          <textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface min-h-[80px] resize-y" value={props.description} onChange={event => props.onDescriptionChange(event.target.value)} placeholder="Enter quiz description..." />
        </div>
        <div className="flex flex-col gap-1.5 z-20">
          <label className="font-label-bold text-on-surface-variant text-sm">Subject <span className="text-error">*</span></label>
          <Dropdown value={props.subject} onChange={props.onSubjectChange} options={["Science", "Physics", "Mathematics", "Biology", "Literature", "History", "Computer Science", "Chemistry"]} className="w-full bg-surface-container-low border-outline-variant" />
        </div>
        <div className="flex flex-col gap-1.5 z-10">
          <label className="font-label-bold text-on-surface-variant text-sm">Difficulty <span className="text-error">*</span></label>
          <Dropdown value={props.difficulty} onChange={props.onDifficultyChange} options={["Easy", "Medium", "Hard"]} className="w-full bg-surface-container-low border-outline-variant" />
        </div>
        <div className="h-px w-full bg-outline-variant/50 my-2" />
        <h3 className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider mb-1">Settings</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col"><label className="font-label-bold text-on-surface-variant text-sm">Public Access</label><span className="text-xs text-on-surface-variant">Allow anyone to take this quiz</span></div>
          <Toggle checked={props.isPublic} onChange={props.onPublicChange} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col"><label className="font-label-bold text-on-surface-variant text-sm">Shuffle Options</label><span className="text-xs text-on-surface-variant">Randomize answers order</span></div>
          <Toggle checked={props.shuffleOptions} onChange={props.onShuffleOptionsChange} />
        </div>
      </div>
    </aside>
  );
}
