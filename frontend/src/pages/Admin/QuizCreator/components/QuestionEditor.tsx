import { RefObject } from 'react';
import { Check, Image as ImageIcon, Mic, Plus, X } from 'lucide-react';
import { CloudUpload, CloudUploadRef } from '@/components/ui/CloudUpload';
import { Dropdown } from '@/components/ui/Dropdown';
import { QuestionDifficulty, QuestionType } from '../quizCreatorModels';

interface QuestionEditorProps {
  type: QuestionType;
  text: string;
  multipleChoiceOptions: string[];
  multipleChoiceCorrect: number;
  trueFalseCorrect: boolean;
  shortAnswer: string;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  mediaUrl?: string;
  audioUrl?: string;
  mediaFile: File | null;
  audioFile: File | null;
  resetKey: number;
  imageUploadRef: RefObject<CloudUploadRef>;
  audioUploadRef: RefObject<CloudUploadRef>;
  isUploading: boolean;
  onTypeChange: (type: QuestionType) => void;
  onTextChange: (text: string) => void;
  onMultipleChoiceCorrectChange: (index: number) => void;
  onMultipleChoiceOptionChange: (index: number, value: string) => void;
  onRemoveMultipleChoiceOption: (index: number) => void;
  onAddMultipleChoiceOption: () => void;
  onTrueFalseCorrectChange: (value: boolean) => void;
  onShortAnswerChange: (value: string) => void;
  onDifficultyChange: (value: QuestionDifficulty) => void;
  onTimeLimitChange: (value: number) => void;
  onImageSelect: (file: File | null) => Promise<void>;
  onAudioSelect: (file: File | null) => Promise<void>;
  onClose: () => void;
  onSave: (nextType: QuestionType | null) => void;
}

export function QuestionEditor(props: QuestionEditorProps) {
  const saveDisabled = !props.text.trim()
    || (props.type === 'short' && !props.shortAnswer.trim())
    || props.isUploading;

  return (
    <div className="shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary-fixed-dim" />
      <div className="flex flex-col gap-2.5">
        <label className="font-headline-md text-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">1</span>
            Question Text <span className="text-error">*</span>
            <div className="ml-0 sm:ml-4 flex items-center gap-2 border-l border-outline-variant/30 pl-4">
              <span className="text-xs text-on-surface-variant font-medium">Type:</span>
              <select value={props.type} onChange={event => props.onTypeChange(event.target.value as QuestionType)} className="bg-surface-container-low border border-outline-variant/50 hover:border-outline-variant rounded-md px-3 py-1 text-sm font-medium text-on-surface focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer shadow-sm transition-colors">
                <option value="multiple">Multiple Choice</option><option value="truefalse">True / False</option><option value="short">Short Answer</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={event => { event.preventDefault(); props.imageUploadRef.current?.openDialog(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${props.mediaUrl || props.mediaFile ? 'bg-primary/10 border-primary/50 text-primary' : 'border-outline-variant/50 text-on-surface hover:text-primary hover:bg-primary/5'}`}><ImageIcon className="w-3.5 h-3.5" /> Image</button>
            <button type="button" onClick={event => { event.preventDefault(); props.audioUploadRef.current?.openDialog(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${props.audioUrl || props.audioFile ? 'bg-secondary/10 border-secondary/50 text-secondary' : 'border-outline-variant/50 text-on-surface hover:text-secondary hover:bg-secondary/5'}`}><Mic className="w-3.5 h-3.5" /> Audio</button>
          </div>
        </label>
        <div className="flex flex-col gap-2">
          <CloudUpload key={`img-${props.resetKey}`} ref={props.imageUploadRef} hideDropzone acceptedTypes="image/*,video/*" label={(props.mediaUrl || props.mediaFile) ? 'Change Image or Video' : 'Upload Image or Video for this question'} initialPreviewUrl={props.mediaUrl} file={props.mediaFile} onFileSelect={props.onImageSelect} />
          <CloudUpload key={`aud-${props.resetKey}`} ref={props.audioUploadRef} hideDropzone acceptedTypes="audio/*" label={(props.audioUrl || props.audioFile) ? 'Change Audio' : 'Upload Audio for this question'} initialPreviewUrl={props.audioUrl} file={props.audioFile} onFileSelect={props.onAudioSelect} />
        </div>
        <textarea value={props.text} onChange={event => props.onTextChange(event.target.value)} className="w-full border-2 border-outline-variant/50 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none shadow-sm text-sm mt-2" placeholder="Type your question here..." rows={3} />
      </div>

      <div className="flex flex-col gap-3">
        <label className="font-headline-md text-base flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">2</span>Answers Configuration</label>
        {props.type === 'multiple' && <div className="flex flex-col gap-2">
          {props.multipleChoiceOptions.map((option, index) => <div key={index} className={`flex items-center gap-3 bg-surface-container-lowest p-1.5 pr-3 rounded-lg border-2 transition-all ${props.multipleChoiceCorrect === index ? 'border-primary shadow-sm bg-primary/5' : 'border-outline-variant/30 hover:border-outline-variant'}`}>
            <button type="button" onClick={() => props.onMultipleChoiceCorrectChange(index)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 cursor-pointer transition-colors shrink-0 ${props.multipleChoiceCorrect === index ? 'bg-primary border-primary text-white' : 'border-outline-variant/50 hover:border-outline-variant'}`}>{props.multipleChoiceCorrect === index && <Check className="w-3.5 h-3.5" />}</button>
            <input type="text" value={option} onChange={event => props.onMultipleChoiceOptionChange(index, event.target.value)} placeholder={`Option ${index + 1}`} className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm outline-none ${props.multipleChoiceCorrect === index ? 'font-medium text-primary' : ''}`} />
            <button type="button" onClick={() => props.onRemoveMultipleChoiceOption(index)} disabled={props.multipleChoiceOptions.length <= 2} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-md disabled:opacity-30 transition-colors"><X className="w-4 h-4" /></button>
          </div>)}
          {props.multipleChoiceOptions.length < 8
            ? <button type="button" onClick={props.onAddMultipleChoiceOption} className="mt-1 py-2 border-2 border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors font-button flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Option</button>
            : <div className="mt-1 text-center text-[11px] text-error font-medium">Maximum limit of 8 options reached.</div>}
        </div>}
        {props.type === 'truefalse' && <div className="grid grid-cols-2 gap-4 mt-1">
          <button type="button" onClick={() => props.onTrueFalseCorrectChange(true)} className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${props.trueFalseCorrect ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${props.trueFalseCorrect ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}><Check className="w-5 h-5" /></div><span className={`text-lg font-headline-md ${props.trueFalseCorrect ? 'text-primary' : 'text-on-surface-variant'}`}>True</span>{props.trueFalseCorrect && <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full border border-primary/20">Correct</span>}</button>
          <button type="button" onClick={() => props.onTrueFalseCorrectChange(false)} className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${!props.trueFalseCorrect ? 'border-error bg-error-container/20 ring-2 ring-error/20 shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${!props.trueFalseCorrect ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'}`}><X className="w-5 h-5" /></div><span className={`text-lg font-headline-md ${!props.trueFalseCorrect ? 'text-error' : 'text-on-surface-variant'}`}>False</span>{!props.trueFalseCorrect && <span className="text-[10px] text-error font-bold uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full border border-error/20">Correct</span>}</button>
        </div>}
        {props.type === 'short' && <div className="flex flex-col gap-2 mt-1"><div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50"><label className="block font-label-bold text-sm text-on-surface-variant mb-1.5">Accepted Answer Keyword(s)</label><input type="text" value={props.shortAnswer} onChange={event => props.onShortAnswerChange(event.target.value)} className="w-full bg-white border-2 border-outline-variant/50 rounded-lg px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" placeholder="e.g. Mitochondria" /></div></div>}
      </div>

      <div className="flex flex-col gap-3">
        <label className="font-headline-md text-base flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs font-bold">3</span>Question Settings</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-bold text-on-surface-variant">Difficulty <span className="text-error">*</span></label><Dropdown value={props.difficulty} onChange={value => props.onDifficultyChange(value as QuestionDifficulty)} options={[{ value: 'EASY', label: 'Easy' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HARD', label: 'Hard' }]} className="w-full rounded-xl bg-surface border-outline-variant" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-bold text-on-surface-variant">Time Limit (seconds) <span className="text-error">*</span></label><input type="number" value={props.timeLimit} onChange={event => props.onTimeLimitChange(Number(event.target.value))} className="w-full bg-white border border-outline-variant/50 rounded-lg px-3 py-2.5 focus:border-primary outline-none text-sm shadow-sm" placeholder="e.g. 60" min={10} /></div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-6 pt-5 border-t border-outline-variant/50"><div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
        <button type="button" onPointerDown={event => { event.preventDefault(); props.onClose(); }} onClick={event => { event.preventDefault(); props.onClose(); }} className="font-bold text-sm bg-surface-container-high border border-transparent text-on-surface-variant px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-outline-variant/30 hover:text-on-surface transition-colors shadow-sm"><X className="w-4 h-4" /> Close</button>
        <button type="button" onClick={event => { event.preventDefault(); props.onSave(null); }} disabled={saveDisabled} className="font-bold text-sm bg-white border-2 border-primary text-primary px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{props.isUploading ? <>Uploading...</> : <><Check className="w-4 h-4" /> Save</>}</button>
        <button type="button" onClick={event => { event.preventDefault(); props.onSave(props.type); }} disabled={saveDisabled} className="font-bold text-sm bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 active:bg-primary/80 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{props.isUploading ? <>Uploading...</> : <><Plus className="w-4 h-4" /> Save & Next</>}</button>
      </div></div>
    </div>
  );
}
