import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Plus, Search, Trash2, Edit, Shield, GraduationCap, 
  UserCog, X, Loader2, ArrowLeft, ChevronLeft, ChevronRight,
  Upload, FileSpreadsheet, Check, AlertCircle, Calendar, BookOpen,
  UserPlus, UserX, Mail, Phone, Settings, Layout
} from 'lucide-react';
import api from '@/services/api';
import { batchApi, Batch } from '@/services/batchApi';
import type { User, UserRole, UserStatus } from '@/types';
import { Modal } from '@/components/PopupMenu';

const ROLES: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'faculty', label: 'Faculty', icon: UserCog },
  { value: 'admin', label: 'Admin', icon: Shield },
];

const STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700' },
];

type TabType = 'users' | 'batches' | 'faculty';

export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'student' as UserRole,
    status: 'active' as UserStatus,
    batchId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Batches State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchFormData, setBatchFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    isActive: true
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedBatchForImport, setSelectedBatchForImport] = useState<Batch | null>(null);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

  // Faculty state
  const [faculty, setFaculty] = useState<User[]>([]);
  const [showAssignBatchModal, setShowAssignBatchModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);
  const [assignedBatchIds, setAssignedBatchIds] = useState<string[]>([]);

  const [viewingBatchStudents, setViewingBatchStudents] = useState<Batch | null>(null);

  const downloadSampleFormat = () => {
    const headers = "Student ID,Student Name,Student Email,Course,Batch,Date,Total Days,Present,Absent,Leave,% Attendance,Remarks";
    const dummyRow = "STU001,Student Name,student@mail.com,BCA,BCA-1A,2026-04-01,30,26,3,1,86.67%,Good";
    const csvContent = headers + "\n" + dummyRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_import_sample.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          role: roleFilter || undefined,
          page,
          limit,
          search
        }
      });
      if (res.data.success) {
        setUsers(res.data.data);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchApi.getAll();
      if (res.success) {
        setBatches(res.data);
        // Also refresh the currently viewed batch if applicable
        if (viewingBatchStudents) {
          const current = res.data.find((b: Batch) => b.id === viewingBatchStudents.id);
          if (current) setViewingBatchStudents(current);
        }
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchDetails = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await batchApi.getOne(id);
      if (res.success) {
        setViewingBatchStudents(res.data);
      } else {
        setError(res.message || 'Failed to load batch students');
      }
    } catch (err: any) {
      console.error('Failed to fetch batch details:', err);
      setError(err.response?.data?.message || 'Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', { params: { role: 'faculty', limit: 100 } });
      if (res.data.success) {
        setFaculty(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setViewingBatchStudents(null);
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'batches') fetchBatches();
    else if (activeTab === 'faculty') {
      fetchFaculty();
      fetchBatches();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [roleFilter, page, limit]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        if (page !== 1) setPage(1);
        else fetchUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // User Handlers
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingUser) {
        const updateData: any = { ...userFormData };
        if (!updateData.password) delete updateData.password;
        const res = await api.put(`/users/${editingUser.id}`, updateData);
        if (res.data.success) {
          setShowUserModal(false);
          fetchUsers();
          fetchBatches();
        }
      } else {
        const res = await api.post('/users', userFormData);
        if (res.data.success) {
          setShowUserModal(false);
          fetchUsers();
          fetchBatches();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Batch Handlers
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBatch) {
        await batchApi.update(editingBatch.id, batchFormData);
      } else {
        await batchApi.create(batchFormData);
      }
      setShowBatchModal(false);
      fetchBatches();
    } catch (err) {
      alert('Failed to save batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure? This will unassign all students from this batch.')) return;
    try {
      await batchApi.delete(id);
      fetchBatches();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleExcelPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await batchApi.previewExcel(file);
      if (res.success) {
        setPreviewStudents(res.data);
        setSelectedStudents(new Set(res.data.map((_: any, i: number) => i)));
      }
    } catch (err) {
      alert('Failed to parse Excel');
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedBatchForImport) return;
    setIsImporting(true);
    try {
      const studentsToImport = previewStudents.filter((_, i) => selectedStudents.has(i));
      const res = await batchApi.bulkAddStudents(selectedBatchForImport.id, studentsToImport);
      if (res.success) {
        alert(`Successfully imported ${res.data.success} students.`);
        setShowImportModal(false);
        fetchUsers();
        fetchBatches();
        if (viewingBatchStudents?.id === selectedBatchForImport.id) {
          const updated = await batchApi.getOne(selectedBatchForImport.id);
          if (updated.success) setViewingBatchStudents(updated.data);
        }
      }
    } catch (err) {
      alert('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // Faculty Assignment Handlers
  const handleOpenAssign = (f: User) => {
    setSelectedFaculty(f);
    // Find batches assigned to this faculty
    const facultyBatches = batches.filter(b => b.assignedFaculty?.some(af => af.id === f.id));
    setAssignedBatchIds(facultyBatches.map(b => b.id));
    setShowAssignBatchModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedFaculty) return;
    setSubmitting(true);
    try {
      // Need to update each batch's faculty list or have a central endpoint
      // Our API supports batchId -> list of facultyIds
      // We need to invert this logic or update all relevant batches
      for (const batch of batches) {
        const isCurrentlyAssigned = batch.assignedFaculty?.some(af => af.id === selectedFaculty.id);
        const shouldBeAssigned = assignedBatchIds.includes(batch.id);

        if (isCurrentlyAssigned !== shouldBeAssigned) {
          const newFacultyIds = batch.assignedFaculty?.map(af => af.id) || [];
          if (shouldBeAssigned) {
            newFacultyIds.push(selectedFaculty.id);
          } else {
            const idx = newFacultyIds.indexOf(selectedFaculty.id);
            if (idx > -1) newFacultyIds.splice(idx, 1);
          }
          await batchApi.assignFaculty(batch.id, newFacultyIds);
        }
      }
      setShowAssignBatchModal(false);
      fetchFaculty();
      fetchBatches();
    } catch (err) {
      alert('Failed to update assignments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-600">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
              </div>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['users', 'batches', 'faculty'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                    activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !viewingBatchStudents && (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in">
            <AlertCircle size={20} />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {activeTab === 'users' && !loading && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                  className="input w-full sm:w-48"
                >
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={() => { setEditingUser(null); setUserFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'student', status: 'active', batchId: '' }); setShowUserModal(true); }} className="btn btn-primary flex items-center gap-2 whitespace-nowrap">
                  <Plus size={20} /> Add User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
            ) : (
              <div className="card overflow-hidden">
                <table className="divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">
                            {ROLES.find(r => r.value === u.role)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUSES.find(s => s.value === u.status)?.color}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingUser(u); setUserFormData({ ...u, password: '', batchId: u.batchId || '' }); setShowUserModal(true); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit size={18} /></button>
                            <button onClick={async () => { if(confirm('Delete user?')) { await api.delete(`/users/${u.id}`); fetchUsers(); } }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination (Simplified) */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total: {total} Users</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1 disabled:opacity-30"><ChevronLeft /></button>
                    <span className="text-sm font-bold">{page}</span>
                    <button onClick={() => setPage(p => p+1)} disabled={page * limit >= total} className="p-1 disabled:opacity-30"><ChevronRight /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'batches' && !loading && !viewingBatchStudents && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Academic Batches</h2>
              <div className="flex gap-3">
                <button 
                  onClick={downloadSampleFormat}
                  className="btn bg-white border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Upload size={20} className="text-primary-600" />
                  Download Sample CSV
                </button>
                <button onClick={() => { setEditingBatch(null); setBatchFormData({ name: '', description: '', courseId: '', isActive: true }); setShowBatchModal(true); }} className="btn btn-primary flex items-center gap-2">
                  <Plus size={20} /> Create Batch
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map(batch => (
                <div key={batch.id} className="card group hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        <Layout size={24} />
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${batch.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">{batch.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{batch.description || 'No description provided'}</p>
                    
                    <div className="flex items-center justify-between py-3 border-y border-gray-50 mb-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                        <p className="text-lg font-black text-gray-900">{batch.students?.length || 0}</p>
                      </div>
                      <div className="text-center border-x border-gray-100 px-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faculty</p>
                        <p className="text-lg font-black text-gray-900">{batch.assignedFaculty?.length || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course</p>
                        <p className="text-sm font-black text-primary-600">{batch.courseId || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => loadBatchDetails(batch.id)}
                        className="btn btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <Users size={14} /> View Students
                      </button>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedBatchForImport(batch); setPreviewStudents([]); setShowImportModal(true); }}
                          className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs py-2 flex items-center justify-center gap-1.5"
                        >
                          <Upload size={14} /> Import
                        </button>
                        <button 
                          onClick={() => { setEditingBatch(batch); setBatchFormData({ ...batch }); setShowBatchModal(true); }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'batches' && !loading && viewingBatchStudents && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewingBatchStudents(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all hover:scale-110"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{viewingBatchStudents.name} Students</h2>
                  <p className="text-sm text-gray-500 font-medium">Managing {viewingBatchStudents.students?.length || 0} enrolled students</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedBatchForImport(viewingBatchStudents); setPreviewStudents([]); setShowImportModal(true); }}
                  className="btn bg-white border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Upload size={18} className="text-primary-600" />
                  Import XLSX/CSV
                </button>
                <button 
                  onClick={() => { 
                    setEditingUser(null); 
                    setUserFormData({ 
                      email: '', password: '', firstName: '', lastName: '', phone: '', 
                      role: 'student', status: 'active', batchId: viewingBatchStudents.id 
                    }); 
                    setShowUserModal(true); 
                  }} 
                  className="btn btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={18} /> Add Student
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!viewingBatchStudents.students || viewingBatchStudents.students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  ) : (
                    viewingBatchStudents.students.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <span className="font-bold text-gray-900">{s.firstName} {s.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{s.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{s.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { 
                                setEditingUser(s); 
                                setUserFormData({ ...s, password: '', batchId: s.batchId || viewingBatchStudents.id }); 
                                setShowUserModal(true); 
                              }}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Remove student from this batch?')) {
                                  await api.put(`/users/${s.id}`, { batchId: null });
                                  const updated = await batchApi.getOne(viewingBatchStudents.id);
                                  if (updated.success) setViewingBatchStudents(updated.data);
                                  fetchBatches();
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <UserX size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Faculty Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faculty.map(f => (
                <div key={f.id} className="card p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner">
                        {f.firstName[0]}{f.lastName[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900">{f.firstName} {f.lastName}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={12}/> {f.email}</span>
                          {f.phone && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={12}/> {f.phone}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Batches</p>
                      <div className="flex flex-wrap gap-2">
                        {batches.filter(b => b.assignedFaculty?.some(af => af.id === f.id)).map(b => (
                          <span key={b.id} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow-sm">
                            {b.name}
                          </span>
                        ))}
                        {batches.filter(b => b.assignedFaculty?.some(af => af.id === f.id)).length === 0 && (
                          <p className="text-xs text-gray-400 italic">No batches assigned yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col justify-center gap-2">
                    <button 
                      onClick={() => handleOpenAssign(f)}
                      className="btn btn-primary text-xs py-2 flex items-center gap-2"
                    >
                      <UserPlus size={16} /> Assign Batches
                    </button>
                    <button 
                      onClick={() => navigate(`/reports?facultyId=${f.id}`)}
                      className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs py-2 flex items-center gap-2"
                    >
                      <BookOpen size={16} /> View Performance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleUserSubmit} className="space-y-4 p-1">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name</label><input type="text" required value={userFormData.firstName} onChange={e => setUserFormData({...userFormData, firstName: e.target.value})} className="input" /></div>
            <div><label className="label">Last Name</label><input type="text" required value={userFormData.lastName} onChange={e => setUserFormData({...userFormData, lastName: e.target.value})} className="input" /></div>
          </div>
          <div><label className="label">Email</label><input type="email" required disabled={!!editingUser} value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="input" /></div>
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select 
                value={userFormData.role} 
                onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} 
                className="input"
                disabled={!!viewingBatchStudents}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
              <div>
                <label className="label">Status</label>
                <select value={userFormData.status} onChange={e => setUserFormData({...userFormData, status: e.target.value as UserStatus})} className="input">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            {userFormData.role === 'student' && (
              <div>
                <label className="label">Assign to Batch</label>
                <select 
                  value={userFormData.batchId} 
                  onChange={e => setUserFormData({...userFormData, batchId: e.target.value})} 
                  className="input"
                  disabled={!!viewingBatchStudents}
                >
                  <option value="">No Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          <div><label className="label">Password {editingUser && '(Leave blank to keep current)'}</label><input type="password" required={!editingUser} value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className="input" /></div>
          <button disabled={submitting} className="btn btn-primary w-full py-3 mt-4">{submitting ? 'Processing...' : (editingUser ? 'Update User' : 'Create User')}</button>
        </form>
      </Modal>

      {/* Batch Modal */}
      <Modal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} title={editingBatch ? 'Edit Batch' : 'Create New Batch'}>
        <form onSubmit={handleBatchSubmit} className="space-y-4 p-1">
          <div><label className="label">Batch Name</label><input type="text" required value={batchFormData.name} onChange={e => setBatchFormData({...batchFormData, name: e.target.value})} className="input" placeholder="e.g. CS-2024-A" /></div>
          <div><label className="label">Course ID</label><input type="text" value={batchFormData.courseId} onChange={e => setBatchFormData({...batchFormData, courseId: e.target.value})} className="input" placeholder="e.g. CS101" /></div>
          <div><label className="label">Description</label><textarea value={batchFormData.description} onChange={e => setBatchFormData({...batchFormData, description: e.target.value})} className="input" rows={3}></textarea></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="batchActive" checked={batchFormData.isActive} onChange={e => setBatchFormData({...batchFormData, isActive: e.target.checked})} className="rounded text-primary-600" />
            <label htmlFor="batchActive" className="text-sm font-bold text-gray-700">Active Batch</label>
          </div>
          <button disabled={submitting} className="btn btn-primary w-full py-3 mt-2">{submitting ? 'Saving...' : 'Save Batch'}</button>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => !isImporting && setShowImportModal(false)} title={`Import Students to ${selectedBatchForImport?.name}`} size="lg">
        <div className="space-y-6">
          {!previewStudents.length ? (
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
              <input type="file" id="excel-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelPreview} />
              <label htmlFor="excel-upload" className="flex flex-col items-center gap-4 cursor-pointer">
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center shadow-inner">
                  <FileSpreadsheet size={32} />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900">Upload Student Data</p>
                  <p className="text-sm text-gray-500">Supported formats: XLSX, CSV</p>
                  <p className="text-[10px] text-gray-400 mt-1 italic">Format: Student ID, Student Name, Student Email, ...</p>
                </div>
                <div className="btn bg-gray-900 text-white hover:bg-black px-8">Browse Files</div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-black text-gray-900">Found {previewStudents.length} Students</p>
                  <p className="text-xs text-gray-500">{selectedStudents.size} selected for import</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewStudents([])} className="btn bg-white border-gray-200 text-gray-600 text-xs">Reset</button>
                  <button onClick={handleImportSubmit} disabled={isImporting || selectedStudents.size === 0} className="btn btn-primary text-xs px-6">
                    {isImporting ? 'Importing...' : 'Finalize Import'}
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.size === previewStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudents(new Set(previewStudents.map((_, i) => i)));
                            else setSelectedStudents(new Set());
                          }}
                        />
                      </th>
                      <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Email</th>
                      <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Name</th>
                      <th className="p-3 text-[10px] font-black text-gray-400 uppercase text-right">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewStudents.map((s, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${selectedStudents.has(i) ? 'bg-primary-50/30' : ''}`}>
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.has(i)}
                            onChange={() => {
                              const next = new Set(selectedStudents);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              setSelectedStudents(next);
                            }}
                          />
                        </td>
                        <td className="p-3 text-sm font-bold text-gray-900">{s.email}</td>
                        <td className="p-3 text-sm text-gray-600">{s.firstName} {s.lastName}</td>
                        <td className="p-3 text-sm text-gray-500 text-right">{s.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Faculty Assign Modal */}
      <Modal isOpen={showAssignBatchModal} onClose={() => setShowAssignBatchModal(false)} title={`Assign Batches to ${selectedFaculty?.firstName}`} size="md">
        <div className="space-y-6">
          <p className="text-sm text-gray-500 italic">Select the batches this faculty member will manage. They will be able to mark attendance and assign work to these students.</p>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {batches.map(batch => (
              <label key={batch.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${assignedBatchIds.includes(batch.id) ? 'border-primary-600 bg-primary-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${assignedBatchIds.includes(batch.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {assignedBatchIds.includes(batch.id) && <Check size={14} className="text-white" />}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{batch.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{batch.students?.length || 0} Students</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={assignedBatchIds.includes(batch.id)}
                  onChange={() => {
                    if (assignedBatchIds.includes(batch.id)) setAssignedBatchIds(assignedBatchIds.filter(id => id !== batch.id));
                    else setAssignedBatchIds([...assignedBatchIds, batch.id]);
                  }}
                />
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowAssignBatchModal(false)} className="flex-1 btn bg-gray-100 text-gray-700">Cancel</button>
            <button onClick={handleAssignSubmit} disabled={submitting} className="flex-1 btn btn-primary">
              {submitting ? 'Updating...' : 'Confirm Assignments'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
