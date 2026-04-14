import { useState, useEffect } from 'react';
import { attendanceApi } from '@/services/attendanceApi';
import type { AttendanceSession } from '@/types/attendance';
import { Plus, QrCode, MapPin, Users, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AttendanceList() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: 'default',
    scheduledStart: '',
    toleranceMinutes: 15,
    requireQRCode: false,
    requireGeoLocation: false,
  });

  useEffect(() => {
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
      if (response.success) loadSessions();
    } catch (error) {
      console.error('End error:', error);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} /> Create Session
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">New Attendance Session</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
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

        {activeSession && qrCode && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">QR Code</h3>
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            <p className="text-sm text-gray-500 mt-2">Expires in 15 minutes</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active attendance sessions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{session.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {session.toleranceMinutes} min tolerance
                      </span>
                      {session.requireQRCode && <QrCode size={16} />}
                      {session.requireGeoLocation && <MapPin size={16} />}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-green-600">{session.totalPresent} present</span>
                      <span className="mx-2">|</span>
                      <span className="text-red-600">{session.totalAbsent} absent</span>
                      <span className="mx-2">|</span>
                      <span className="text-yellow-600">{session.totalLate} late</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'scheduled' && (
                      <button onClick={() => handleStart(session.id)} className="btn btn-primary flex items-center gap-2">
                        <Play size={18} /> Start
                      </button>
                    )}
                    {session.status === 'active' && (
                      <button onClick={() => handleEnd(session.id)} className="btn btn-secondary flex items-center gap-2">
                        <CheckCircle size={18} /> End
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}