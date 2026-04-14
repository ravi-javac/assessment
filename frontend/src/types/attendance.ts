export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: string;
  title: string;
  courseId?: string;
  institutionId?: string;
  createdById?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  toleranceMinutes: number;
  requireQRCode: boolean;
  qrCodeExpiry?: string;
  qrCodeSecret?: string;
  requireGeoLocation: boolean;
  geoLatitude?: number;
  geoLongitude?: number;
  geoRadius?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  totalExpected: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkInMethod?: string;
  checkInIP?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDevice?: string;
  isManual: boolean;
  markedById?: string;
  remarks?: string;
  createdAt: string;
}

export interface AttendanceReport {
  session: AttendanceSession;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  records: AttendanceRecord[];
}