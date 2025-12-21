'use client';

import { useState, useEffect } from 'react';
import type { User } from '../page';

type Props = {
  user: User | null; // Changed to allow null for safety during transitions
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditUserModal({ user, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    fullname: '',
    birthdate: '',
    gender: '',
    active: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // SAFETY GUARD: The primary fix for "Cannot read properties of undefined"
  useEffect(() => {
    if (!user) return; // Exit if user is null

    setFormData({
      name: user.name || '',
      fullname: user.fullname || '',
      // Ensure date format is YYYY-MM-DD for the HTML input
      birthdate: user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      active: user.active,
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // Secondary safety

    setLoading(true);
    setError('');
  
    try {
      const payload = {
        ...formData,
        fullname: formData.fullname.trim() || null,
        birthdate: formData.birthdate || null,
        gender: formData.gender || null,
      };
  
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user.');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user is null, don't render anything to avoid crashing the child inputs
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-none" />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit User Profile</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Username</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="uppercase w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              value={formData.fullname} 
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="flex items-center gap-3 py-2 bg-gray-50 p-3 rounded-md border border-gray-100">
             <label className="text-sm font-medium text-gray-700">Account Status:</label>
             <input 
                type="checkbox" 
                checked={formData.active} 
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4 text-blue-600 cursor-pointer"
             />
             <span className={`text-sm font-bold ${formData.active ? 'text-green-600' : 'text-red-600'}`}>
               {formData.active ? 'Active' : 'Inactive'}
             </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold shadow-md transition-all"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}