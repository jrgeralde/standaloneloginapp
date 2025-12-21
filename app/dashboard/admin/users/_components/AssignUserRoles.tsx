//app/dashboard/admin/users/_components/AssignUserRoles.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';
import ConfirmModal from '@/components/ConfirmModal';

type Role = {
  id: number;
  role_name: string;
};

interface AssignUserRolesProps {
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function AssignUserRoles({ userId, userName, onClose }: AssignUserRolesProps) {
  const [available, setAvailable] = useState<Role[]>([]);
  const [assigned, setAssigned] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState<number | null>(null);
  const [selectedAssigned, setSelectedAssigned] = useState<number | null>(null);

  // Search States
  const [availSearch, setAvailSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [resAvail, resAssigned] = await Promise.all([
        fetch(`/api/users/${userId}/availableroles`),
        fetch(`/api/users/${userId}/assignedroles`)
      ]);
      const dataAvail = await resAvail.json();
      const dataAssigned = await resAssigned.json();
      setAvailable(Array.isArray(dataAvail) ? dataAvail : []);
      setAssigned(Array.isArray(dataAssigned) ? dataAssigned : []);
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Lists
  const filteredAvailable = useMemo(() => 
    available.filter(r => r.role_name.toLowerCase().includes(availSearch.toLowerCase())),
    [available, availSearch]
  );

  const filteredAssigned = useMemo(() => 
    assigned.filter(r => r.role_name.toLowerCase().includes(assignSearch.toLowerCase())),
    [assigned, assignSearch]
  );

  const handleAddRole = async (roleIdOverride?: number) => {
    const roleId = roleIdOverride || selectedAvailable;
    if (!roleId) return;
    try {
      const res = await fetch(`/api/users/${userId}/assignedroles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });
      if (res.ok) {
        setSelectedAvailable(null);
        await fetchData();
      }
    } catch (err) { setError('Failed to add role'); }
  };

  const handleRemoveRole = async (roleIdOverride?: number) => {
    const roleId = roleIdOverride || selectedAssigned;
    if (!roleId) return;
    try {
      const res = await fetch(`/api/users/${userId}/assignedroles?roleId=${roleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedAssigned(null);
        await fetchData();
      }
    } catch (err) { setError('Failed to remove role'); }
  };

  const handleAddAll = async () => {
    // Use filtered list if it exists, otherwise the whole available list
    const rolesToAssign = filteredAvailable;
    if (rolesToAssign.length === 0) return;
  
    const confirmed = await ConfirmModal(`Assign ${rolesToAssign.length} roles to ${userName}?`);
    if (!confirmed) return;
  
    try {
      const res = await fetch(`/api/users/${userId}/availableroles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: rolesToAssign.map(r => r.id) }),
      });
      if (res.ok) await fetchData();
    } catch (err) { setError('Failed to add roles'); }
  };
  
  const handleRemoveAll = async () => {
    const rolesToRemove = filteredAssigned;
    if (rolesToRemove.length === 0) return;
  
    const confirmed = await ConfirmModal(`Remove ${rolesToRemove.length} roles from ${userName}?`);
    if (!confirmed) return;
  
    try {
      const res = await fetch(`/api/users/${userId}/availableroles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: rolesToRemove.map(r => r.id) }),
      });
      if (res.ok) await fetchData();
    } catch (err) { setError('Failed to remove roles'); }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-blue-500 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
            Manage Roles: <span className="text-yellow-400 opacity-90">{userName}</span>
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-100 text-3xl">&times;</button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 flex justify-between items-center text-base text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <span>{error}</span>
              <button onClick={() => setError('')} className="font-bold">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-8 items-center">
            
            {/* Available Roles Section */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-3 gap-2">
                <label className="text-sm font-bold text-gray-700 uppercase whitespace-nowrap">Available</label>
                
                <span className="relative flex-1 max-w-[300px]"> 
                  <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="w-full pl-8 pr-7 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none transition-all"
                    value={availSearch}
                    onChange={(e) => setAvailSearch(e.target.value)}
                  />
                  {availSearch && (
                    <button onClick={() => setAvailSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                      <LuX size={14} />
                    </button>
                  )}
                </span>

                <button onClick={handleAddAll} className="border rounded border-blue-600 text-[10px] font-bold text-blue-600 hover:bg-blue-50 uppercase px-2 py-1 whitespace-nowrap">+ Add All</button>
              </div>

              <div className="border-2 rounded-xl h-[500px] overflow-y-auto bg-gray-50 p-3 space-y-2 shadow-inner">
                {filteredAvailable.map(role => (
                  <div 
                    key={role.id}
                    onClick={() => { setSelectedAvailable(role.id); setSelectedAssigned(null); }}
                    onDoubleClick={() => handleAddRole(role.id)}
                    className={`px-4 py-3 rounded-lg cursor-pointer text-base font-medium transition-all transform active:scale-95 select-none border ${
                      selectedAvailable === role.id ? 'bg-blue-600 text-white border-blue-700' : 'bg-white hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {role.role_name}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="md:col-span-1 flex flex-row md:flex-col justify-center gap-6">
              <button onClick={() => handleAddRole()} disabled={!selectedAvailable} className="p-4 rounded-xl bg-blue-600 text-white disabled:bg-gray-200 text-2xl shadow-lg">&rarr;</button>
              <button onClick={() => handleRemoveRole()} disabled={!selectedAssigned} className="p-4 rounded-xl bg-red-600 text-white disabled:bg-gray-200 text-2xl shadow-lg">&larr;</button>
            </div>

            {/* Assigned Roles Section */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-3 gap-2">
                <label className="text-sm font-bold text-gray-700 uppercase whitespace-nowrap">Assigned</label>
                
                <span className="relative flex-1 max-w-[300px]"> 
                  <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Filter..."
                    className="w-full pl-8 pr-7 py-1 text-sm border border-gray-300 rounded focus:border-red-400 outline-none transition-all"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                  />
                  {assignSearch && (
                    <button onClick={() => setAssignSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                      <LuX size={14} />
                    </button>
                  )}
                </span>

                <button onClick={handleRemoveAll} className="border rounded border-red-600 text-[10px] font-bold text-red-500 hover:bg-red-50 uppercase px-2 py-1 whitespace-nowrap">- Remove All</button>
              </div>

              <div className="border-2 rounded-xl h-[500px] overflow-y-auto bg-gray-50 p-3 space-y-2 shadow-inner">
                {filteredAssigned.map(role => (
                  <div 
                    key={role.id}
                    onClick={() => { setSelectedAssigned(role.id); setSelectedAvailable(null); }}
                    onDoubleClick={() => handleRemoveRole(role.id)}
                    className={`px-4 py-3 rounded-lg cursor-pointer text-base font-medium transition-all transform active:scale-95 select-none border ${
                      selectedAssigned === role.id ? 'bg-red-600 text-white border-red-700' : 'bg-white hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {role.role_name}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 text-right">
          <button onClick={onClose} className="px-12 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-md">Done</button>
        </div>
      </div>
    </div>
  );
}