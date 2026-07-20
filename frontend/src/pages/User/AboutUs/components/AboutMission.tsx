import React from 'react';
import { Rocket, Eye } from 'lucide-react';

export const AboutMission: React.FC = () => {
  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white border-t border-outline-variant/10 text-left">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mission Card */}
        <div className="bg-white rounded-[24px] p-10 shadow-premium hover:shadow-premium-hover transition-shadow duration-300 border border-outline-variant/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-300" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-md mb-8">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-4">Our Mission</h2>
          <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
            To democratize engaging education globally by providing accessible, intuitive, and highly motivating assessment
            tools that transform rote learning into an exciting journey of discovery.
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
            A world where test anxiety is obsolete, and every learner feels empowered, recognized, and excited to
            demonstrate their knowledge through interactive, gamified experiences.
          </p>
        </div>
      </div>
    </section>
  );
};
