import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, Send, CheckCircle, Flag, HelpCircle, Star } from 'lucide-react'

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Question {
  id: number
  text: string
  points: number
  options?: {
    key: string
    label: string
    desc?: string
  }[]
  type: 'radio' | 'text'
}

// ─── Mock Questions ──────────────────────────────────────────────────────────
const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'What does HTML stand for?',
    points: 0.5,
    options: [
      { key: 'A', label: 'Hyper Text Markup Language', desc: 'The standard markup language for documents designed to be displayed in a web browser.' },
      { key: 'B', label: 'Hyper Tech Medium Language', desc: 'An obsolete term used in computing.' },
      { key: 'C', label: 'Home Tool Markup Language', desc: 'A common misconception.' },
      { key: 'D', label: 'Hyperlink and Text Markup Language', desc: 'Incorrect technical specification.' }
    ],
    type: 'radio'
  },
  {
    id: 2,
    text: 'Which CSS property controls the text size?',
    points: 0.5,
    options: [
      { key: 'A', label: 'font-style', desc: 'Specifies the font style for a text.' },
      { key: 'B', label: 'text-size', desc: 'Not a valid CSS property.' },
      { key: 'C', label: 'font-size', desc: 'Sets the size of the font.' },
      { key: 'D', label: 'text-style', desc: 'Invalid property.' }
    ],
    type: 'radio'
  },
  {
    id: 3,
    text: 'Inside which HTML element do we put the JavaScript?',
    points: 0.5,
    options: [
      { key: 'A', label: '<js>', desc: 'Invalid HTML element.' },
      { key: 'B', label: '<scripting>', desc: 'Incorrect tag specification.' },
      { key: 'C', label: '<script>', desc: 'Standard HTML tag used to embed a client-side script.' },
      { key: 'D', label: '<javascript>', desc: 'Invalid element.' }
    ],
    type: 'radio'
  },
  {
    id: 4,
    text: 'How do you write "Hello World" in an alert box?',
    points: 0.5,
    options: [
      { key: 'A', label: 'msg("Hello World");', desc: 'Not a standard JS method.' },
      { key: 'B', label: 'alertBox("Hello World");', desc: 'Incorrect syntax.' },
      { key: 'C', label: 'msgBox("Hello World");', desc: 'Used in VBScript, not JavaScript.' },
      { key: 'D', label: 'alert("Hello World");', desc: 'Standard window method to display an alert dialog.' }
    ],
    type: 'radio'
  },
  {
    id: 5,
    text: 'How do you create a function in JavaScript?',
    points: 0.5,
    options: [
      { key: 'A', label: 'function myFunction()', desc: 'Correct syntax to declare a named function.' },
      { key: 'B', label: 'function:myFunction()', desc: 'Incorrect syntax.' },
      { key: 'C', label: 'function = myFunction()', desc: 'Syntax error.' },
      { key: 'D', label: 'def myFunction()', desc: 'Python declaration format.' }
    ],
    type: 'radio'
  },
  {
    id: 6,
    text: 'Which HTML attribute is used to define inline styles?',
    points: 0.5,
    options: [
      { key: 'A', label: 'font', desc: 'Obsolete tag, not style attribute.' },
      { key: 'B', label: 'styles', desc: 'Incorrect attribute name.' },
      { key: 'C', label: 'style', desc: 'Specifies an inline style for an element.' },
      { key: 'D', label: 'class', desc: 'Used to reference class declarations in stylesheets.' }
    ],
    type: 'radio'
  },
  {
    id: 7,
    text: 'Which is the correct CSS syntax?',
    points: 0.5,
    options: [
      { key: 'A', label: '{body:color=black;}', desc: 'Invalid syntax structure.' },
      { key: 'B', label: 'body {color: black;}', desc: 'Standard syntax: selector, property, and value.' },
      { key: 'C', label: 'body:color=black;', desc: 'Invalid structure.' },
      { key: 'D', label: '{body;color:black;}', desc: 'Syntax error.' }
    ],
    type: 'radio'
  },
  {
    id: 8,
    text: 'How do you insert a comment in a CSS file?',
    points: 0.5,
    options: [
      { key: 'A', label: '// this is a comment', desc: 'Single-line comment in JS, invalid in CSS.' },
      { key: 'B', label: '/* this is a comment */', desc: 'Correct CSS comment wrapper.' },
      { key: 'C', label: "\' this is a comment", desc: 'Incorrect format.' },
      { key: 'D', label: '// this is a comment //', desc: 'Syntax error.' }
    ],
    type: 'radio'
  },
  {
    id: 9,
    text: 'Which property is used to change the background color?',
    points: 0.5,
    options: [
      { key: 'A', label: 'bgcolor', desc: 'HTML attribute, not CSS property.' },
      { key: 'B', label: 'color', desc: 'Changes text color, not background.' },
      { key: 'C', label: 'background-color', desc: 'Correct property to style elements background color.' },
      { key: 'D', label: 'background-image', desc: 'Applies an image background.' }
    ],
    type: 'radio'
  },
  {
    id: 10,
    text: 'What does CSS stand for?',
    points: 0.5,
    options: [
      { key: 'A', label: 'Cascading Style Sheets', desc: 'Style sheet language used for describing presentation of a document.' },
      { key: 'B', label: 'Creative Style Sheets', desc: 'Incorrect definition.' },
      { key: 'C', label: 'Computer Style Sheets', desc: 'Incorrect term.' },
      { key: 'D', label: 'Colorful Style Sheets', desc: 'Wrong spec name.' }
    ],
    type: 'radio'
  },
  {
    id: 11,
    text: 'Which HTML tag is used to display an image?',
    points: 0.5,
    options: [
      { key: 'A', label: '<picture>', desc: 'Container used to specify multiple image resources.' },
      { key: 'B', label: '<img>', desc: 'Standard tag to embed an image in a web page.' },
      { key: 'C', label: '<image>', desc: 'Invalid HTML element.' },
      { key: 'D', label: '<src>', desc: 'Attribute name, not tag.' }
    ],
    type: 'radio'
  },
  {
    id: 12,
    text: 'Which of the following CSS Display properties would you use to create a flexbox container?',
    points: 0.5,
    options: [
      { key: 'A', label: 'display: grid;', desc: 'Used for two-dimensional grid layouts.' },
      { key: 'B', label: 'display: flex;', desc: 'Used for one-dimensional layouts with high flexibility.' },
      { key: 'C', label: 'display: block;', desc: 'Standard block-level element behavior.' },
      { key: 'D', label: 'display: inline-flex;', desc: 'Flex container that behaves as an inline element.' }
    ],
    type: 'radio'
  },
  {
    id: 13,
    text: 'Explain briefly the difference between LocalStorage and SessionStorage in modern web browsers.',
    points: 1.0,
    type: 'text'
  }
]

// Generate remaining mock questions to reach 30
for (let i = 14; i <= 30; i++) {
  MOCK_QUESTIONS.push({
    id: i,
    text: `Mock Exam Question ${i}: Explain the performance implications of CSS selectors and rendering performance in React applications.`,
    points: 0.5,
    type: i % 5 === 0 ? 'text' : 'radio',
    options: i % 5 !== 0 ? [
      { key: 'A', label: `Standard Option A for Q${i}`, desc: 'Optimized rendering path.' },
      { key: 'B', label: `Alternative Option B for Q${i}`, desc: 'Sub-optimal resource usage.' },
      { key: 'C', label: `Incorrect Option C for Q${i}`, desc: 'May trigger page layout reflow.' },
      { key: 'D', label: `Hypothetical Option D for Q${i}`, desc: 'Invalid choice parameter.' }
    ] : undefined
  })
}

export const FormalExam: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { examTitle?: string; subject?: string } | null
  const examTitle = state?.examTitle || 'Midterm Exam'
  const subject = state?.subject || 'Web Development Fundamentals'

  // Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(11) // Question 12 (index 11)
  const [answers, setAnswers] = useState<Record<number, string>>({
    1: 'A', 2: 'C', 3: 'C', 5: 'A', 6: 'C', 7: 'B', 8: 'B', 9: 'C', 11: 'B', 12: 'B', 15: 'A'
  })
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set([4, 10]))
  const [timeLeft, setTimeLeft] = useState(2692) // 44:52 in seconds
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [successOverlayOpen, setSuccessOverlayOpen] = useState(false)

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Prevent right-click / context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleOptionSelect = (qId: number, key: string) => {
    setAnswers(prev => ({ ...prev, [qId]: key }))
  }

  const handleTextChange = (qId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  const toggleFlag = (qId: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  const activeQuestion = MOCK_QUESTIONS[currentQuestionIndex]
  const isTimeCritical = timeLeft <= 300 // Under 5 minutes

  // Calculate statistics
  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] !== '').length
  const flaggedCount = flaggedQuestions.size
  const totalQuestions = MOCK_QUESTIONS.length
  const remainingCount = totalQuestions - answeredCount
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100)

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body-md select-none">
      
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-inverse-surface shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-6 lg:px-10 h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <span className="text-xl font-headline-md font-extrabold text-primary dark:text-primary-fixed-dim">ProExam Portal</span>
          <div className="h-6 w-px bg-outline-variant/30 mx-2 hidden md:block" />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-label-bold font-extrabold text-on-surface uppercase tracking-wider">{examTitle}</span>
            <span className="text-[10px] text-on-surface-variant font-medium">{subject}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Timer Container */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
            isTimeCritical 
              ? 'bg-error-container/20 border-error text-error animate-pulse' 
              : 'bg-primary-container/10 border-primary-container/20 text-primary'
          }`}>
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            <span className="font-headline-md font-bold text-base tracking-tight tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          {/* Security Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary-container/30 text-on-secondary-container rounded-lg border border-secondary-container text-xs font-label-bold">
            <span className="material-symbols-outlined text-[16px]">security</span>
            <span className="font-bold tracking-wider">SECURE MODE: ACTIVE</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('Exam instructions: Please answer all questions, flagged items can be reviewed at any time. Tab navigation logs are active.')}
              className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors text-[20px]"
            >
              help_outline
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-fixed-dim">
              <img 
                className="w-full h-full object-cover" 
                alt="Student Avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUDMtTUsOHBS-aXmPO_Kd3pWSctn7uhxCZWUSlO-4EYnQx7XlCn_m3oBTnSV3y0ysLyELAdf7eJbWQWPkqIgYyoiBon11zi1s9v483nr8ObyX26KcsXPe4E0-LRryVc6g7RcV0ZOEr6-rSGEUHAl5arRQQiTTyQ8SUaAPs_X9h6EV2G2ktZDRuavM_i1yy2gZrMPIVHwIScSgrR1ZOLUMGOpD4Scp3pOVhCAgxxQL74ENmz3PcNTHp60qIgmUf9ZRO9dhYYbOFQz8"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-grow">
        
        {/* Left Panel: Active Question */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-label-bold text-xs font-bold">
                  Question {activeQuestion.id}
                </span>
                <span className="text-on-surface-variant text-xs font-semibold">
                  {activeQuestion.points} Point{activeQuestion.points > 1 ? 's' : ''}
                </span>
              </div>
              <button 
                onClick={() => toggleFlag(activeQuestion.id)}
                className={`flex items-center gap-2 text-xs font-bold transition-colors group ${
                  flaggedQuestions.has(activeQuestion.id) ? 'text-tertiary' : 'text-outline hover:text-tertiary'
                }`}
              >
                <span 
                  className="material-symbols-outlined text-[18px]" 
                  style={{ fontVariationSettings: flaggedQuestions.has(activeQuestion.id) ? "'FILL' 1" : "'FILL' 0" }}
                >
                  flag
                </span>
                <span>Mark for Review</span>
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-outline-variant/30 text-left">
              <h2 className="font-headline-md text-xl lg:text-2xl font-bold text-on-surface mb-8 leading-snug">
                {activeQuestion.text}
              </h2>

              {/* Question options */}
              {activeQuestion.type === 'radio' && activeQuestion.options ? (
                <div className="space-y-4">
                  {activeQuestion.options.map(opt => {
                    const isSelected = answers[activeQuestion.id] === opt.key
                    return (
                      <label 
                        key={opt.key}
                        onClick={() => handleOptionSelect(activeQuestion.id, opt.key)}
                        className={`group flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary-container bg-primary-container/5' 
                            : 'border-outline-variant hover:border-primary-container hover:bg-primary-container/5'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`question-${activeQuestion.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className={`w-5 h-5 focus:ring-primary border-outline-variant mr-4 ${
                            isSelected ? 'text-primary border-primary-container' : 'text-primary'
                          }`}
                        />
                        <div className="flex flex-col text-left">
                          <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                            {opt.key}. {opt.label}
                          </span>
                          {opt.desc && (
                            <span className="text-xs text-on-surface-variant mt-0.5">{opt.desc}</span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                /* Essay / Text Answer box */
                <div className="space-y-4">
                  <textarea 
                    value={answers[activeQuestion.id] || ''}
                    onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                    className="w-full rounded-lg border-2 border-outline-variant/30 focus:border-primary focus:ring-0 p-4 font-body-md text-sm text-on-surface h-48 bg-[#f9f9ff] outline-none transition-colors"
                    placeholder="Type your detailed answer here..."
                  />
                  <div className="p-4 bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant/40 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">info</span>
                    <p className="text-xs text-on-surface-variant italic leading-relaxed text-left">
                      Your answer will be automatically saved as you type. Limit your response to 500 words.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-outline text-on-surface-variant font-button text-xs font-bold rounded-lg hover:bg-surface-variant transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button 
              disabled={currentQuestionIndex === MOCK_QUESTIONS.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-10 py-3 bg-primary text-on-primary font-button text-xs font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Question
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Panel: Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-outline-variant/30 flex flex-col shadow-sm">
            <h3 className="font-headline-md text-sm font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">apps</span>
              Exam Navigation
            </h3>

            {/* Grid of Questions */}
            <div className="grid grid-cols-5 gap-2.5 mb-8">
              {MOCK_QUESTIONS.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex
                const isFlagged = flaggedQuestions.has(q.id)
                const isAnswered = answers[q.id] && answers[q.id] !== ''

                let btnClass = 'bg-outline-variant/20 text-on-surface-variant hover:bg-outline-variant/40' // Unanswered
                if (isCurrent) {
                  btnClass = 'border-2 border-primary bg-white text-primary font-extrabold shadow-sm'
                } else if (isFlagged) {
                  btnClass = 'bg-tertiary text-on-tertiary hover:opacity-90'
                } else if (isAnswered) {
                  btnClass = 'bg-secondary text-on-secondary hover:opacity-90'
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${btnClass}`}
                  >
                    {q.id}
                  </button>
                )
              })}
            </div>

            {/* Stats Legend */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">{answeredCount} Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">{flaggedCount} Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">{remainingCount} Remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                <span className="text-[11px] font-label-bold text-on-surface-variant font-semibold">Current</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-on-surface-variant">Overall Progress</span>
                <span className="text-primary">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-500 rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button 
              onClick={() => setSubmitModalOpen(true)}
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-button text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Exam
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-4 bg-error-container/10 border border-error-container rounded-xl flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              Leaving this tab or minimizing the window will be logged and may invalidate your secure exam session.
            </p>
          </div>
        </aside>
      </main>

      {/* Double-Confirmation Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full m-4 border border-outline-variant/20 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-5 text-tertiary shadow-inner">
              <span className="material-symbols-outlined text-[32px]">assignment_late</span>
            </div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface mb-2">Final Submission</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              You still have <span className="font-bold text-primary">{remainingCount} unanswered</span> and <span className="font-bold text-tertiary">{flaggedCount} flagged</span> questions. Are you sure you want to end the exam?
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setSubmitModalOpen(false)
                  setSuccessOverlayOpen(true)
                }}
                className="w-full py-3.5 bg-primary text-on-primary font-button text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-98"
              >
                Yes, Submit My Exam
              </button>
              <button 
                onClick={() => setSubmitModalOpen(false)}
                className="w-full py-3.5 bg-surface-container-high text-on-surface-variant font-button text-xs font-bold rounded-xl hover:bg-surface-variant/80 transition-all active:scale-98"
              >
                No, Continue Working
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Feedback Overlay */}
      {successOverlayOpen && (
        <div className="fixed inset-0 z-[110] bg-surface flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center max-w-lg p-8">
            <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
              <CheckCircle className="w-12 h-12 text-secondary" />
            </div>
            <h1 className="font-headline-xl text-3xl font-black text-on-surface mb-3 tracking-tight">Submission Successful</h1>
            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
              Your exam for <strong className="text-on-surface">{subject}</strong> has been received. Your grade will be published after the review period.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 bg-primary hover:bg-primary/95 text-on-primary font-button text-xs font-bold rounded-xl shadow-md active:scale-98 transition-all"
              >
                View Summary & Return
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 text-primary font-button text-xs font-bold hover:bg-primary/5 rounded-xl transition-all"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
