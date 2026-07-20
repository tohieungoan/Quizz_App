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
    <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white text-center">
      <div className="max-w-container-max mx-auto">
        <div className="mb-16 space-y-3">
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Meet the Minds</h2>
          <p className="font-body-lg text-on-surface-variant">Passionate educators, designers, and engineers behind QuizzApp.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-[20px] p-8 text-center shadow-lg hover:-translate-y-2 hover:shadow-premium transition-all duration-300 border border-outline-variant/10 group"
            >
              <div className={`w-32 h-32 mx-auto rounded-full mb-6 p-1 bg-gradient-to-tr ${m.color} group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center`}>
                <div className={`w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center text-3xl font-headline-md font-bold ${m.text}`}>
                  {m.initials}
                </div>
              </div>
              <div className={`inline-block px-3 py-1 ${m.bg} ${m.text} rounded-full text-xs font-bold mb-3 uppercase tracking-wide`}>
                {m.dept}
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-1">{m.name}</h3>
              <p className="font-body-md text-on-surface-variant mb-6 text-sm">{m.role}</p>
              <div className="flex justify-center gap-4 text-outline">
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="LinkedIn">
                  <Globe className="w-5 h-5" />
                </a>
                <a className="hover:text-primary transition-colors duration-150" href="#" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
