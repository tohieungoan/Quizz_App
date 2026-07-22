import { Mail, Bell, UserPlus, Lock, UserCheck, UserMinus, Shield, Info, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 relative pb-20">
      <div className="p-6 md:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline-xl text-[28px] text-primary font-extrabold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center shadow-sm">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            Notification Settings
          </h1>
          <p className="font-body-lg text-[15px] text-slate-500 mt-1">
            Manage Super Admin alerts for accounts, permissions, audit logs, and security events.
          </p>
        </div>

        {/* Email preferences Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="w-[22px] h-[22px] text-[#2563eb]" strokeWidth={2} />
              <h2 className="text-lg font-bold text-[#2563eb]">Email preferences</h2>
            </div>
            <p className="text-[14px] text-slate-500 ml-[34px]">
              Control email delivery for system-level alerts only.
            </p>
          </div>
          
          <div className="h-px bg-slate-100 w-full"></div>

          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-0.5">Send me system email alerts</h3>
                <p className="text-[13px] text-slate-500">Applies only to account lifecycle, permission, audit, and security events.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  checked={emailAlerts} 
                  onChange={() => setEmailAlerts(!emailAlerts)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System notification channels Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <Bell className="w-[22px] h-[22px] text-[#2563eb]" strokeWidth={2} />
              <h2 className="text-lg font-bold text-[#2563eb]">System notification channels</h2>
            </div>
            <p className="text-[14px] text-slate-500 ml-[34px]">
              Only Super Admin account, permission, audit, and security settings are shown here.
            </p>
          </div>
          
          <div className="h-px bg-slate-100 w-full mb-4"></div>

          {/* Group 1: Account lifecycle */}
          <div className="px-6 mb-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-0.5">Account lifecycle</h3>
                <p className="text-[13px] text-slate-500">System-wide account events that require Super Admin visibility.</p>
              </div>
              <div className="flex items-center gap-8 text-[12px] font-bold text-slate-600 mr-2">
                <div className="flex flex-col items-center gap-1 w-[60px]">
                  <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" />
                  <span>In product</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-[40px]">
                  <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" />
                  <span>Email</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Row 1 */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-4">
                  <UserPlus className="w-[18px] h-[18px] text-slate-400 mt-1" />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">New user registered</h4>
                    <p className="text-[13px] text-slate-500">A new user registers and may need verification.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mr-2 mt-1">
                  <div className="flex justify-center w-[60px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                  <div className="flex justify-center w-[40px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                </div>
              </div>
              {/* Row 2 */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-4">
                  <Lock className="w-[18px] h-[18px] text-slate-400 mt-1" />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">Account locked</h4>
                    <p className="text-[13px] text-slate-500">A user account is locked after failed login attempts.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mr-2 mt-1">
                  <div className="flex justify-center w-[60px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                  <div className="flex justify-center w-[40px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                </div>
              </div>
              {/* Row 3 (User deactivated/reactivated) */}
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <UserMinus className="w-[18px] h-[18px] text-slate-400 mt-1" />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">User deactivated/reactivated</h4>
                    <p className="text-[13px] text-slate-500">A user account is deactivated or reactivated.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mr-2 mt-1">
                  <div className="flex justify-center w-[60px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                  <div className="flex justify-center w-[40px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full mb-6"></div>

          {/* Group 2: Security and permissions */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-0.5">Security and permissions</h3>
                <p className="text-[13px] text-slate-500">High-signal system notifications for access control and audit trails.</p>
              </div>
              <div className="flex items-center gap-8 text-[12px] font-bold text-slate-600 mr-2">
                <div className="flex flex-col items-center gap-1 w-[60px]">
                  <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" />
                  <span>In product</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-[40px]">
                  <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" />
                  <span>Email</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Row 1 */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-4">
                  <Shield className="w-[18px] h-[18px] text-slate-400 mt-1" />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">Important permission changes</h4>
                    <p className="text-[13px] text-slate-500">A user or group receives sensitive permission changes.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mr-2 mt-1">
                  <div className="flex justify-center w-[60px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                  <div className="flex justify-center w-[40px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                </div>
              </div>
              {/* Row 2 */}
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <Info className="w-[18px] h-[18px] text-slate-400 mt-1" />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800">System audit/security events</h4>
                    <p className="text-[13px] text-slate-500">Security-sensitive events are recorded in audit logs.</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mr-2 mt-1">
                  <div className="flex justify-center w-[60px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                  <div className="flex justify-center w-[40px]"><input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#2563eb] cursor-pointer" /></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-end mt-2 mb-8">
          <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-2.5 px-8 rounded-md transition-colors shadow-sm">
            Save Change
          </button>
        </div>

      </div>
    </div>
  );
}
