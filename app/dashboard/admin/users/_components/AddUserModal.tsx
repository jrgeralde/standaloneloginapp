'use client';

import { useState } from 'react';
import { showMessage } from '@/components/MessageModal';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddUserModal({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    fullname: '',
    birthdate: '',
    gender: '',
    active: true, // Default new users to active
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const payload = {
        ...formData,
        fullname: formData.fullname.trim() || null,
        birthdate: formData.birthdate || null,
        gender: formData.gender || null,
        password: 'temppwd', // Send plain text, hash on the Server API
      };
  
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user.');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-none animate-in fade-in" />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add New User</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Username *</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="uppercase w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. jdoe" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input type="text" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none" placeholder="John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Birthdate</label>
              <input type="date" value={formData.birthdate} onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold shadow-md">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}