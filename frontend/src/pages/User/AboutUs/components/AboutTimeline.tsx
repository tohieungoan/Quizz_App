import React from 'react';

export const AboutTimeline: React.FC = () => {
  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low text-left">
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
                <p className="font-body-md text-on-surface-variant text-sm">
                  Started in a dorm room after observing widespread test anxiety among peers.
                </p>
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
                <p className="font-body-md text-on-surface-variant text-sm">
                  Launched our beta to 50 local schools, gathering crucial early feedback.
                </p>
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
                <p className="font-body-md text-on-surface-variant text-sm">
                  Reached 1 million users globally and introduced AI-powered personalized quizzes.
                </p>
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
                <p className="font-body-md text-on-surface-variant text-sm">
                  Redefining standards with immersive AR learning and continuous innovation.
                </p>
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
  );
};
