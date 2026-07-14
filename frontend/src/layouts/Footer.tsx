import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Share2, Play, Mail, ArrowRight, Check } from 'lucide-react'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setTimeout(() => {
        setSubscribed(false)
        setEmail('')
      }, 3000)
    }
  }

  return (
    <footer className="bg-[#1e1b4b] text-indigo-200 py-16 px-margin-mobile md:px-margin-desktop border-t border-indigo-950">
      <div className="max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-headline-md text-headline-md font-bold tracking-tight">QuizzApp</span>
            </div>
            
            <p className="font-body-md text-indigo-300 pr-4 leading-relaxed">
              Empowering education through interactive play and measurable results.
            </p>

            <div className="space-y-3">
              <h4 className="font-headline-md text-sm text-white font-semibold">Subscribe to our newsletter</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-indigo-950/50 border border-indigo-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary flex-grow font-body-md text-sm placeholder-indigo-400"
                  placeholder="Enter your email"
                  type="email"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-xl transition-colors font-button text-sm font-semibold flex items-center gap-1.5 active:scale-95 duration-150"
                >
                  {subscribed ? <Check className="w-4 h-4" /> : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>

          {/* Links 1 - Product */}
          <div>
            <h4 className="font-headline-md text-sm text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-3 font-body-md text-sm">
              <li><a className="hover:text-white transition-colors duration-150" href="#">Features</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Pricing</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Use Cases</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Integrations</a></li>
            </ul>
          </div>

          {/* Links 2 - Company */}
          <div>
            <h4 className="font-headline-md text-sm text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3 font-body-md text-sm">
              <li><Link className="text-white hover:text-white font-medium transition-colors duration-150" to="/about">About Us</Link></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Careers</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Blog</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Contact</a></li>
            </ul>
          </div>

          {/* Links 3 - Legal */}
          <div>
            <h4 className="font-headline-md text-sm text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-3 font-body-md text-sm">
              <li><a className="hover:text-white transition-colors duration-150" href="#">Terms of Service</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Cookie Policy</a></li>
              <li><a className="hover:text-white transition-colors duration-150" href="#">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-indigo-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-sm text-indigo-400">
            © 2026 QuizzApp. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all text-indigo-300" href="#" aria-label="Share">
              <Share2 className="w-[18px] h-[18px]" />
            </a>
            <a className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all text-indigo-300" href="#" aria-label="Play">
              <Play className="w-[18px] h-[18px] fill-current" />
            </a>
            <a className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all text-indigo-300" href="#" aria-label="Mail">
              <Mail className="w-[18px] h-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
