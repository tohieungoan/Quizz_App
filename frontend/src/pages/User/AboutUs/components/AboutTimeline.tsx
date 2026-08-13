import React from 'react';

export const AboutTimeline: React.FC = () => {
  const events = [
    { year: '2020', title: 'The Idea Sparks', desc: 'Started in a dorm room after observing widespread test anxiety among peers.', color: 'bg-primary' },
    { year: '2021', title: 'First Prototype', desc: 'Launched our beta to 50 local schools, gathering crucial early feedback.', color: 'bg-secondary' },
    { year: '2023', title: 'Global Expansion', desc: 'Reached 1 million users globally and introduced AI-powered personalized quizzes.', color: 'bg-primary' },
    { year: '2025', title: 'The Future', desc: 'Redefining standards with immersive AR learning and continuous innovation.', color: 'bg-gradient-to-r from-primary to-secondary', isSpecial: true },
  ];

  return (
    <section className="py-12 md:py-24 px-4 sm:px-6 md:px-margin-desktop bg-surface-container-low text-left">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-10 md:mb-16 space-y-2 md:space-y-3">
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">Our Story</h2>
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant">The journey of reimagining education.</p>
        </div>

        <div className="relative">
          {/* Vertical Connector Line */}
          {/* Desktop Center Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary/20 rounded-full hidden md:block" />
          {/* Mobile Left Line */}
          <div className="absolute left-4 top-2 h-[calc(100%-24px)] w-0.5 bg-primary/20 rounded-full md:hidden" />

          <div className="space-y-8 md:space-y-16">
            {events.map((ev, i) => {
              const isEven = i % 2 === 0;
              return (
                <div
                  key={ev.year}
                  className={`relative flex flex-col md:flex-row items-start md:items-center justify-between ${
                    !isEven ? 'md:flex-row-reverse' : ''
                  } pl-10 md:pl-0`}
                >
                  {/* Mobile Circle Node */}
                  <div className="absolute left-1.5 top-1.5 md:hidden w-5 h-5 rounded-full bg-primary ring-4 ring-white flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Desktop Circle Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full ${ev.color} text-white flex items-center justify-center font-headline-md font-bold shadow-lg ring-4 ring-white z-10 text-xs sm:text-sm`}>
                      {ev.year}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={`w-full md:w-5/12 ${isEven ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'}`}>
                    <div
                      className={`bg-white p-5 sm:p-6 rounded-2xl shadow-md border ${
                        ev.isSpecial ? 'border-primary/30 ring-2 ring-primary/10 relative overflow-hidden' : 'border-outline-variant/20'
                      }`}
                    >
                      {ev.isSpecial && <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-tertiary/10 rounded-bl-full" />}
                      <span className="inline-block md:hidden px-2.5 py-0.5 mb-2 text-xs font-extrabold text-primary bg-primary/10 rounded-full">
                        {ev.year}
                      </span>
                      <h3 className={`font-headline-md text-lg sm:text-xl font-bold mb-1.5 ${ev.isSpecial ? 'text-primary' : 'text-on-surface'}`}>
                        {ev.title}
                      </h3>
                      <p className="font-body-md text-on-surface-variant text-xs sm:text-sm leading-relaxed">
                        {ev.desc}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block w-full md:w-5/12" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
