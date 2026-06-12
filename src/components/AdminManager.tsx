import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, UserPlus, Shield, ShieldAlert, BadgeAlert, 
  Trash2, Search, Activity, Mail, RefreshCw, Key, 
  ChevronRight, CheckCircle2, UserX, X, Plus, Clock, Terminal, Filter
} from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  isSuspended?: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  email: string;
  timestamp: string;
}

interface AdminManagerProps {
  token: string | null;
  currentUser: any;
  onBackToBoard: () => void;
}

export default function AdminManager({ token, currentUser, onBackToBoard }: AdminManagerProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'directory' | 'audit'>('directory');
  
  // Create User Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitUser, setIsSubmitUser] = useState(false);

  // Password reset modal state
  const [resettingUser, setResettingUser] = useState<UserData | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Global notice messages
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice(null);
    }, 4500);
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch directory');
      setUsers(data || []);
    } catch (err: any) {
      triggerNotice(err.message || 'System index fetch error', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchActivities = async () => {
    if (!token) return;
    setLoadingActivities(true);
    try {
      const res = await fetch('/api/admin/activities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch server activities');
      setActivities(data || []);
    } catch (err: any) {
      triggerNotice(err.message || 'Audit ledger fetch error', 'error');
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchActivities();
    }
  }, [token]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newEmail.trim() || !newPassword || newPassword.length < 6) {
      setCreateError('Please specify valid details. Password must be 6+ chars.');
      return;
    }

    setIsSubmitUser(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User registration aborted');

      setCreateSuccess(`Account registered successfully under the UID: ${data.uid.slice(0, 8)}`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      
      // Auto-reload data
      fetchUsers();
      fetchActivities();
      
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Sub-routine registration failed');
    } finally {
      setIsSubmitUser(false);
    }
  };

  const handleUpdateRole = async (userEmail: string, currentRole: 'user' | 'admin') => {
    if (!token) return;
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    
    // Safety guard
    if (userEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      triggerNotice('Denial: Self-demotion is restricted to avoid lockouts', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update access parameters');

      triggerNotice(`Successfully adjusted access index of ${userEmail} to ${targetRole}`);
      fetchUsers();
      fetchActivities();
    } catch (err: any) {
      triggerNotice(err.message, 'error');
    }
  };

  const handleToggleSuspension = async (userEmail: string, isCurrentlySuspended?: boolean) => {
    if (!token) return;
    const targetState = !isCurrentlySuspended;

    if (userEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      triggerNotice('Denial: You cannot suspend your active session!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended: targetState })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status alteration error');

      triggerNotice(`${userEmail} state revised to ${targetState ? 'Suspended' : 'Cleared'}`);
      fetchUsers();
      fetchActivities();
    } catch (err: any) {
      triggerNotice(err.message, 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !resettingUser) return;
    if (resetPassword.length < 6) {
      setResetError('Security credentials must be 6+ characters');
      return;
    }

    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(resettingUser.email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: resetPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password alteration rejected');

      setResetSuccess(`Security code updated successfully for ${resettingUser.email}`);
      setResetPassword('');
      fetchActivities();

      setTimeout(() => {
        setResettingUser(null);
        setResetSuccess(null);
      }, 1500);
    } catch (err: any) {
      setResetError(err.message);
    }
  };

  const handleDeleteUser = async (userEmail: string) => {
    if (!token) return;
    if (userEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      triggerNotice('Denial: Self-elimination is disabled in server.ts', 'error');
      return;
    }

    if (!window.confirm(`CRITICAL HAZARD: Are you absolutely certain you wish to purge coordinates for "${userEmail}"?\nThis wipes account parameters permanently.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account purge failed');

      triggerNotice(`Successfully purged records of ${userEmail}`, 'success');
      fetchUsers();
      fetchActivities();
    } catch (err: any) {
      triggerNotice(err.message, 'error');
    }
  };

  // Directory Sorting/Filters
  const filteredUsers = users.filter(usr => {
    return usr.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
           usr.uid.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Action log translations
  const getLogSymbol = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('signup') || act.includes('create')) return <UserPlus className="w-3.5 h-3.5 text-blue-500" />;
    if (act.includes('login')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (act.includes('delete')) return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
    if (act.includes('update') || act.includes('reset')) return <Key className="w-3.5 h-3.5 text-amber-500" />;
    if (act.includes('suspended')) return <UserX className="w-3.5 h-3.5 text-rose-500" />;
    if (act.includes('task')) return <Activity className="w-3.5 h-3.5 text-teal-500" />;
    return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
  };

  const filteredLogs = activities.filter(log => {
    if (actionFilter === 'all') return true;
    return log.action.toLowerCase().includes(actionFilter.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto mt-6" id="overseer-deck-view">
      
      {/* Notice Banner notifications */}
      <AnimatePresence>
        {notice && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-xl border ${
              notice.type === 'success' 
                ? 'bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-950 border-neutral-800 dark:border-neutral-200' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span className="text-xs font-semibold tracking-tight">{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Heading Card */}
      <div className="bg-gradient-to-tr from-neutral-900 via-neutral-950 to-zinc-900 text-white rounded-3xl p-7 xl:p-8 shadow-xl mb-6 relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute inset-x-0 bottom-0 top-[60%] bg-gradient-to-t from-black/40 opacity-30" />
        <div className="absolute -right-36 -top-24 w-96 h-96 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none select-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-teal-500/5 blur-[120px] pointer-events-none select-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight font-sans">ADMINISTRATIVE DECK</h2>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-400 tracking-widest uppercase">OVERSEER API</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Maintain coordinate privileges, audit live action loggers, and manage clearance indices.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackToBoard}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white text-xs font-medium rounded-2xl border border-white/10 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              <span>Back to Tasks Board</span>
            </button>
            <button
              id="refresh_data_btn"
              onClick={() => {
                fetchUsers();
                fetchActivities();
              }}
              className="p-2 bg-white/5 hover:bg-white/10 active:rotate-180 text-zinc-300 hover:text-white rounded-2xl border border-white/10 transition-all duration-300 cursor-pointer"
              title="Reload Coordinates"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Micro Indicators Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Personnel', val: users.length, status: 'Synced', color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Cleansed Active', val: users.filter(u => !u.isSuspended).length, status: 'Cleared', color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Overseers Connected', val: users.filter(u => u.role === 'admin').length, status: 'Privileged', color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Recent System Events', val: activities.length, status: 'Logged', color: 'text-zinc-500 bg-neutral-100 dark:bg-zinc-900' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-950/70 border border-neutral-200/40 dark:border-zinc-900/60 p-4 rounded-2xl shadow-xs">
            <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-zinc-550">{item.label}</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans">{item.val}</span>
              <span className="text-[9px] font-mono text-neutral-450 dark:text-zinc-500">[{item.status}]</span>
            </div>
          </div>
        ))}
      </div>

      {/* Luxury Layout Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar Tabs Selectors (Desktop layout) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 p-1.5 bg-neutral-100/50 dark:bg-zinc-950/45 border border-neutral-200/20 dark:border-zinc-900/40 rounded-2xl">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 lg:flex-initial flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer select-none ${
              activeTab === 'directory' 
                ? 'bg-white dark:bg-zinc-900 text-neutral-905 dark:text-white border border-neutral-200/50 dark:border-zinc-805/50 shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-805 hover:bg-neutral-100/50 dark:hover:bg-zinc-900/30'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personnel Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 lg:flex-initial flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold cursor-pointer select-none ${
              activeTab === 'audit' 
                ? 'bg-white dark:bg-zinc-900 text-neutral-905 dark:text-white border border-neutral-200/50 dark:border-zinc-805/50 shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-805 hover:bg-neutral-100/50 dark:hover:bg-zinc-900/30'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Audit Trail</span>
          </button>
        </div>

        {/* Primary Content Deck */}
        <div className="lg:col-span-9 space-y-6">

          {/* Directory Panel */}
          {activeTab === 'directory' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-950/40 border border-neutral-200/40 dark:border-zinc-900/60 rounded-3xl p-5 xl:p-6 shadow-sm"
            >
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-zinc-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 border border-neutral-200/60 dark:border-zinc-850 bg-neutral-100/40 dark:bg-zinc-900/50 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-neutral-450"
                    placeholder="Search personnel email/UID..."
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-neutral-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer shadow-xs select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provision Account</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/30 dark:border-zinc-800/40 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                      <th className="py-3 px-4">Account Metadata</th>
                      <th className="py-3 px-4">Role Clearance</th>
                      <th className="py-3 px-4">Status & Access</th>
                      <th className="py-3 px-4 text-right">Coordinate Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/15 dark:divide-zinc-850/30 text-xs">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-400">
                          <span className="inline-block w-4 h-4 border-2 border-neutral-300 dark:border-zinc-800 border-t-blue-500 rounded-full animate-spin mr-2 align-middle" />
                          <span>Streaming encrypted indices...</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-neutral-400">
                          No users matched search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((userItem) => {
                        const isSelf = userItem.email.toLowerCase() === currentUser.email.toLowerCase();
                        return (
                          <tr 
                            key={userItem.uid} 
                            className={`group hover:bg-neutral-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-150 ${
                              userItem.isSuspended ? 'bg-rose-500/5 opacity-80' : ''
                            }`}
                          >
                            {/* Email / UID details */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border text-xs font-bold font-mono shrink-0 ${
                                  userItem.role === 'admin' 
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                                    : 'bg-neutral-100 dark:bg-zinc-900 border-neutral-200/30 dark:border-zinc-800/30 text-neutral-500'
                                }`}>
                                  {userItem.email.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[200px] sm:max-w-[280px]">
                                  <p className="font-semibold text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5 shrink-0">
                                    <span className="truncate">{userItem.email}</span>
                                    {isSelf && (
                                      <span className="text-[8px] font-mono bg-blue-500/10 text-blue-500 border border-blue-400/20 px-1 py-0.2 rounded-md font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[9px] text-neutral-450 dark:text-zinc-550 font-mono mt-0.5 truncate">
                                    UID: {userItem.uid}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* User role index */}
                            <td className="py-4 px-4 align-middle">
                              <button
                                onClick={() => handleUpdateRole(userItem.email, userItem.role)}
                                disabled={isSelf}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wide border transition-all duration-200 shrink-0 ${
                                  userItem.role === 'admin' 
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                } ${isSelf ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
                                title={isSelf ? 'Cannot demote self' : 'Click to toggle clearance role'}
                              >
                                {userItem.role.toUpperCase()}
                              </button>
                            </td>

                            {/* Suspension Access Control status */}
                            <td className="py-4 px-4 align-middle">
                              <button
                                onClick={() => handleToggleSuspension(userItem.email, userItem.isSuspended)}
                                disabled={isSelf}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all duration-150 ${
                                  userItem.isSuspended 
                                    ? 'bg-rose-500/12 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                                    : 'bg-emerald-500/10 border-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15'
                                } ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                title={isSelf ? 'Self access locked' : 'Click to toggle Suspension access'}
                              >
                                <span className={`w-1 h-1 rounded-full ${userItem.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <span>{userItem.isSuspended ? 'Suspended' : 'Cleared'}</span>
                              </button>
                            </td>

                            {/* Actions toolbar */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => setResettingUser(userItem)}
                                  className="p-1.5 text-neutral-500 hover:text-amber-500 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 rounded-lg border border-neutral-200/30 dark:border-zinc-800/20 transition cursor-pointer"
                                  title="Reset security passphrase"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem.email)}
                                  disabled={isSelf}
                                  className={`p-1.5 rounded-lg border transition ${
                                    isSelf 
                                      ? 'text-neutral-300 dark:text-zinc-800 border-transparent cursor-not-allowed' 
                                      : 'text-neutral-500 hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/10 cursor-pointer border-neutral-200/30 dark:border-zinc-800/20'
                                  }`}
                                  title={isSelf ? 'Absolute core admin' : 'Purge coordinates'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </motion.div>
          )}

          {/* Audit Logging trace Panel */}
          {activeTab === 'audit' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-950/40 border border-neutral-200/40 dark:border-zinc-900/60 rounded-3xl p-5 xl:p-6 shadow-sm"
            >
              
              {/* Header filter tags */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-neutral-200/25 dark:border-zinc-900/40 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wider font-mono">Live Session Trace Logs</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-neutral-100/50 dark:bg-zinc-900/50 border border-neutral-200/20 dark:border-zinc-850 p-1 rounded-xl">
                  <Filter className="w-3 h-3 text-neutral-400 ml-1.5" />
                  {[
                    { id: 'all', label: 'All Trails' },
                    { id: 'login', label: 'Logins' },
                    { id: 'admin', label: 'Admins' },
                    { id: 'task', label: 'Tasks' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActionFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-tight transition cursor-pointer select-none ${
                        actionFilter === tab.id 
                          ? 'bg-white dark:bg-zinc-850 text-neutral-900 dark:text-white shadow-xs border border-neutral-200/40 dark:border-zinc-800/50' 
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log Timeline block */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {loadingActivities ? (
                  <div className="py-12 text-center text-neutral-450">
                    <span className="inline-block w-4 h-4 border-2 border-neutral-300 dark:border-zinc-800 border-t-indigo-500 rounded-full animate-spin mr-2 align-middle" />
                    <span>Re-aligning audit ledger...</span>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-neutral-405 font-mono text-xs">
                    [SYSTEM_LOG: EMPTY_SET_EXCEPTION] - No logs match security criteria.
                  </div>
                ) : (
                  filteredLogs.map((logItem, idx) => (
                    <motion.div
                      key={logItem.id || idx}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                      className="p-3 bg-neutral-50/50 dark:bg-zinc-900/20 border border-neutral-200/20 dark:border-zinc-850/40 rounded-xl flex items-start gap-3 hover:border-neutral-200/50 dark:hover:border-zinc-800/80 transition-all duration-200"
                    >
                      <div className="p-2 bg-white dark:bg-zinc-950 border border-neutral-200/35 dark:border-zinc-800/30 rounded-lg shadow-xs shrink-0 mt-0.5">
                        {getLogSymbol(logItem.action)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-[10px] font-mono uppercase bg-neutral-100/70 dark:bg-zinc-900 px-2 py-0.5 rounded-md text-neutral-500 dark:text-zinc-450 border border-neutral-200/10 dark:border-zinc-800/20 font-bold self-start sm:self-auto select-none">
                            {logItem.action}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            {new Date(logItem.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-805 dark:text-neutral-200 font-medium mt-1.5 pl-0.5">
                          {logItem.details}
                        </p>

                        <div className="flex items-center gap-1.5 text-[9px] text-neutral-450 dark:text-zinc-550 mt-1 pl-0.5">
                          <span>User Action:</span>
                          <span className="font-semibold text-neutral-700 dark:text-zinc-400">{logItem.email}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

            </motion.div>
          )}

        </div>
      </div>

      {/* CREATE NEW PERSONALS MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-neutral-950/45 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-950 border border-neutral-200/80 dark:border-zinc-900 shadow-2xl rounded-3xl max-w-md w-full relative z-10 overflow-hidden"
            >
              
              <div className="p-6 border-b border-neutral-200/15 dark:border-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-sans">
                      Clearance Provisioning
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                
                {createError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs rounded-xl font-medium">
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-medium">
                    {createSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">
                    User Contact Address Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 text-xs border border-neutral-250 dark:border-zinc-850 bg-neutral-50 dark:bg-zinc-90 w-full rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="employee@corporate.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">
                    Initial Security Passphrase
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 text-xs border border-neutral-250 dark:border-zinc-850 bg-neutral-50 dark:bg-zinc-90 w-full rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Minimum 6 security codes"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">
                    Clearance Security Role
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNewRole('user')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition select-none cursor-pointer ${
                        newRole === 'user' 
                          ? 'bg-blue-500/10 border-blue-550 text-blue-500 font-bold' 
                          : 'bg-transparent border-neutral-200 dark:border-zinc-850 text-neutral-400'
                      }`}
                    >
                      Contributor (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('admin')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition select-none cursor-pointer ${
                        newRole === 'admin' 
                          ? 'bg-amber-500/10 border-amber-550 text-amber-500 font-bold' 
                          : 'bg-transparent border-neutral-200 dark:border-zinc-850 text-neutral-400'
                      }`}
                    >
                      Overseer (Admin)
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isSubmitUser}
                    type="submit"
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-neutral-950 rounded-xl text-xs font-bold transition duration-200 select-none cursor-pointer shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitUser ? (
                      <>
                        <span className="w-3 h-3 border border-neutral-300 dark:border-zinc-800 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Provisioning Coordinate...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Company User Account</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD RESET MODAL */}
      <AnimatePresence>
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResettingUser(null)}
              className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-900 shadow-2xl rounded-3xl max-w-sm w-full relative z-10 overflow-hidden"
            >
              <div className="p-5 border-b border-neutral-200/15 dark:border-zinc-900/40">
                <h3 className="text-xs font-bold text-neutral-850 dark:text-white uppercase tracking-wider font-sans">
                  Reset Security Account
                </h3>
                <p className="text-[10px] text-neutral-450 dark:text-zinc-550 mt-1 truncate">
                  Purging cryptographic state for {resettingUser.email}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="p-5 space-y-4">
                
                {resetError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl">
                    {resetSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-neutral-450 dark:text-zinc-550 uppercase tracking-widest mb-1">
                    New Alpha-Security Code
                  </label>
                  <input
                    type="password"
                    required
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    className="block w-full px-3 py-2 text-xs border border-neutral-250 dark:border-zinc-850 bg-neutral-50 dark:bg-zinc-90 w-full rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Enter 6+ character passwords"
                  />
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    className="flex-1 py-2 border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900 select-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-455 text-white text-xs font-bold rounded-xl select-none cursor-pointer shadow-xs"
                  >
                    Apply Index Code
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
