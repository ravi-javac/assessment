import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceApi } from '@/services/attendanceApi';
import type { AttendanceSession } from '@/types/attendance';
import { QrCode, MapPin, Clock, CheckCircle, XCircle, Camera } from 'lucide-react';

export default function StudentAttendance() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [qrScanned, setQrScanned] = useState(false);

  useEffect(() => {
    loadActiveSessions();
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error('Location error:', err)
      );
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await attendanceApi.getActiveSessions();
      if (response.success) setSessions(response.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (sessionId: string) => {
    if (!location) {
      alert('Location access required');
      return;
    }

    try {
      await attendanceApi.markAttendance({
        sessionId,
        checkInMethod: sessionId,
        checkInLatitude: location.lat,
        checkInLongitude: location.lng,
        checkInDevice: navigator.userAgent,
      });
      alert('Attendance marked successfully!');
      setSelectedSession(null);
    } catch (error: any) {
      alert(error.message);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mark Attendance</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                      {session.requireQRCode && (
                        <span className="flex items-center gap-1">
                          <QrCode size={16} /> QR Code
                        </span>
                      )}
                      {session.requireGeoLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin size={16} /> Location
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {session.toleranceMinutes} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    className="btn btn-primary"
                  >
                    Mark
                  </button>
                </div>

                {selectedSession?.id === session.id && (
                  <div className="mt-4 pt-4 border-t">
                    {session.requireQRCode && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Camera size={18} /> Scan QR Code
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          Open your camera to scan the QR code displayed by your instructor
                        </p>
                      </div>
                    )}

                    {session.requireGeoLocation && location && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <MapPin size={18} /> Location
                        </h4>
                        <p className="text-sm text-gray-500">
                          Your location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleMarkAttendance(session.id)}
                      className="btn btn-primary w-full"
                    >
                      Confirm Attendance
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}