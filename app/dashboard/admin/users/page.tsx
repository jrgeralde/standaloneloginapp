'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { showMessage } from '@/components/MessageModal';

// import { showMessage } from '@/components/MessageModal';
import AddUserModal from './_components/AddUserModal';
import EditUserModal from './_components/EditUserModal';

import { checkUserPermissions } from '@/lib/checkuserpermissions';
import PagePermissionGuard from '@/components/pagepermissionguard';


import ChangeUserPasswordModal from './_components/ChangeUserPasswordModal';
import AssignUserRoles from './_components/AssignUserRoles';
import { FaKey, FaUserShield } from 'react-icons/fa';    

// --- Types ---
export type User = {
  id: number;
  name: string;
  active: boolean;
  fullname: string | null;
  birthdate: Date | null;
  gender: string | null;
};

type RawUser = {
  id: number;
  name: string;
  active: boolean;
  fullname: string | null;
  birthdate: string | null; 
  gender: string | null;
};

// --- Helpers ---
const normalizeUser = (user: RawUser): User => ({
  id: typeof user?.id === 'string' ? Number(user.id) : user?.id ?? 0,
  name: user?.name ?? '',
  active: !!user?.active,
  fullname: user?.fullname ?? null,
  birthdate: user?.birthdate ? new Date(user.birthdate) : null,
  gender: user?.gender ?? null,
});

export default function UsersPage() {
 // console.log("🚨 UsersPage RENDERED");
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  //const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Modal States ---
  //const [isFormOpen, setIsFormOpen] = useState(false);
  //const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);  
  const [passwordModalUser, setPasswordModalUser] = useState<{id: number, name: string} | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<{id: number, name: string} | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canAssignRoles, setCanAssignRoles]= useState(false);
  const [canActivate, setCanActivate] = useState(false);
  const [canChangeAnyPassword,setCanChangeAnyPassword] = useState(false);
  


// --- HOOK 1: Username State ---  
  const [username, setUsername] = useState<string | null>(null);

  // DD THIS: The Sync Hook
  useEffect(() => {
    const stored = sessionStorage.getItem('username');
    if (stored) {
      setUsername(stored);
    } else {
      // Only redirect if we've checked and it's definitely missing
      router.push('/');
    }
  }, [router]);

// Sync username from sessionStorage on mount
// --- HOOK 2: fetchUsers --- (Keep as is)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/users', { 
        method: 'GET',
        credentials: 'include' 
      });

      if (res.status === 401) {
        await showMessage("Invalid Login");
        router.push('/dashboard');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load users');
      
      setUsers((data as RawUser[]).map(normalizeUser));
    } catch (err: unknown) {
      console.error("User Fetch Error:", err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      // Guaranteed to run even if fetch fails or redirects
      setLoading(false);
    }
  }, [router]);

 // --- HOOK 3: Permissions --- (Your updated version)
useEffect(() => {
  // Now this will fire once when the component mounts (username is null)
  // AND AGAIN once Hook 1 calls setUsername (username is "ROY")
  console.log("🔥 HOOK 3 MOUNTED");

  console.log("DEBUG: Hook 3 Fired. Username is:", username);
  
  if (!username) return; // Wait for the session to be picked up
  // if (!username) {
  //   console.log("⏳ Username not ready, exiting Hook 3");
  //   return;
  // }

  const initializePage = async () => {
            console.log("DEBUG: Initializing Permissions for", username);
            try {
            const [addAllowed, editAllowed,assignAllowed,activateAllowed,chpwdallowed] = await Promise.all([
                checkUserPermissions(['ADMINISTRATOR', 'USERS_CANADDUSERS']),
                checkUserPermissions(['ADMINISTRATOR', 'USERS_CANEDITUSERS']),
                checkUserPermissions(['ADMINISTRATOR', 'USERS_CANASSIGNUSERROLES']),
                checkUserPermissions(['ADMINISTRATOR', 'USERS_CANACTIVATEUSERS']),
                checkUserPermissions(['ADMINISTRATOR', 'USERS_CANCHANGEANYPASSWORD']),
            ]);

           // console.log("PERMISSION API RESULT:", { addAllowed, editAllowed }); // LOG THIS
            
            setCanAdd(addAllowed);
            setCanEdit(editAllowed);
            setCanAssignRoles(assignAllowed);
            setCanActivate(activateAllowed);
            setCanChangeAnyPassword(chpwdallowed);

            await fetchUsers(); 
            } catch (err) {
            console.error("Init Error:", err);
            fetchUsers(); 
            }
        };

        initializePage();
    }, [username, fetchUsers, router]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => user.name.toLowerCase().includes(term));
  }, [users, searchTerm]);

  const handleToggleStatus = async (user: User) => {
    const action = user.active ? 'deactivate' : 'activate';
    
    const confirmed = await ConfirmModal(
      `Are you sure you want to ${action} user "${user.name}"?`,
      {
        okText: user.active ? 'Deactivate' : 'Activate',
        cancelText: 'Cancel',
        okColor: user.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700',
      }
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle status');

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: data.user.active } : u));
      //setMessage(data.message);
    } catch (err: unknown) {
      await showMessage(err instanceof Error ? err.message : 'Failed to change active status');
    }
  };

  console.log("Current canEdit state:", canEdit);

  return (
    <PagePermissionGuard roles={['ADMINISTRATOR', 'USERS_CANACCESSUSERS']}>
    <div className="space-y-4">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-x-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
          User Management
        </h1>
        
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <button
          //onClick={handleAddClick}
          onClick={async () => {
            if (!canAdd) {
              // Use your existing showMessage component
              await showMessage("Access Denied: You do not have permission to add users.");
              return;
            }
            setShowAddModal(true);
          }}

          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* --- TABLE SECTION --- */}
      <div className="max-h-[calc(100vh-260px)] overflow-auto rounded border bg-white shadow">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium italic">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found.</div>
        ) : (
          /* 1. Added table-fixed and border-separate to prevent "thinning" */
          <table className="min-w-full table-fixed border-separate border-spacing-0 divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                {/* Row # - Base */}
                <th className="sticky left-0 z-20 w-[47px] min-w-[47px] bg-gray-100 px-4 py-3 ... border-b border-gray-200">
                  Row #
                </th>

                {/* Name - Copying 'Active' Shadow logic + Overlap */}
                <th className="sticky left-[46px] z-20 w-[112px] min-w-[112px] bg-gray-100 px-6 py-3 ... border-b border-gray-200 
                              /* SEALANT: Matches header gray-100 (#f3f4f6) */
                              shadow-[-2px_0_0_0_#f3f4f6]">
                  Name
                </th>

                {/* Active - Kept exactly as your working version */}
                <th className="sticky text-center left-[157px] z-20 w-[100px] min-w-[100px] bg-gray-100 px-6 py-3 ... border-b border-gray-200 
                              shadow-[-2px_0_0_0_#f3f4f6, 2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Active
                </th>
                {/* Non-sticky headers - give them a min-width so they don't collapse */}
                <th className="min-w-[150px] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Full Name</th>
                <th className="min-w-[120px] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Birthdate</th>
                <th className="min-w-[120px] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Gender</th>
                <th className="px-6 py-3 ...">Activation</th>
                <th className="px-6 py-3 ...">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="even:bg-gray-50/80 hover:bg-blue-50/50 transition-colors group">
                  <td className="sticky left-0 z-10 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0f7ff] px-4 py-4 text-sm text-right border-b border-gray-200">
                    {index + 1}
                  </td>

                  {/* Using the same left-[48px] to match the Header exactly */}
                  {/* <td className="sticky left-[48px] z-10 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0f7ff] px-6 py-4 text-sm font-medium border-b border-gray-200 shadow-[-1px_0_0_0_#fff] group-even:shadow-[-1px_0_0_0_#f9fafb] group-hover:shadow-[-1px_0_0_0_#f0f7ff]"> 
                    {user.name}
                  </td> */}
                  {/* Name Column - Updated to match Active Column logic */}
                  <td className="sticky left-[46px] z-10 px-6 py-4 text-sm font-medium text-gray-900
                                bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0f7ff]
                                
                                /* Copying the 'Active' shadow logic: 
                                    First part seals the left gap, 
                                    Second part (optional) adds a tiny bit of depth to 'lock' it visually */
                                shadow-[-2px_0_0_0_#fff, 1px_0_0_0_#e5e7eb] 
                                group-even:shadow-[-2px_0_0_0_#f9fafb, 1px_0_0_0_#e5e7eb] 
                                group-hover:shadow-[-2px_0_0_0_#f0f7ff, 1px_0_0_0_#e5e7eb]"> 
                    {user.name}
                  </td>
                  {/* Using the same left-[160px] */}
                  <td className="sticky left-[160px] z-10 bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f0f7ff] px-6 py-4 text-center border-b border-gray-200 shadow-[-1px_0_0_0_#fff,2px_0_5px_-2px_rgba(0,0,0,0.1)] group-even:shadow-[-1px_0_0_0_#f9fafb,2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:shadow-[-1px_0_0_0_#f0f7ff,2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <input type="checkbox" readOnly checked={user.active} className="..." />
                  </td>              
                  
                      
                  {/* NON-STICKY COLUMNS (Keep as is) */}
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{user.fullname || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{user.birthdate ? user.birthdate.toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 uppercase">{user.gender || '—'}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap space-x-3">
                    <button 
                      onClick={async () => {
                        // 1. Permission Check
                        if (!canActivate) {
                          await showMessage("Access Denied: You do not have permission to change user status.");
                          return;
                        }
                        
                        // 2. Original Toggle Logic
                        handleToggleStatus(user);
                      }} 
                      className={`min-w-[100px] px-3 py-1 rounded text-xs font-bold text-white shadow-sm transition-colors ${
                        user.active 
                          ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>  
                  <td className="px-6 py-4 text-center whitespace-nowrap space-x-2">
                    <button 
                                              
                        onClick={async () => {
                          // 1. Check for permission
                          console.log("Edit Clicked. Current canEdit state:", canEdit); // DEBUG
                          if (!canEdit) {
                            await showMessage("Access Denied: You do not have permission to edit users.");
                            return;
                          }
                          
                          // 2. Open modal if allowed
                          setEditingUser(user); 
                        }}

                      className="rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600 transition-colors text-xs font-bold shadow-sm">
                      Edit
                    </button>
                    <button 
                        onClick={async () => {
                          // 1. Permission Check
                          if (!canAssignRoles) {
                            await showMessage("Access Denied: You do not have permission to assign user roles.");
                            return;
                          }
                          
                          // 2. Open modal if allowed
                          setRoleModalUser({ id: user.id, name: user.name });
                        }}
                        
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-green-600 text-green-700 rounded hover:bg-green-50 transition-colors text-xs font-bold shadow-sm"
                      >
                        <FaUserShield size={12} />
                        <span>Roles</span>
                    </button>
                    <button 
                        onClick={async () => {
                          // 1. Permission Check
                          if (!canChangeAnyPassword) {
                            await showMessage("Access Denied: You do not have permission to change user passwords.");
                            return;
                          }

                          // 2. Open modal if allowed
                          setPasswordModalUser({ id: user.id, name: user.name });
                        }} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors text-xs font-bold shadow-sm"
                      >
                        <FaKey size={12} />
                        <span>Password</span>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} total users
        </div>
      )}

      {/* --- MODALS --- */}
      {roleModalUser && (
        <AssignUserRoles 
          userId={roleModalUser.id}
          userName={roleModalUser.name}
          onClose={() => setRoleModalUser(null)}
        />
      )}

      {passwordModalUser && (
        <ChangeUserPasswordModal 
          userId={passwordModalUser.id} 
          userName={passwordModalUser.name} 
          onClose={() => setPasswordModalUser(null)} 
        />
      )}

    {/* Add / Edit Modals (These remain as components because they contain forms) */}
      {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onSuccess={async () => {
              setShowAddModal(false);
              await fetchUsers(); // Ensures the new user appears in the list immediately
              await showMessage('User added successfully');
            }}
          />
        )}
  
      {editingUser && (
          <EditUserModal
            user={editingUser}            // Changed 'role' to 'user'
            onClose={() => setEditingUser(null)}
            onSuccess={async () => {      // Changed 'onSaved' to 'onSuccess'
              setEditingUser(null);
              await fetchUsers();         // Refresh the list
              await showMessage('User updated successfully');
            }}
          />
        )}

      {/* {footermessage && <MessageModalFooter message={message} onClose={() => setMessage('')} />} */}
    </div>
    </PagePermissionGuard>
  );
}