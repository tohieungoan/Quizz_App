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

        {/* Email Digest Settings */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Email Digest & Alerts</h3>
                <p className="text-sm text-on-surface-variant">Receive automated email notifications for system events.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={emailAlerts} 
                onChange={() => setEmailAlerts(!emailAlerts)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"></div>

          {/* Alert Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 rounded text-primary focus:ring-primary" />
              <div>
                <h4 className="font-bold text-sm text-on-surface">Security & Audit Logs</h4>
                <p className="text-xs text-on-surface-variant">Alert on failed logins, privilege changes, and API key modifications.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 rounded text-primary focus:ring-primary" />
              <div>
                <h4 className="font-bold text-sm text-on-surface">New Account Registrations</h4>
                <p className="text-xs text-on-surface-variant">Notify when a new host or admin account is registered.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-start gap-3">
              <input type="checkbox" defaultChecked className="mt-1 rounded text-primary focus:ring-primary" />
              <div>
                <h4 className="font-bold text-sm text-on-surface">Room High Traffic Warnings</h4>
                <p className="text-xs text-on-surface-variant">Alert when a live room exceeds 100 concurrent participants.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex items-start gap-3">
              <input type="checkbox" className="mt-1 rounded text-primary focus:ring-primary" />
              <div>
                <h4 className="font-bold text-sm text-on-surface">Weekly Performance Summary</h4>
                <p className="text-xs text-on-surface-variant">Receive a weekly summary email of platform engagement metrics.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
