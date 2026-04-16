import { useState, useEffect } from 'react';
import { attendanceApi } from '@/services/attendanceApi';
import { useAuthStore } from '@/services/authStore';
import api from '@/services/api';
import type { AttendanceSession } from '@/types/attendance';
import { 
  Plus, QrCode, MapPin, Users, Play, Clock, 
  CheckCircle, ArrowLeft, XCircle, RefreshCw, 
  ClipboardCheck, Lock, Unlock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: 'default',
    batchId: '',
    scheduledStart: '',
    toleranceMinutes: 15,
    requireQRCode: false,
    requireGeoLocation: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batchId');
    if (batchId) {
      setFormData(prev => ({ ...prev, batchId }));
      setShowForm(true);
    }
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await attendanceApi.getActiveSessions();
      if (response.success) setSessions(response.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (session: AttendanceSession) => {
    setSelectedSession(session);
    setLoadingRecords(true);
    try {
      const res = await attendanceApi.getSessionRecords(session.id);
      if (res.success) setSessionRecords(res.data);
      
      // Also load students from the batch to allow manual marking for missing records
      if (session.batchId) {
        const batchRes = await api.get(`/batches/${session.batchId}`);
        if (batchRes.data.success) {
          setBatchStudents(batchRes.data.data.students || []);
        }
      }
    } catch (error) {
      console.error('Load details error:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await attendanceApi.createSession(formData);
      if (response.success) {
        setShowForm(false);
        loadSessions();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      const response = await attendanceApi.startSession(id);
      if (response.success) {
        loadSessions();
        if (response.data.requireQRCode) {
          const qrRes = await attendanceApi.getQRCode(id);
          if (qrRes.success) setQrCode(qrRes.data.qrCode);
        }
      }
    } catch (error) {
      console.error('Start error:', error);
    }
  };

  const handleEnd = async (id: string) => {
    try {
      const response = await attendanceApi.endSession(id);
      if (response.success) {
        loadSessions();
        if (selectedSession?.id === id) {
          loadSessionDetails(response.data);
        }
      }
    } catch (error) {
      console.error('End error:', error);
    }
  };

  const handleMarkManual = async (targetUserId: string, status: string) => {
    if (!selectedSession) return;
    try {
      const res = await attendanceApi.markManual({
        sessionId: selectedSession.id,
        targetUserId,
        status
      });
      if (res.success) {
        loadSessionDetails(selectedSession);
        loadSessions(); // refresh counts
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleMarkBatch = async (status: string) => {
    if (!selectedSession || !selectedSession.batchId) return;
    if (!confirm(`Mark entire batch as ${status}?`)) return;
    
    try {
      const res = await attendanceApi.markBatch({
        sessionId: selectedSession.id,
        batchId: selectedSession.batchId,
        status
      });
      if (res.success) {
        loadSessionDetails(selectedSession);
        loadSessions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark batch');
    }
  };

  const handleToggleLock = async () => {
    if (!selectedSession) return;
    try {
      const res = await attendanceApi.toggleLock(selectedSession.id, !selectedSession.isLocked);
      if (res.success) {
        setSelectedSession(res.data);
        loadSessions();
      }
    } catch (error) {
      console.error('Toggle lock error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return styles[status] || styles.scheduled;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} /> Create Session
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Attendance Session</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Class Session"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch</label>
                  <select
                    className="input"
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    required
                  >
                    <option value="">Select a batch</option>
                    {user?.assignedBatches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.toleranceMinutes}
                    onChange={(e) => setFormData({ ...formData, toleranceMinutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requireQRCode}
                    onChange={(e) => setFormData({ ...formData, requireQRCode: e.target.checked })}
                  />
                  <QrCode size={18} /> Require QR Code
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requireGeoLocation}
                    onChange={(e) => setFormData({ ...formData, requireGeoLocation: e.target.checked })}
                  />
                  <MapPin size={18} /> Require Location
                </label>
              </div>
              <button type="submit" className="btn btn-primary">Create Session</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest px-1">Active & Scheduled</h3>
            {loading ? (
              <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-primary-600" /></div>
            ) : sessions.length === 0 ? (
              <div className="card text-center p-8 text-gray-400">No active sessions</div>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => loadSessionDetails(session)}
                  className={`card cursor-pointer transition-all ${selectedSession?.id === session.id ? 'ring-2 ring-primary-600 shadow-lg' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{session.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Users size={14} />
                    <span>{session.totalPresent} Present</span>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'scheduled' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStart(session.id); }}
                        className="btn btn-primary text-[10px] py-1 px-3"
                      >
                        Start Session
                      </button>
                    )}
                    {session.status === 'active' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEnd(session.id); }}
                        className="btn btn-secondary text-[10px] py-1 px-3"
                      >
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Session Detail & Records */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <div className="card h-full flex flex-col items-center justify-center py-20 text-gray-400 border-dashed">
                <ClipboardCheck size={48} className="mb-4 opacity-20" />
                <p>Select a session to manage attendance</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="card">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedSession.title}</h2>
                      <p className="text-sm text-gray-500">Batch: {user?.assignedBatches?.find((b: any) => b.id === selectedSession.batchId)?.name || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedSession.isLocked ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                          <Lock size={14} /> Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                          <Unlock size={14} /> Unlocked
                        </span>
                      )}
                      {(user?.role === 'admin' || selectedSession.createdById === user?.id) && (
                        <button 
                          onClick={handleToggleLock}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                          title={selectedSession.isLocked ? "Unlock Session" : "Lock Session"}
                        >
                          {selectedSession.isLocked ? <Unlock size={20} /> : <Lock size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Present</p>
                      <p className="text-2xl font-black text-green-700">{selectedSession.totalPresent}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Absent</p>
                      <p className="text-2xl font-black text-red-700">{selectedSession.totalAbsent}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                      <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Late</p>
                      <p className="text-2xl font-black text-yellow-700">{selectedSession.totalLate}</p>
                    </div>
                  </div>

                  {!selectedSession.isLocked && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button onClick={() => handleMarkBatch('present')} className="flex-1 btn bg-green-600 text-white hover:bg-green-700 text-xs py-2">Mark All Present</button>
                      <button onClick={() => handleMarkBatch('absent')} className="flex-1 btn bg-red-600 text-white hover:bg-red-700 text-xs py-2">Mark All Absent</button>
                    </div>
                  )}
                </div>

                <div className="card overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Student List</h3>
                    <div className="text-xs text-gray-500 font-medium">
                      Showing {batchStudents.length} students
                    </div>
                  </div>
                  
                  {loadingRecords ? (
                    <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary-600" /></div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                          <th className="text-center px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="text-right px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {batchStudents.map(student => {
                          const record = sessionRecords.find(r => r.userId === student.id);
                          return (
                            <tr key={student.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-sm text-gray-900">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {record ? (
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
                                    record.status === 'present' ? 'bg-green-100 text-green-700' :
                                    record.status === 'absent' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {record.status}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-300 uppercase italic">Not Marked</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!selectedSession.isLocked ? (
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={() => handleMarkManual(student.id, 'present')}
                                      className={`p-1.5 rounded-lg border transition-all ${record?.status === 'present' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-green-600 hover:text-green-600'}`}
                                      title="Mark Present"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleMarkManual(student.id, 'absent')}
                                      className={`p-1.5 rounded-lg border transition-all ${record?.status === 'absent' ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-red-600 hover:text-red-600'}`}
                                      title="Mark Absent"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <Lock size={14} className="text-gray-300 ml-auto" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
