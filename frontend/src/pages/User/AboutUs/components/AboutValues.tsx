import React from 'react';
import { Lightbulb, Accessibility, Gamepad2, Shield, MessageSquare, Award } from 'lucide-react';

export const AboutValues: React.FC = () => {
  const values = [
    { icon: Lightbulb, title: 'Innovation', desc: 'Constantly pushing the boundaries of how knowledge is acquired and tested to keep learning fresh.', gradient: 'from-primary to-indigo-500' },
    { icon: Accessibility, title: 'Accessibility', desc: 'Designing interfaces that are clear and accessible, reducing cognitive load so everyone has a fair shot.', gradient: 'from-secondary to-emerald-500' },
    { icon: Gamepad2, title: 'Engagement', desc: 'Fostering intrinsic motivation through game mechanics that reward progress rather than punishing mistakes.', gradient: 'from-tertiary to-amber-500' },
    { icon: Shield, title: 'Security', desc: 'Protecting member data with enterprise-grade security protocols and strict privacy standards.', gradient: 'from-gray-700 to-gray-900' },
    { icon: MessageSquare, title: 'Community', desc: 'Building spaces for educators to share resources, collaborate, and support each other globally.', gradient: 'from-pink-500 to-rose-500' },
    { icon: Award, title: 'Excellence', desc: 'Focusing on real, measurable academic achievement driven by immediate, actionable feedback.', gradient: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-low text-left">
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface">Our Core Values</h2>
          <p className="font-body-lg text-on-surface-variant">The principles that guide every feature we build.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center text-white mb-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">{v.title}</h3>
                <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
