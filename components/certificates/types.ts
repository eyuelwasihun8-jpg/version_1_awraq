export type LessonType = 'video' | 'text' | 'quiz';

export interface CertificateData {
  studentName: string;
  courseName: string;
  instructorName: string;
  issueDate: string;
  certificateId: string;
  verificationUrl: string;
  organizationName: string;
  /** Signed R2 URL to the course-specific SVG template. Optional — falls back to default. */
  templateUrl?: string | null;
  logoUrl?: string;
  signatureUrl?: string;
  sealUrl?: string;
}

export interface CertificateRecord {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  student_name: string;
  course_name: string;
  instructor_name: string;
  issued_at: string;
  verification_url: string;
  pdf_path: string | null;
  created_at: string;
}