import { X, FileText, Shield } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TERMS_CONTENT = {
  title: 'Terms of Service',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      content: 'By accessing and using QuizzApp, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.'
    },
    {
      heading: '2. User Accounts',
      content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.'
    },
    {
      heading: '3. Acceptable Use',
      content: 'You agree not to use QuizzApp for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the platform.'
    },
    {
      heading: '4. Intellectual Property',
      content: 'All content, features, and functionality of QuizzApp are owned by us and are protected by international copyright, trademark, and other intellectual property laws.'
    },
    {
      heading: '5. Quiz Content',
      content: 'Users who create quizzes retain ownership of their content. By creating quizzes on QuizzApp, you grant us a non-exclusive license to display and distribute your content within the platform.'
    },
    {
      heading: '6. Privacy',
      content: 'Your use of QuizzApp is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal data.'
    },
    {
      heading: '7. Termination',
      content: 'We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.'
    },
    {
      heading: '8. Limitation of Liability',
      content: 'QuizzApp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.'
    },
    {
      heading: '9. Changes to Terms',
      content: 'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page.'
    },
    {
      heading: '10. Contact Us',
      content: 'If you have any questions about these Terms, please contact us at support@quizzapp.com.'
    }
  ]
};

const PRIVACY_CONTENT = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: '1. Information We Collect',
      content: 'We collect information you provide directly, including your name, email address, and quiz data. We also automatically collect certain information about your device and usage of our platform.'
    },
    {
      heading: '2. How We Use Your Information',
      content: 'We use your information to provide and improve our services, personalize your experience, send notifications, and communicate with you about updates and offers.'
    },
    {
      heading: '3. Information Sharing',
      content: 'We do not sell your personal information. We may share your information with trusted third-party service providers who assist us in operating our platform, subject to confidentiality agreements.'
    },
    {
      heading: '4. Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.'
    },
    {
      heading: '5. Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookies through your browser settings.'
    },
    {
      heading: '6. Your Rights',
      content: 'You have the right to access, correct, or delete your personal data. You may also export your data or request a copy of all information we hold about you.'
    },
    {
      heading: '7. Data Retention',
      content: 'We retain your personal information for as long as your account is active or as needed to provide you services. We will delete your data upon account deletion request.'
    },
    {
      heading: '8. Children\'s Privacy',
      content: 'QuizzApp is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete the information.'
    },
    {
      heading: '9. Changes to This Policy',
      content: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.'
    },
    {
      heading: '10. Contact Us',
      content: 'If you have any questions about this Privacy Policy, please contact us at privacy@quizzapp.com.'
    }
  ]
};

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  if (!isOpen) return null;

  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;
  const Icon = type === 'terms' ? FileText : Shield;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col border border-outline-variant/30 overflow-hidden max-h-[85vh]">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-headline-sm font-bold text-on-surface">
              {content.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <div key={index}>
                <h3 className="text-base font-headline-sm font-bold text-on-surface mb-2">
                  {section.heading}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 bg-surface-bright border-t border-outline-variant/30 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-button bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
