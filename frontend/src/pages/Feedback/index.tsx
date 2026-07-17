import React, { useState } from 'react'
import { Megaphone, Star, Send } from 'lucide-react'

export const Feedback: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setName('')
      setEmail('')
      setRole('member')
      setRating(0)
      setMessage('')
    }, 1200)
  }

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-surface-variant opacity-50 blur-[80px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-fixed opacity-40 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[800px] grid md:grid-cols-2 gap-8 items-start relative z-10">
        {/* Left Side: Header & Info */}
        <div className="flex flex-col gap-6 pt-4 md:sticky md:top-24">
          <div className="inline-flex items-center gap-2 bg-surface-container-high text-primary px-4 py-1.5 rounded-full w-fit">
            <Megaphone className="w-4 h-4" />
            <span className="font-label-bold text-label-bold">We're Listening</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-primary md:font-headline-xl text-headline-lg-mobile md:text-headline-xl">
            We Love Your Feedback
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Help us make learning even more engaging. Whether it's a feature request, a bug report, or just a high-five, we read every single message.
          </p>
          <div className="hidden md:block mt-8 rounded-xl overflow-hidden glass-card h-48 w-full relative">
            <img
              className="object-cover w-full h-full absolute inset-0"
              alt="A bright, modern workspace with a laptop, colorful sticky notes, and a steaming cup of coffee."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcYcYFSyJBT_pfJaGklr5d06GqqcFn3skwYizuKFXkuqB6OhQluK_u8JUflZtkeOr8UyH6D52PO7TdcQ_f3fYWLv6dNlDoug-HJf3Am6JYau8_J3gzexNayW8U_wQ3pPVMwQmgxzl4HnudfI9y8OLrpBieNWWV4UXEUoHo-EGXguvBqdUDWV3Z3hkm0XYvLyuVuxpn6MP-T1q4IO1SWCgpdo7YfQFR2I-Q1JnB2TspBP5vRFzELXRjcdLSR7UFamiLOo1SqNeIHog"
            />
          </div>
        </div>

        {/* Right Side: Feedback Form Glass Card */}
        <div className="glass-card rounded-xl p-8 flex flex-col gap-6 relative bg-white/70 backdrop-blur-md border border-white/30 shadow-level-1">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Thank You!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your feedback has been successfully submitted. We appreciate your response!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-button text-button hover:bg-surface-tint transition-all"
              >
                Send Another Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-label-bold text-on-surface" htmlFor="name">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border-2 border-outline-variant focus:border-primary bg-surface/50 px-4 py-3 font-body-md text-body-md text-on-surface transition-colors focus:ring-0"
                  id="name"
                  placeholder="Alex Carter"
                  type="text"
                />
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-label-bold text-on-surface" htmlFor="email">Email Address</label>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border-2 border-outline-variant focus:border-primary bg-surface/50 px-4 py-3 font-body-md text-body-md text-on-surface transition-colors focus:ring-0"
                  id="email"
                  placeholder="alex@example.com"
                  type="email"
                />
              </div>

              {/* Role Selection (Chips) */}
              <div className="flex flex-col gap-3">
                <label className="font-label-bold text-label-bold text-on-surface">I am a...</label>
                <div className="flex flex-wrap gap-3">
                  {['member', 'host'].map((r) => (
                    <label key={r} className="cursor-pointer relative">
                      <input
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="peer sr-only"
                        name="role"
                        type="radio"
                        value={r}
                      />
                      <div className="px-5 py-2 rounded-full border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-surface-variant peer-checked:text-primary text-on-surface-variant font-button text-button transition-all capitalize">
                        {r}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating System */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="font-label-bold text-label-bold text-on-surface">How would you rate your experience?</label>
                <div className="flex gap-2 text-outline-variant star-rating text-3xl" id="rating-container">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${val <= (hoverRating || rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-outline-variant'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Area */}
              <div className="flex flex-col gap-2">
                <label className="font-label-bold text-label-bold text-on-surface" htmlFor="message">Your Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border-2 border-outline-variant focus:border-primary bg-surface/50 px-4 py-3 font-body-md text-body-md text-on-surface transition-colors focus:ring-0 resize-none"
                  id="message"
                  placeholder="Tell us what you love, or what we can improve..."
                  rows={4}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                disabled={isSubmitting}
                className="mt-4 w-full bg-primary text-on-primary py-4 rounded-lg font-button text-button level-2-shadow hover:bg-surface-tint flex items-center justify-center gap-2 group disabled:opacity-80 active:scale-95 transition-transform"
                type="submit"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
