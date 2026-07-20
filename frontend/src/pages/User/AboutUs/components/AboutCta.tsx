import React from 'react';
import { Building2, BookOpen, GraduationCap, FlaskConical, Globe } from 'lucide-react';

export const AboutCta: React.FC = () => {
  return (
    <>
      {/* PARTNERS */}
      <section className="py-16 px-margin-mobile md:px-margin-desktop bg-white border-t border-outline-variant/10 text-center">
        <div className="max-w-container-max mx-auto text-center space-y-8 animate-fade-in">
          <p className="font-body-md text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Trusted by institutions worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface">
              <Building2 className="w-6 h-6 text-primary" /> EduCorp
            </div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface">
              <BookOpen className="w-6 h-6 text-primary" /> LearnSys
            </div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface">
              <GraduationCap className="w-6 h-6 text-primary" /> Global Academy
            </div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface">
              <FlaskConical className="w-6 h-6 text-primary" /> Innovate U
            </div>
            <div className="flex items-center gap-2 font-headline-md font-bold text-lg text-on-surface">
              <Globe className="w-6 h-6 text-primary" /> Nexus Edu
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white text-center">
        <div className="max-w-[1000px] mx-auto bg-gradient-to-r from-primary to-[#7c3aed] rounded-[32px] p-12 md:p-16 text-center shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 space-y-6">
            <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Classroom?
            </h2>
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
    </>
  );
};
