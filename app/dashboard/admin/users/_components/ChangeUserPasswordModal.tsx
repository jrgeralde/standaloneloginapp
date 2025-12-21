//app/dashboard/admin/users/_components/ChangeUserPasswordModal.tsx
'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';

type Props = {
  userId: number;
  userName: string;
  onClose: () => void;
};

export default function ChangeUserPasswordModal({ userId, userName, onClose }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Refs for focus management
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const checkCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockActive(e.getModifierState('CapsLock'));
  };

  // Handle Enter as Tab and Auto-focus logic
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: 'new' | 'confirm') => {
    checkCapsLock(e);

    if (e.key === 'Enter') {
      e.preventDefault(); // Stop form submission
      
      if (field === 'new') {
        confirmInputRef.current?.focus();
      } else if (field === 'confirm') {
        if (newPassword === confirmPassword && newPassword.length >= 6) {
          submitButtonRef.current?.focus();
        }
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/users/${userId}/changepassword`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-none" onClick={onClose} /> */}
      
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-none" />
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Change User Password</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-semibold">&times;</button>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <p className="text-base text-gray-600">
            Setting new password for: <span className="font-bold text-gray-900">{userName}</span>
          </p>

          {message.text && (
            <div className={`p-3 text-base rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* New Password Field */}
          <div className="space-y-1">
            <label className="block text-base font-bold text-gray-500 uppercase">New Password</label>
            <div className="relative">
              <input
                required
                autoFocus
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'new')}
                className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
            <div className="relative">
              <input
                ref={confirmInputRef}
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'confirm')}
                className={`w-full border rounded-md pl-3 pr-10 py-2 focus:ring-2 outline-none transition-all ${
                  confirmPassword && newPassword !== confirmPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="min-h-[20px]">
            {capsLockActive && (
              <div className="flex items-center gap-2 text-amber-600">
                <FaExclamationTriangle size={12} />
                <span className="text-[10px] font-bold uppercase">Caps Lock is On</span>
              </div>
            )}
            {!capsLockActive && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-600 font-bold uppercase">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              ref={submitButtonRef}
              type="submit"
              disabled={loading || (newPassword !== confirmPassword && confirmPassword.length > 0)}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-5 py-2 rounded-md text-base font-bold transition-all shadow-sm focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 outline-none"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}