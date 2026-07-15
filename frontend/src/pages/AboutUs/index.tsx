import React from 'react'
import {
  GraduationCap, PlayCircle, Brain, TrendingUp, Award, Zap, Rocket, Eye,
  Mail, Lightbulb, Accessibility, Gamepad2, Shield, MessageSquare,
  Building2, BookOpen, FlaskConical, Globe, ArrowRight
} from 'lucide-react'

export const AboutUs: React.FC = () => {
  return (
    <div className="flex-grow w-full bg-background overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Hero Left Content */}
          <div className="space-y-8 z-10 animate-fade-in-up">
            <h1 className="font-headline-xl text-4xl lg:text-6xl font-extrabold text-on-surface leading-tight">
              Building the Future of <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Learning Together
              </span>
            </h1>
            <p className="font-body-lg text-xl text-on-surface-variant font-medium max-w-lg">
              Empowering hosts and inspiring members through gamified learning experiences.
            </p>
            <p className="font-body-md text-base text-on-surface-variant max-w-lg leading-relaxed">
              We believe learning shouldn't be a chore. QuizzApp merges high-stakes academic rigor with the dopamine rush of modern gaming, creating an ecosystem where progress is celebrated and anxiety is left behind.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="font-button text-button text-white bg-primary px-8 py-4 rounded-xl hover:shadow-premium active:scale-95 transition-all duration-200 font-semibold text-lg">
                Join QuizzApp
              </button>
              <button className="font-button text-button text-primary bg-white border-2 border-primary/20 px-8 py-4 rounded-xl hover:border-primary hover:bg-surface-container-low transition-all duration-200 font-semibold text-lg flex items-center gap-2">
                View Demo <PlayCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Right Abstract Illustration Area */}
          <div className="relative z-10 h-[500px] hidden lg:flex items-center justify-center">
            <div className="w-[400px] h-[400px] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[40px] rotate-12 blur-sm absolute" />
            <div className="w-[380px] h-[380px] bg-white rounded-[32px] shadow-premium relative z-10 p-8 flex flex-col justify-between border border-outline-variant/30">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold text-secondary flex items-center gap-1.5 shadow-sm border border-white/50">
                  <TrendingUp className="w-4 h-4" /> +24% Focus
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-surface-container-low rounded-full" />
                <div className="h-4 w-1/2 bg-surface-container-low rounded-full" />
                <div className="h-4 w-5/6 bg-surface-container-low rounded-full" />
              </div>

              {/* Floating Stat Card 1 */}
              <div className="absolute -left-12 top-28 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center gap-3 border border-white/50 min-w-[180px] whitespace-nowrap animate-bounce" style={{ animationDuration: '6s' }}>
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant font-medium leading-none">Top Rated</div>
                  <div className="font-headline-md text-sm font-bold text-on-surface mt-0.5">4.9/5 Stars</div>
                </div>
              </div>

              {/* Floating Stat Card 2 */}
              <div className="absolute -right-12 bottom-20 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center gap-3 border border-white/50 min-w-[180px] whitespace-nowrap animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>
                <div className="w-10 h-10 bg-tertiary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant font-medium leading-none">Active Users</div>
                  <div className="font-headline-md text-sm font-bold text-on-surface mt-0.5">10k+ Daily</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MISSION & VISION */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white border-t border-outline-variant/10">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="bg-white rounded-[24px] p-10 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 border border-outline-variant/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-md mb-8">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-4">Our Mission</h2>
            <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
              To democratize engaging education globally by providing accessible, intuitive, and highly motivating assessment tools that transform rote learning into an exciting journey of discovery.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white rounded-[24px] p-10 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 border border-outline-variant/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-emerald-600 flex items-center justify-center text-white shadow-md mb-8">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-4">Our Vision</h2>
            <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
              A world where test anxiety is obsolete, and every learner feels empowered, recognized, and excited to demonstrate their knowledge through interactive, gamified experiences.
            </p>
          </div>
        </div>
      </section>

      {/* 3. OUR STORY (Timeline) */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Our Story</h2>
            <p className="font-body-lg text-on-surface-variant">The journey of reimagining education.</p>
          </div>
          
          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20 rounded-full hidden md:block" />
            
            {/* Timeline Item 2020 */}
            <div className="relative flex items-center justify-between mb-16 flex-col md:flex-row">
              <div className="w-full md:w-5/12 text-right pr-0 md:pr-8 mb-8 md:mb-0">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-outline-variant/20">
                  <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">The Idea Sparks</h3>
                  <p className="font-body-md text-on-surface-variant text-sm">Started in a dorm room after observing widespread test anxiety among peers.</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center hidden md:flex">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-headline-md font-bold shadow-lg ring-4 ring-white z-10 text-sm">
                  2020
                </div>
              </div>
              <div className="w-full md:w-5/12" />
            </div>

            {/* Timeline Item 2021 */}
            <div className="relative flex items-center justify-between mb-16 flex-col md:flex-row-reverse">
              <div className="w-full md:w-5/12 text-left pl-0 md:pl-8 mb-8 md:mb-0">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-outline-variant/20">
                  <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">First Prototype</h3>
                  <p className="font-body-md text-on-surface-variant text-sm">Launched our beta to 50 local schools, gathering crucial early feedback.</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center hidden md:flex">
                <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-headline-md font-bold shadow-lg ring-4 ring-white z-10 text-sm">
                  2021
                </div>
              </div>
              <div className="w-full md:w-5/12" />
            </div>

            {/* Timeline Item 2023 */}
            <div className="relative flex items-center justify-between mb-16 flex-col md:flex-row">
              <div className="w-full md:w-5/12 text-right pr-0 md:pr-8 mb-8 md:mb-0">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-outline-variant/20">
                  <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">Global Expansion</h3>
                  <p className="font-body-md text-on-surface-variant text-sm">Reached 1 million users globally and introduced AI-powered personalized quizzes.</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center hidden md:flex">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-headline-md font-bold shadow-lg ring-4 ring-white z-10 text-sm">
                  2023
                </div>
              </div>
              <div className="w-full md:w-5/12" />
            </div>

            {/* Timeline Item 2025 */}
            <div className="relative flex items-center justify-between flex-col md:flex-row-reverse">
              <div className="w-full md:w-5/12 text-left pl-0 md:pl-8">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-primary/30 ring-2 ring-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary/10 rounded-bl-full" />
                  <h3 className="font-headline-md text-xl font-bold text-primary mb-2">The Future</h3>
                  <p className="font-body-md text-on-surface-variant text-sm">Redefining standards with immersive AR learning and continuous innovation.</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center hidden md:flex">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-headline-md font-bold shadow-lg ring-4 ring-white z-10 text-sm">
                  2025
                </div>
              </div>
              <div className="w-full md:w-5/12" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEAM SECTION */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Meet Our Team</h2>
            <p className="font-body-lg text-on-surface-variant">The passionate minds behind the platform.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-primary to-secondary group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-primary">
                  JD
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Leadership</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">Jane Doe</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">CEO &amp; Co-Founder</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-secondary to-tertiary group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-secondary">
                  JS
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Engineering</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">John Smith</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">CTO &amp; Co-Founder</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-tertiary to-primary group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-tertiary">
                  AL
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Design</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">Alice Lee</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Head of Product Design</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Team Member 4 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-primary to-indigo-300 group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-primary">
                  MR
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Marketing</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">Mark Ruiz</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Chief Marketing Officer</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Team Member 5 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-secondary to-emerald-300 group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-secondary">
                  SW
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Content</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">Sarah Wu</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Lead Educational Expert</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Team Member 6 */}
            <div className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group">
              <div className="w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr from-tertiary to-yellow-300 group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center">
                <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold text-tertiary">
                  DT
                </div>
              </div>
              <div className="inline-block px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold mb-3 uppercase tracking-wide">Support</div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">David Torres</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">Head of Customer Success</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn"><Globe className="w-5 h-5" /></a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email"><Mail className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STATS SECTION */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop bg-[#1e1b4b] text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary rounded-full blur-[100px] opacity-30" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary rounded-full blur-[100px] opacity-30" />
        
        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 text-center">
          <div className="p-4 space-y-1">
            <div className="font-headline-xl text-4xl lg:text-5xl font-extrabold text-white">500K+</div>
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">Members</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="font-headline-xl text-4xl lg:text-5xl font-extrabold text-white">50K+</div>
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">Hosts</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="font-headline-xl text-4xl lg:text-5xl font-extrabold text-white">2M+</div>
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">Quizzes Created</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="font-headline-xl text-4xl lg:text-5xl font-extrabold text-white">150+</div>
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">Countries</div>
          </div>
        </div>
      </section>

      {/* 6. CORE VALUES */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Our Core Values</h2>
            <p className="font-body-lg text-on-surface-variant">The principles that guide every feature we build.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Value 1 - Innovation */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white mb-6">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Innovation</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Constantly pushing the boundaries of how knowledge is acquired and tested to keep learning fresh.
              </p>
            </div>

            {/* Value 2 - Accessibility */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-emerald-500 flex items-center justify-center text-white mb-6">
                <Accessibility className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Accessibility</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Designing interfaces that are clear and accessible, reducing cognitive load so everyone has a fair shot.
              </p>
            </div>

            {/* Value 3 - Engagement */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-tertiary to-amber-500 flex items-center justify-center text-white mb-6">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Engagement</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Fostering intrinsic motivation through game mechanics that reward progress rather than punishing mistakes.
              </p>
            </div>

            {/* Value 4 - Security */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Security</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Protecting member data with enterprise-grade security protocols and strict privacy standards.
              </p>
            </div>

            {/* Value 5 - Community */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white mb-6">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Community</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Building spaces for educators to share resources, collaborate, and support each other globally.
              </p>
            </div>

            {/* Value 6 - Excellence */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-6">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">Excellence</h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                Focusing on real, measurable academic achievement driven by immediate, actionable feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PARTNERS */}
      <section className="py-16 px-margin-mobile md:px-margin-desktop bg-white border-t border-outline-variant/10">
        <div className="max-w-container-max mx-auto text-center space-y-8 animate-fade-in">
          <p className="font-body-md text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Trusted by institutions worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface"><Building2 className="w-6 h-6 text-primary" /> EduCorp</div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface"><BookOpen className="w-6 h-6 text-primary" /> LearnSys</div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface"><GraduationCap className="w-6 h-6 text-primary" /> Global Academy</div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface"><FlaskConical className="w-6 h-6 text-primary" /> Innovate U</div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface"><Globe className="w-6 h-6 text-primary" /> Nexus Edu</div>
          </div>
        </div>
      </section>

      {/* 8. CTA BANNER */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-[1000px] mx-auto bg-gradient-to-r from-primary to-[#7c3aed] rounded-[32px] p-12 md:p-16 text-center shadow-premium relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Group?</h2>
            <p className="font-body-lg text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
              Join thousands of educators who are making learning an achievement, not a task. Start for free today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button className="font-button text-button text-primary bg-white px-8 py-4 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-350 font-bold text-lg">
                Get Started Free
              </button>
              <button className="font-button text-button text-white border-2 border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl active:scale-95 transition-all duration-300 font-bold text-lg">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
