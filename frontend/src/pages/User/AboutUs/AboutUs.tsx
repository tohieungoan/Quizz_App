import React from 'react';
import { AboutHero } from './components/AboutHero';
import { AboutMission } from './components/AboutMission';
import { AboutTimeline } from './components/AboutTimeline';
import { AboutTeam } from './components/AboutTeam';
import { AboutValues } from './components/AboutValues';
import { AboutCta } from './components/AboutCta';

export const AboutUs: React.FC = () => {
  return (
    <div className="flex-grow w-full bg-background overflow-x-hidden">
      <AboutHero />
      <AboutMission />
      <AboutTimeline />
      <AboutTeam />

      {/* Stats Section */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop bg-[#1e1b4b] text-white relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary rounded-full blur-[100px] opacity-30" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary rounded-full blur-[100px] opacity-30" />

        <div className="max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
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
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">
              Quizzes Created
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="font-headline-xl text-4xl lg:text-5xl font-extrabold text-white">150+</div>
            <div className="font-body-md text-indigo-200 font-medium tracking-wide uppercase text-xs">Countries</div>
          </div>
        </div>
      </section>

      <AboutValues />
      <AboutCta />
    </div>
  );
};
