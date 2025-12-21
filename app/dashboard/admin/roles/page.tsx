'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { showMessage } from '@/components/MessageModal';
import AddRoleModal from './_components/AddRoleModal';
import EditRoleModal from './_components/EditRoleModal';
import { checkUserPermissions } from '@/lib/checkuserpermissions';
import PagePermissionGuard from '@/components/pagepermissionguard';


type Role = {
  id: number;
  name: string;
  description: string | null;
};

type RawRole = {
  id: number | string;
  name?: string;
  description?: string | null;
};

const normalizeRole = (role: RawRole): Role => ({
  id: typeof role?.id === 'string' ? Number(role.id) : role?.id ?? 0,
  name: role?.name ?? '',
  description: role?.description ?? null,
});

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // -- Modal States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
 // const [isForbidden, setIsForbidden] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canAdd, setCanAdd] = useState(false);

  const username = useMemo(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('username');
    return null;
  }, []);

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [roles, searchTerm]);

  // --- Fetch Roles ---
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/roles', {
        method: 'GET',
        credentials: 'include', 
      });

      if (res.status === 401) {
        await showMessage("Invalid Login");
        router.push('/dashboard');
        return;
      }
 
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load roles');

      setRoles((data as Role[]).map(normalizeRole));
    } catch (err: unknown) {
      console.error("Role Fetch Error:", err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      // Guaranteed to run even if fetch fails or redirects
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!username) {
      router.push('/');
      return;
    }
  
    const initializePage = async () => {
      // 1. Verify Permissions first
      const [editAllowed, addAllowed] = await Promise.all([
        checkUserPermissions(['ADMINISTRATOR', 'ROLES_CANEDITROLES']),
        checkUserPermissions(['ADMINISTRATOR', 'ROLES_CANADDROLES'])
      ]);
  
      setCanEdit(editAllowed);
      setCanAdd(addAllowed);
  
      // 2. Only fetch roles after we know the user's status
      // You could even wrap this in an 'if' if you only want to load data for authorized users
      await fetchRoles();
    };
  
    initializePage();
  }, [fetchRoles, router, username]);

  const handleDelete = async (role: Role) => {

      // Re-verify permission right before the delete action
    const isAllowed = await checkUserPermissions(['ADMINISTRATOR', 'ROLES_CANDELETEROLES']);
    
    if (!isAllowed) {
      await showMessage("Access Denied: You cannot delete roles.");
      return;
    }

    // confirm from user
    const confirmed = await ConfirmModal(
      `Delete role "${role.name}"?`,
      { okText: 'Delete', okColor: 'bg-red-600 hover:bg-red-700' }
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // if (!res.ok) throw new Error('Insufficient Access to delete role');

      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      await showMessage('Role deleted successfully');
    } catch (err: unknown) {
      await showMessage(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  //if (isForbidden) return null;

  return (
    <PagePermissionGuard roles={['ADMINISTRATOR', 'ROLES_CANACCESSROLES']}>
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-x-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">
          Role Management
        </h1>
        
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
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
          // onClick={() => {
          //   setShowAddModal(true);
          // }}
          onClick={async () => { // Added async here
            if (canAdd) {
              setCanAdd(true);
              setShowAddModal(true);
            } else {
              await showMessage("Access Denied: You cannot add roles."); 
            }
          }}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Add Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded border bg-white px-4 py-6 text-center shadow">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="rounded border bg-white px-4 py-6 text-center shadow">No roles yet.</div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded border bg-white px-4 py-6 text-center shadow">
          No roles match your search.
        </div>
      ) : (
        <>
          <div className="max-h-[calc(100vh-260px)] overflow-auto rounded border bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Row #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((role, index) => (
                  <tr key={role.id} className="even:bg-gray-50/80 hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {role.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-4">
                      <button 
                        onClick={async () => { // Added async here
                          if (canEdit) {
                            setEditingRole(role);                           
                          } else {
                            await showMessage("Access Denied: You cannot edit roles."); 
                          }
                        }}
                        className="rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button 
                        onClick={() => handleDelete(role)}
                        className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-700">
            Showing {filteredRoles.length} of {roles.length} roles
          </div>
        </>
      )}

      {/* Add / Edit Modals (These remain as components because they contain forms) */}
      {showAddModal && (
        <AddRoleModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSaved={async (role) => {
            setRoles((prev) => [...prev, normalizeRole(role)]);
            setShowAddModal(false);
            await showMessage('Role added successfully');
          }}
        />
      )}

      {editingRole && (
        <EditRoleModal
          open={!!editingRole}
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={async (role: Role) => {
            setRoles((prev) => prev.map((r) => (r.id === role.id ? normalizeRole(role) : r)));
            setEditingRole(null);
            await showMessage('Role updated successfully');
          }}
        />
      )}
    </div>
    </PagePermissionGuard>
  );
}