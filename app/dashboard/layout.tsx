//app/dashboard/layout.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown, FaHome, FaUserShield, FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { LuShieldCheck } from "react-icons/lu";
import ConfirmModal from '@/components/ConfirmModal';
import SessionTimeoutWrapper from '@/components/SessionTimeoutWrapper';

// Modal and Types
import EditUserModal from './admin/users/_components/EditUserModal';
import type { User } from './admin/users/page';
import ChangeUserPasswordModal from './admin/users/_components/ChangeUserPasswordModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  
  // UI States
  const [adminOpen, setAdminOpen] = useState(false);
  const [myProfileOpen, setMyProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // Profile and Password Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); 

  // 1. Auth Check: Get username from sessionStorage
  useEffect(() => {
    const user = sessionStorage.getItem('username');
    if (!user) {
      router.push('/'); 
    } else {
      setUsername(user);
      setLoading(false);
    }
  }, [router]);

  // 2. Logout Logic
  const logout = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) console.error('Logout failed:', await res.text());
    } catch (err) {
      console.error('Logout error:', err);
    }

    sessionStorage.removeItem('username');
    router.push('/');
  };

  const handleLogout = async () => {
    const confirmed = await ConfirmModal(
      'Are you sure you want to logout?',
      { okText: 'Yes', cancelText: 'No', okColor: 'bg-red-600 hover:bg-red-700' }
    );
    if (confirmed) logout();
  };

  // 3. Navigation Handlers
  const handleAdminClick = (action: string) => {
    if (action === 'Users') router.push('/dashboard/admin/users');
    if (action === 'Roles') router.push('/dashboard/admin/roles');
    setAdminOpen(false);
  };

  const handleMyProfileClick = async (action: string) => {
    if (action === 'Edit My Profile') {
      try {
        // 1. Get the userid from sessionStorage
        const userId = sessionStorage.getItem('userid'); 
        
        if (!userId) {
          throw new Error("User ID not found in session");
        }
              
        // 2. Call your existing dynamic route: /api/users/[id]
        const res = await fetch(`/api/users/${userId}`); 
                
        if (!res.ok) throw new Error("Could not fetch profile");

        const data = await res.json();
        setProfileData(data); 
        setIsProfileModalOpen(true);
        
      } catch (err) {
        console.error(err);
        alert("Failed to load profile data.");
      }
    } else if (action === 'Change Password') {
      setIsPasswordModalOpen(true); 
    }
    setMyProfileOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-gray-500 text-lg">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <SessionTimeoutWrapper timeoutMinutes={20} countdownSeconds={60} onLogout={logout}>
      <div className="min-h-screen flex flex-col">

        {/* --- HEADER --- */}
        <header className="bg-blue-600 shadow px-6 py-2 flex items-center justify-between text-white">
          <div>
            <button
              onClick={() => { router.push('/dashboard'); setAdminOpen(false); setMyProfileOpen(false); }}
              className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors"
            >
              <FaHome size={20} /> Home
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* My Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setMyProfileOpen(!myProfileOpen); setAdminOpen(false); }}
                className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors"
              >
                <FaUserCog size={20} /> My Profile
                <FaChevronDown className={`transition-transform duration-200 ${myProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {myProfileOpen && (
                <ul className="absolute right-0 mt-2 w-52 bg-white border rounded shadow-lg z-50 text-gray-800 py-1 overflow-hidden">
                  <li>
                    <button onClick={() => handleMyProfileClick('Edit My Profile')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
                      Edit My Profile
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleMyProfileClick('Change Password')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
                      Change Password
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Admin Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setAdminOpen(!adminOpen); setMyProfileOpen(false); }}
                className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors"
              >
                <LuShieldCheck size={20} /> Admin
                <FaChevronDown className={`transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`} />
              </button>

              {adminOpen && (
                <ul className="absolute right-0 mt-2 w-52 bg-white border rounded shadow-lg z-50 text-gray-800 py-1 overflow-hidden">
                  <li>
                    <button onClick={() => handleAdminClick('Users')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
                      User Management
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleAdminClick('Roles')} className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors">
                      Role Management
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <button onClick={handleLogout} className="flex items-center gap-2 text-lg font-bold px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition-colors">
              <FaSignOutAlt size={20} /> Logout
            </button>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 p-4 container bg-zinc-50 clsdark:bg-gray-900 max-w-full overflow-auto">
          {children}
        </main>

        {/* --- MODAL (Global) --- */}
        {isProfileModalOpen && (
          <EditUserModal
            user={profileData}
            onClose={() => setIsProfileModalOpen(false)}
            onSuccess={() => {
              setIsProfileModalOpen(false);
              // Trigger reload to update username in header/footer if changed
              window.location.reload(); 
            }}
          />
        )}

        {isPasswordModalOpen && (
          <ChangeUserPasswordModal
            userId={Number(sessionStorage.getItem('userid'))}
            userName={username || 'User'}
            onClose={() => setIsPasswordModalOpen(false)}
          />
        )}

        {/* --- FOOTER --- */}
        <footer className="bg-blue-600 text-white p-3 flex justify-between text-sm sm:text-base border-t border-blue-500">
          <span className="font-semibold">{username ? `User: ${username}` : ''}</span>
          <span>© {new Date().getFullYear()} My Dashboard App</span>
        </footer>

      </div>
    </SessionTimeoutWrapper>
  );
}