'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import MessageModal from '@/components/MessageModal';
import AddRoleModal from './_components/AddRoleModal';
import EditRoleModal from './_components/EditRoleModal';

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
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const token = useMemo(() => sessionStorage.getItem('token') || '', []);
  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [roles, searchTerm]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        router.push('/');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to load roles');
      }

      setRoles((data as Role[]).map(normalizeRole));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    fetchRoles();
  }, [fetchRoles, router, token]);

  const handleDelete = async (role: Role) => {
    const roleId = typeof role.id === 'string' ? Number(role.id) : role.id;
    if (!Number.isInteger(roleId) || roleId <= 0) {
      setMessage('Invalid role id');
      return;
    }

    const confirmed = await ConfirmModal(
      `Delete role "${role.name}"?`,
      { okText: 'Delete', cancelText: 'Cancel', okColor: 'bg-red-600 hover:bg-red-700' }
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.message || 'Unable to delete role');
      }

      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      setMessage('Role deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      setMessage(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name"
            className="w-72 rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="rounded bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Role
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{role.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{role.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {role.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="rounded bg-amber-500 px-3 py-1 text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
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

      <AddRoleModal
        open={showAddModal}
        token={token}
        onClose={() => setShowAddModal(false)}
        onSaved={(role) => {
          setRoles((prev) => [...prev, normalizeRole(role)]);
          setMessage('Role added');
          setShowAddModal(false);
        }}
      />

      <EditRoleModal
        open={!!editingRole}
        token={token}
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onSaved={(role: Role) => {
          setRoles((prev) => prev.map((r) => (r.id === role.id ? normalizeRole(role) : r)));
          setMessage('Role updated');
          setEditingRole(null);
        }}
      />

      {message && <MessageModal message={message} onClose={() => setMessage('')} />}
    </div>
  );
}

