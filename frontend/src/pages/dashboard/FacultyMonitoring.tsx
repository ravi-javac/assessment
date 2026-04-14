import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { monitoringApi } from '@/services/monitoringApi';
import { proctoringApi } from '@/services/proctoringApi';
import type { ExamSession, LiveExamActivity, SessionStats, LiveStudent } from '@/types/monitoring';
import { 
  Play, Pause, Square, Users, AlertTriangle, 
  Clock, Bell, Shield, Eye, ChevronDown, ChevronUp,
  Send, Image, AlertCircle
} from 'lucide-react';

export default function FacultyMonitoring() {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<ExamSession | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [activities, setActivities] = useState<LiveExamActivity[]>([]);
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<LiveStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [selectedViolationTab, setSelectedViolationTab] = useState<'violations' | 'snapshots'>('violations');
  const [violations, setViolations] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  
  const refreshRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
      startAutoRefresh();
    }
    
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const [sessionRes, statsRes, activitiesRes] = await Promise.all([
        monitoringApi.getSession(sessionId!),
        monitoringApi.getSessionStats(sessionId!),
        monitoringApi.getActivities(sessionId!),
      ]);

      if (sessionRes.success) setSession(sessionRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (activitiesRes.success) setActivities(activitiesRes.data);
      
      const studentMap = new Map();
      for (const activity of activitiesRes.data || []) {
        if (activity.attemptId && activity.activityType === 'start') {
          studentMap.set(activity.attemptId, {
            attemptId: activity.attemptId,
            lastActivity: activity.timestamp,
            currentQuestion: 1,
          });
        }
      }
      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Load session error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (attemptId: string) => {
    try {
      const [violationRes, snapshotRes] = await Promise.all([
        proctoringApi.getEvents(attemptId),
        proctoringApi.getSnapshots(attemptId),
      ]);
      
      if (violationRes.success) setViolations(violationRes.data);
      if (snapshotRes.success) setSnapshots(snapshotRes.data);
    } catch (error) {
      console.error('Load student details error:', error);
    }
  };

  const startAutoRefresh = () => {
    refreshRef.current = setInterval(() => {
      loadSessionData();
    }, 5000);
  };

  const handleStart = async () => {
    try {
      const response = await monitoringApi.startSession(sessionId!);
      if (response.success) {
        setSession(response.data);
        loadSessionData();
      }
    } catch (error) {
      console.error('Start error:', error);
    }
  };

  const handlePause = async () => {
    try {
      const response = await monitoringApi.pauseSession(sessionId!);
      if (response.success) {
        setSession(response.data);
        loadSessionData();
      }
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const handleResume = async () => {
    try {
      const response = await monitoringApi.resumeSession(sessionId!);
      if (response.success) {
        setSession(response.data);
        loadSessionData();
      }
    } catch (error) {
      console.error('Resume error:', error);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this exam session?')) return;
    
    try {
      const response = await monitoringApi.endSession(sessionId!);
      if (response.success) {
        setSession(response.data);
        loadSessionData();
      }
    } catch (error) {
      console.error('End error:', error);
    }
  };

  const handleSendWarning = async (attemptId: string) => {
    const message = prompt('Enter warning message:');
    if (!message) return;
    
    try {
      await monitoringApi.sendWarning({ attemptId, message });
      alert('Warning sent');
    } catch (error) {
      console.error('Send warning error:', error);
    }
  };

  const handleForceSubmit = async (attemptId: string) => {
    if (!confirm('Are you sure you want to force submit this students exam?')) return;
    
    try {
      const response = await monitoringApi.forceSubmit(attemptId);
      if (response.success) {
        alert('Exam force submitted');
        loadSessionData();
      }
    } catch (error) {
      console.error('Force submit error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Exam Monitoring</h1>
              <p className="text-sm text-gray-500">Session: {session?.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full font-medium ${
                session?.status === 'live' ? 'bg-green-100 text-green-700' :
                session?.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {session?.status?.toUpperCase()}
              </span>
              {showControls && (
                <div className="flex gap-2">
                  {session?.status === 'scheduled' && (
                    <button onClick={handleStart} className="btn btn-primary flex items-center gap-2">
                      <Play size={18} /> Start
                    </button>
                  )}
                  {session?.status === 'live' && (
                    <button onClick={handlePause} className="btn btn-secondary flex items-center gap-2">
                      <Pause size={18} /> Pause
                    </button>
                  )}
                  {session?.status === 'paused' && (
                    <button onClick={handleResume} className="btn btn-primary flex items-center gap-2">
                      <Play size={18} /> Resume
                    </button>
                  )}
                  {(session?.status === 'live' || session?.status === 'paused') && (
                    <button onClick={handleEnd} className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2">
                      <Square size={18} /> End
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.started || 0}</p>
                <p className="text-sm text-gray-600">Started</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.submitted || 0}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.warnings || 0}</p>
                <p className="text-sm text-gray-600">Warnings</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.violations || 0}</p>
                <p className="text-sm text-gray-600">Violations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Live Students</h3>
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students have started yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Student</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Last Activity</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.attemptId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm">
                                {index + 1}
                              </span>
                              <span className="font-medium">{student.attemptId.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600">
                            {new Date(student.lastActivity).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              In Progress
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleSendWarning(student.attemptId)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                                title="Send Warning"
                              >
                                <Bell size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedStudent(student);
                                  loadStudentDetails(student.attemptId);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleForceSubmit(student.attemptId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Force Submit"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className={`w-2 h-2 rounded-full ${
                      activity.activityType === 'start' ? 'bg-green-500' :
                      activity.activityType === 'submit' ? 'bg-blue-500' :
                      activity.activityType === 'violation' ? 'bg-red-500' :
                      activity.activityType === 'warning' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium w-20">{activity.activityType}</span>
                    <span className="text-sm text-gray-500 flex-1">{activity.attemptId?.slice(0, 12)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Student Details</h3>
                {selectedStudent && (
                  <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                    <ChevronUp size={20} />
                  </button>
                )}
              </div>
              
              {selectedStudent ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium">{selectedStudent.attemptId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Activity</p>
                    <p className="font-medium">
                      {new Date(selectedStudent.lastActivity).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setSelectedViolationTab('violations')}
                        className={`flex-1 py-2 text-sm rounded ${
                          selectedViolationTab === 'violations'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Violations
                      </button>
                      <button
                        onClick={() => setSelectedViolationTab('snapshots')}
                        className={`flex-1 py-2 text-sm rounded ${
                          selectedViolationTab === 'snapshots'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Snapshots
                      </button>
                    </div>
                    
                    {selectedViolationTab === 'violations' && (
                      <div className="max-h-64 overflow-y-auto">
                        {violations.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No violations</p>
                        ) : (
                          violations.map((v) => (
                            <div key={v.id} className="p-2 bg-red-50 rounded mb-2">
                              <p className="text-sm font-medium">{v.type}</p>
                              <p className="text-xs text-gray-600">{v.details}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(v.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {selectedViolationTab === 'snapshots' && (
                      <div className="max-h-64 overflow-y-auto">
                        {snapshots.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No snapshots</p>
                        ) : (
                          snapshots.map((s) => (
                            <div key={s.id} className="mb-2">
                              <img 
                                src={s.imageData} 
                                alt="Snapshot" 
                                className="w-full rounded"
                              />
                              <p className="text-xs text-gray-400">
                                {new Date(s.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select a student to view details
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}