'use client';

import { useState } from 'react';

type Role = {
  id: number;
  name: string;
  description: string | null;
};

type AddRoleModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (role: Role) => void;
};

const normalizeRole = (role: Role): Role => ({
  id: typeof role?.id === 'string' ? Number(role.id) : role?.id ?? 0,
  name: role?.name ?? '',
  description: role?.description ?? null,
});

export default function AddRoleModal({ open, onClose, onSaved }: AddRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setSaving(false);
    setError('');
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to create role');
      }

      onSaved(normalizeRole(data));
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create role';
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"> */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">  
        {/* <div className="bg-blue-600 mb-4 flex items-center justify-between"> */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                
          <h2 className="text-white text-xl font-semibold">Add Role</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. ADMIN"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
