import React from 'react';
import { PlayCircle, Brain, TrendingUp, Award, Zap } from 'lucide-react';

export const AboutHero: React.FC = () => {
  return (
    <section className="relative pt-20 pb-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden text-left">
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
            We believe learning shouldn't be a chore. QuizzApp merges high-stakes academic rigor with the dopamine rush of
            modern gaming, creating an ecosystem where progress is celebrated and anxiety is left behind.
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
            <div
              className="absolute -left-12 top-28 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center gap-3 border border-white/50 min-w-[180px] whitespace-nowrap animate-bounce"
              style={{ animationDuration: '6s' }}
            >
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-on-surface-variant font-medium leading-none">Top Rated</div>
                <div className="font-headline-md text-sm font-bold text-on-surface mt-0.5">4.9/5 Stars</div>
              </div>
            </div>

            {/* Floating Stat Card 2 */}
            <div
              className="absolute -right-12 bottom-20 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center gap-3 border border-white/50 min-w-[180px] whitespace-nowrap animate-bounce"
              style={{ animationDuration: '6s', animationDelay: '2s' }}
            >
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
  );
};
