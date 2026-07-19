import { Mail, Bell, UserPlus, Lock, UserCheck, UserMinus, Shield, Info } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-margin-desktop lg:px-8 max-w-container-max mx-auto w-full">
      <div className="py-gutter w-full flex flex-col gap-6 pb-20 max-w-5xl">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="font-headline-xl text-[28px] text-[#3a1b7e] font-extrabold tracking-tight">
            Notification Settings
          </h1>
          <p className="font-body-lg text-[15px] text-on-surface-variant">
            Manage Super Admin alerts for accounts, permissions, audit logs, and security events.
          </p>
        </div>

        {/* Email preferences */}
        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-[#3a1b7e]" />
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-on-surface">Email preferences</h2>
              <p className="text-[13px] text-on-surface-variant">Control email delivery for system-level alerts only.</p>
            </div>
          </div>
          
          <hr className="border-outline-variant/20 -mx-6" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-on-surface">Send me system email alerts</span>
              <span className="text-[13px] text-on-surface-variant mt-0.5">Applies only to account lifecycle, permission, audit, and security events.</span>
            </div>
            {/* Toggle switch */}
            <button 
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 shadow-inner ${emailAlerts ? 'bg-[#3a1b7e]' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow transition-all duration-200 ${emailAlerts ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </section>

        {/* System notification channels */}
        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <Bell className="w-6 h-6 text-[#3a1b7e]" />
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-on-surface">System notification channels</h2>
                <p className="text-[13px] text-on-surface-variant">Only Super Admin account, permission, audit, and security settings are shown here.</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/20 flex flex-col pb-4 px-4">
            
            {/* Account Lifecycle */}
            <div className="border border-outline-variant/20 rounded-xl overflow-hidden mt-4 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-bright/30">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-[#3a1b7e]">Account lifecycle</span>
                  <span className="text-[12px] text-on-surface-variant mt-0.5">System-wide account events that require Super Admin visibility.</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center justify-center gap-1.5 w-14">
                    <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
                    <span className="text-[10px] text-on-surface-variant font-bold">In product</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 w-14">
                    <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
                    <span className="text-[10px] text-on-surface-variant font-bold">Email</span>
                  </div>
                </div>
              </div>
              
              <NotificationRow 
                icon={UserPlus} 
                title="New user registered" 
                subtitle="A new user registers and may need verification." 
              />
              <NotificationRow 
                icon={Lock} 
                title="Account locked" 
                subtitle="A user account is locked after failed login attempts." 
              />
              <NotificationRow 
                icon={UserCheck} 
                title="User verified" 
                subtitle="A user account is verified successfully." 
              />
              <NotificationRow 
                icon={UserMinus} 
                title="User deactivated/reactivated" 
                subtitle="A user account is deactivated or reactivated." 
                isLast
              />
            </div>

            {/* Security and permissions */}
            <div className="border border-outline-variant/20 rounded-xl overflow-hidden mt-6 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-bright/30">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-[#3a1b7e]">Security and permissions</span>
                  <span className="text-[12px] text-on-surface-variant mt-0.5">High-signal system notifications for access control and audit trails.</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center justify-center gap-1.5 w-14">
                    <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
                    <span className="text-[10px] text-on-surface-variant font-bold">In product</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 w-14">
                    <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
                    <span className="text-[10px] text-on-surface-variant font-bold">Email</span>
                  </div>
                </div>
              </div>

              <NotificationRow 
                icon={Shield} 
                title="Important permission changes" 
                subtitle="A user or group receives sensitive permission changes." 
              />
              <NotificationRow 
                icon={Info} 
                title="System audit/security events" 
                subtitle="Security-sensitive events are recorded in audit logs." 
                isLast
              />
            </div>
            
          </div>

        </section>

        {/* Save Change Button */}
        <div className="flex justify-end mt-2">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-md">
            Save Change
          </button>
        </div>

      </div>
    </main>
  );
}

function NotificationRow({ icon: Icon, title, subtitle, isLast = false }: { icon: any, title: string, subtitle: string, isLast?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 py-4 hover:bg-surface-bright/50 transition-colors ${!isLast ? 'border-b border-outline-variant/10' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5">
          <Icon className="w-5 h-5 text-on-surface-variant opacity-80" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-on-surface">{title}</span>
          <span className="text-[12px] text-on-surface-variant mt-0.5">{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="w-14 flex justify-center">
          <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
        </div>
        <div className="w-14 flex justify-center">
          <input type="checkbox" defaultChecked className="accent-[#3a1b7e] w-4 h-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
