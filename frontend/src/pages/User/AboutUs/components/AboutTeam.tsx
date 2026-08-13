import React from 'react';
import { Globe, Mail } from 'lucide-react';

export const AboutTeam: React.FC = () => {
  const teamMembers = [
    { initials: 'AL', name: 'Alice Lee', role: 'Head of Product Design', dept: 'Design', color: 'from-tertiary to-primary', text: 'text-tertiary', bg: 'bg-tertiary/10' },
    { initials: 'MR', name: 'Mark Ruiz', role: 'Chief Marketing Officer', dept: 'Marketing', color: 'from-primary to-indigo-300', text: 'text-primary', bg: 'bg-primary/10' },
    { initials: 'SW', name: 'Sarah Wu', role: 'Lead Educational Expert', dept: 'Content', color: 'from-secondary to-emerald-300', text: 'text-secondary', bg: 'bg-secondary/10' },
    { initials: 'DT', name: 'David Torres', role: 'Head of Customer Success', dept: 'Support', color: 'from-tertiary to-yellow-300', text: 'text-tertiary', bg: 'bg-tertiary/10' },
  ];

  return (
    <section className="py-12 md:py-24 px-4 sm:px-6 md:px-margin-desktop bg-white text-center">
      <div className="max-w-container-max mx-auto">
        <div className="mb-10 md:mb-16 space-y-2 md:space-y-3">
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">Meet the Minds</h2>
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant">Passionate educators, designers, and engineers behind QuizzApp.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
          {teamMembers.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-8 text-center shadow-md sm:shadow-lg hover:-translate-y-1 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group flex flex-col justify-between"
            >
              <div>
                <div className={`w-20 h-20 sm:w-32 sm:h-32 mx-auto rounded-full mb-3 sm:mb-6 p-1 bg-gradient-to-tr ${m.color} group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center`}>
                  <div className={`w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] bg-white rounded-full flex items-center justify-center text-xl sm:text-3xl font-headline-md font-bold ${m.text}`}>
                    {m.initials}
                  </div>
                </div>
                <div className={`inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 ${m.bg} ${m.text} rounded-full text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 uppercase tracking-wide`}>
                  {m.dept}
                </div>
                <h3 className="font-headline-md text-base sm:text-2xl font-bold text-on-surface mb-0.5 sm:mb-1 line-clamp-1">{m.name}</h3>
                <p className="font-body-md text-on-surface-variant mb-4 text-xs sm:text-sm line-clamp-2">{m.role}</p>
              </div>
              <div className="flex justify-center gap-3 sm:gap-4 text-outline pt-1">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
