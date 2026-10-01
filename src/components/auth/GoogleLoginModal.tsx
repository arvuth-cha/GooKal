import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, User, LogIn, Globe, AlertCircle, X, Trash2, Plus, Settings, Key, Check } from 'lucide-react';
import { 
  GoogleUser, 
  getCurrentUser, 
  getSavedAccounts, 
  saveUserSession, 
  switchAccount, 
  removeSavedAccount, 
  getGoogleClientId, 
  saveGoogleClientId, 
  parseJwtPayload 
} from '../../services/authService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: GoogleUser) => void;
  onToast: (msg: string) => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onToast
}) => {
  const [savedAccounts, setSavedAccounts] = useState<GoogleUser[]>([]);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [showConfigClientId, setShowConfigClientId] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load saved accounts and current user
  useEffect(() => {
    if (isOpen) {
      const accounts = getSavedAccounts();
      const curr = getCurrentUser();
      setSavedAccounts(accounts);
      setCurrentUser(curr);
      setClientIdInput(getGoogleClientId());
      setIsAddingNew(accounts.length === 0);
    }
  }, [isOpen]);

  // Check Google Identity Services
  useEffect(() => {
    const checkGsi = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        setIsGsiLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkGsi()) {
      const timer = setInterval(() => {
        if (checkGsi()) {
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, []);

  // Render Google Identity Services button if Client ID exists
  useEffect(() => {
    const activeClientId = getGoogleClientId();
    if (isGsiLoaded && activeClientId && googleBtnRef.current) {
      try {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: activeClientId,
          callback: (response: any) => {
            if (response.credential) {
              const payload = parseJwtPayload(response.credential);
              if (payload) {
                const user: GoogleUser = {
                  id: payload.sub,
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0],
                  givenName: payload.given_name,
                  picture: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.sub}`,
                  locale: payload.locale,
                  loginTimestamp: Date.now()
                };
                saveUserSession(user);
                onLoginSuccess(user);
                onToast(`🎉 เข้าสู่ระบบด้วยบัญชี ${user.name} (${user.email}) สำเร็จ!`);
              }
            }
          }
        });

        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'pill'
        });
      } catch (err) {
        console.warn('[GooKal] Error rendering GIS button:', err);
      }
    }
  }, [isGsiLoaded, clientIdInput]);

  // Handle switching to an existing account
  const handleSelectAccount = (user: GoogleUser) => {
    const switched = switchAccount(user.id);
    if (switched) {
      onLoginSuccess(switched);
      onToast(`🔄 สลับไปใช้งานบัญชี ${switched.name} (${switched.email}) แล้ว`);
    }
  };

  // Handle removing an account from the device
  const handleRemoveAccount = (e: React.MouseEvent, user: GoogleUser) => {
    e.stopPropagation();
    if (window.confirm(`ต้องการนำบัญชี ${user.email} ออกจากเครื่องนี้ใช่หรือไม่?`)) {
      removeSavedAccount(user.id);
      const updated = getSavedAccounts();
      setSavedAccounts(updated);
      if (currentUser?.id === user.id) {
        setCurrentUser(null);
      }
      if (updated.length === 0) {
        setIsAddingNew(true);
      }
      onToast(`ลบบัญชี ${user.email} ออกจากเครื่องแล้ว`);
    }
  };

  // Handle adding a new account with custom Google email/name
  const handleAddAccountSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let email = inputEmail.trim().toLowerCase();
    if (!email) {
      alert('กรุณากรอกอีเมล Google (@gmail.com)');
      return;
    }

    if (!email.includes('@')) {
      email = `${email}@gmail.com`;
    }

    const name = inputName.trim() || email.split('@')[0];
    const generatedId = 'google_' + Math.abs(email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));

    const newUser: GoogleUser = {
      id: generatedId,
      email: email,
      name: name,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      loginTimestamp: Date.now()
    };

    saveUserSession(newUser);
    setInputEmail('');
    setInputName('');
    setIsAddingNew(false);
    onLoginSuccess(newUser);
    onToast(`✅ เข้าสู่ระบบในชื่อ ${newUser.name} (${newUser.email}) เรียบร้อย!`);
  };

  // Handle saving custom Google Client ID
  const handleSaveClientId = () => {
    saveGoogleClientId(clientIdInput);
    onToast('💾 บันทึก Google Client ID เรียบร้อยแล้ว');
    setShowConfigClientId(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-neutral-100 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">
              {savedAccounts.length > 0 && !isAddingNew ? 'สลับบัญชี Google' : 'เข้าสู่ระบบ GooKal'}
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium">
              {savedAccounts.length > 0 && !isAddingNew
                ? 'เลือกบัญชี Google ที่ต้องการใช้งานบนอุปกรณ์นี้'
                : 'เข้าสู่ระบบด้วยบัญชี Google ของคุณเพื่อแยกข้อมูลส่วนบุคคล'}
            </p>
          </div>
        </div>

        {/* Google Official OAuth button if Client ID exists */}
        {getGoogleClientId() && (
          <div className="w-full flex flex-col items-center mb-4 pb-3 border-b border-neutral-100">
            <div ref={googleBtnRef} className="flex justify-center w-full" />
          </div>
        )}

        {/* View 1: List of Saved Accounts (for switching) */}
        {!isAddingNew && savedAccounts.length > 0 ? (
          <div className="space-y-2.5 my-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              บัญชีที่บันทึกไว้ในเครื่อง ({savedAccounts.length}):
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedAccounts.map((account) => {
                const isActive = currentUser?.id === account.id || currentUser?.email.toLowerCase() === account.email.toLowerCase();
                return (
                  <div
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-200' 
                        : 'bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={account.picture} 
                        alt={account.name} 
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-neutral-200 shrink-0 bg-white"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-neutral-900 truncate">{account.name}</h4>
                          {isActive && (
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded-full">
                              กำลังใช้งาน
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate">{account.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(e, account)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="นำบัญชีนี้ออก"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Account Button */}
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-orange-400 hover:bg-orange-50/40 text-neutral-600 hover:text-orange-600 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
            >
              <Plus size={16} />
              <span>เพิ่มหรือเข้าสู่ระบบด้วยบัญชี Google อื่น</span>
            </button>
          </div>
        ) : (
          /* View 2: Add / Login with Google Account Form */
          <form onSubmit={handleAddAccountSubmit} className="space-y-3.5 my-2">
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  อีเมล Google ของคุณ <span className="text-orange-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="เช่น yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-neutral-300 font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  ชื่อของคุณ (สำหรับแสดงในแอป)
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="เช่น สมชาย สายคลีน"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-neutral-300 font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs shadow-orange-500/30 cursor-pointer active:scale-[0.98]"
              >
                {/* Google G icon */}
                <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>เข้าสู่ระบบด้วยบัญชี Google นี้</span>
              </button>
            </div>

            {/* Back button if there are existing accounts */}
            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="w-full text-center text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer py-1"
              >
                ← กลับไปหน้ารายการบัญชีที่บันทึกไว้
              </button>
            )}
          </form>
        )}

        {/* Feature Highlights */}
        <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>แยกข้อมูลส่วนตัว 100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
            <span>สลับบัญชีได้ตลอดเวลา</span>
          </div>
        </div>

        {/* Google Client ID Advanced Config Toggle */}
        <div className="mt-4 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowConfigClientId(prev => !prev)}
            className="flex items-center justify-between w-full text-[10px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <Key size={11} />
              <span>ตั้งค่า Google OAuth Client ID อย่างเป็นทางการ</span>
            </span>
            <span>{showConfigClientId ? '▲ ซ่อน' : '▼ ขยาย'}</span>
          </button>

          {showConfigClientId && (
            <div className="mt-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-left space-y-2 animate-in fade-in duration-150">
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                หากมี Google Client ID จาก Google Cloud Console สามารถวางที่นี่เพื่อให้ระบบเด้งปุ่ม Google Sign-In อย่างเป็นทางการอัตโนมัติ:
              </p>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxxxx.apps.googleusercontent.com"
                className="w-full px-2.5 py-1.5 text-[11px] bg-white rounded-lg border border-neutral-300 font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                className="px-3 py-1 bg-neutral-800 hover:bg-black text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              >
                บันทึก Client ID
              </button>
            </div>
          )}
        </div>

        {/* Dismiss / Skip */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-[11px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer py-1"
          >
            ข้ามไปก่อน (ใช้งานต่อแบบไม่เข้าสู่ระบบ)
          </button>
        )}

      </div>
    </div>
  );
};
