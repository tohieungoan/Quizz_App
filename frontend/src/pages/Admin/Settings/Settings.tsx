import { 
  Mail, 
  Bell, 
  UserPlus, 
  UserX, 
  UserCog, 
  ShieldAlert, 
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminSettingService } from '../../../services/adminSettingService';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function ToggleSwitch({ checked, onChange, disabled = false, size = 'sm' }: ToggleSwitchProps) {
  if (size === 'md') {
    return (
      <label className={`relative inline-flex items-center select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => !disabled && onChange(e.target.checked)} 
          disabled={disabled}
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-indigo-600 transition-colors"></div>
      </label>
    );
  }

  return (
    <label className={`relative inline-flex items-center select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => !disabled && onChange(e.target.checked)} 
        disabled={disabled}
        className="sr-only peer" 
      />
      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-indigo-600 transition-colors"></div>
    </label>
  );
}

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  // Matrix State
  const [matrix, setMatrix] = useState({
    newUser: { inApp: true, email: true },
    userDeleted: { inApp: true, email: true },
    userStatus: { inApp: true, email: false },
    userImported: { inApp: true, email: true },
    permissionChanges: { inApp: true, email: true },
    criticalDataDeletion: { inApp: true, email: true },
  });

  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await adminSettingService.getSettings();
        if (data) {
          setEmailAlerts(data.email_alerts_enabled);
          setMatrix({
            newUser: { 
              inApp: data.lifecycle_user_registered_inapp, 
              email: data.lifecycle_user_registered_email 
            },
            userDeleted: { 
              inApp: data.lifecycle_user_deleted_inapp, 
              email: data.lifecycle_user_deleted_email 
            },
            userStatus: { 
              inApp: data.lifecycle_user_status_inapp, 
              email: data.lifecycle_user_status_email 
            },
            userImported: { 
              inApp: data.lifecycle_user_imported_inapp, 
              email: data.lifecycle_user_imported_email 
            },
            permissionChanges: { 
              inApp: data.security_permission_changes_inapp, 
              email: data.security_permission_changes_email 
            },
            criticalDataDeletion: { 
              inApp: data.security_critical_data_deletion_inapp, 
              email: data.security_critical_data_deletion_email 
            },
          });
          setIsSaved(true);
        }
      } catch (err: any) {
        console.error('Failed to load admin settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (category: keyof typeof matrix, channel: 'inApp' | 'email', value: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value
      }
    }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminSettingService.updateSettings({
        email_alerts_enabled: emailAlerts,
        lifecycle_user_registered_inapp: matrix.newUser.inApp,
        lifecycle_user_registered_email: matrix.newUser.email,
        lifecycle_user_deleted_inapp: matrix.userDeleted.inApp,
        lifecycle_user_deleted_email: matrix.userDeleted.email,
        lifecycle_user_status_inapp: matrix.userStatus.inApp,
        lifecycle_user_status_email: matrix.userStatus.email,
        lifecycle_user_imported_inapp: matrix.userImported.inApp,
        lifecycle_user_imported_email: matrix.userImported.email,
        security_permission_changes_inapp: matrix.permissionChanges.inApp,
        security_permission_changes_email: matrix.permissionChanges.email,
        security_critical_data_deletion_inapp: matrix.criticalDataDeletion.inApp,
        security_critical_data_deletion_email: matrix.criticalDataDeletion.email,
      });
      setIsSaved(true);
      toast.success('Notification settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings to server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between bg-slate-50/50 relative">
      <div className="flex-1 p-6 md:p-8 max-w-[1000px] mx-auto w-full flex flex-col gap-6 pb-8">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <SlidersHorizontal className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notification Settings</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                System Wide
              </span>
            </div>
            <p className="text-[14px] text-slate-500 font-medium">
              Configure delivery channels and automated alerts for Super Admin account lifecycle, security audits, and exam integrity.
            </p>
          </div>
        </div>

        {/* Email Delivery Preferences Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className="text-[15px] font-bold text-slate-900">Email Delivery Preferences</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-[13px] text-slate-500 font-medium">
                Allow the system to dispatch automated high-priority email notifications to Super Administrators.
              </p>
            </div>
          </div>
          
          <ToggleSwitch 
            checked={emailAlerts} 
            onChange={(val) => {
              setEmailAlerts(val);
              setIsSaved(false);
            }} 
            size="md" 
          />
        </div>

        {/* System Notification Matrix Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Matrix Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 mb-0.5">System Notification Matrix</h2>
                <p className="text-[13px] text-slate-500 font-medium">
                  Select which channels (In-App and Email) should receive alerts for each system event.
                </p>
              </div>
            </div>
            
            {/* Headers for toggles */}
            <div className="flex items-center gap-8 px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider w-10 text-center">In-App</span>
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider w-10 text-center">Email</span>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-10">
            {/* ACCOUNT LIFECYCLE SECTION */}
            <div>
              <div className="mb-6">
                <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Account Lifecycle
                </h3>
                <p className="text-[12px] text-slate-500 ml-3.5">
                  Platform user registrations, security lockouts, and administrative status changes.
                </p>
              </div>

              <div className="flex flex-col gap-6 ml-3.5">
                {/* Item 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">New user registered</h4>
                      <p className="text-[12px] text-slate-500">A new user registers on the platform and may require account verification or onboarding.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.newUser.inApp} 
                        onChange={(val) => handleToggle('newUser', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.newUser.email} 
                        onChange={(val) => handleToggle('newUser', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg flex items-center justify-center shrink-0">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">User account deleted</h4>
                      <p className="text-[12px] text-slate-500">Triggered when an administrator permanently deletes a user account from the system.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userDeleted.inApp} 
                        onChange={(val) => handleToggle('userDeleted', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userDeleted.email} 
                        onChange={(val) => handleToggle('userDeleted', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <UserCog className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">User deactivated / reactivated</h4>
                      <p className="text-[12px] text-slate-500">When an administrator modifies a user account active status or applies a suspension.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userStatus.inApp} 
                        onChange={(val) => handleToggle('userStatus', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userStatus.email} 
                        onChange={(val) => handleToggle('userStatus', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">Bulk users imported</h4>
                      <p className="text-[12px] text-slate-500">Triggered when an administrator uploads a CSV/Excel file to batch import user accounts.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userImported.inApp} 
                        onChange={(val) => handleToggle('userImported', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.userImported.email} 
                        onChange={(val) => handleToggle('userImported', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECURITY & PERMISSIONS SECTION */}
            <div>
              <div className="mb-6">
                <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Security & Permissions
                </h3>
                <p className="text-[12px] text-slate-500 ml-3.5">
                  High-signal system notifications for privileged access changes and exam proctoring.
                </p>
              </div>

              <div className="flex flex-col gap-6 ml-3.5">
                {/* Item 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">Important permission changes</h4>
                      <p className="text-[12px] text-slate-500">A user account or group receives elevated Super Admin privileges or security scope changes.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.permissionChanges.inApp} 
                        onChange={(val) => handleToggle('permissionChanges', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.permissionChanges.email} 
                        onChange={(val) => handleToggle('permissionChanges', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-9 h-9 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-800 mb-0.5">Critical data deletion</h4>
                      <p className="text-[12px] text-slate-500">Triggered when an Exam or Group is permanently deleted from the system.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.criticalDataDeletion.inApp} 
                        onChange={(val) => handleToggle('criticalDataDeletion', 'inApp', val)} 
                      />
                    </div>
                    <div className="flex justify-center w-10">
                      <ToggleSwitch 
                        checked={matrix.criticalDataDeletion.email} 
                        onChange={(val) => handleToggle('criticalDataDeletion', 'email', val)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Sticky Action Footer */}
      <div className="sticky bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 md:px-8 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1000px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {isSaved ? 'All settings up to date' : 'Unsaved changes'}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 px-5 rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

