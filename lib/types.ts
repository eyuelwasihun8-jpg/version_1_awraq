export type LessonType = 'video' | 'text' | 'quiz' | 'mixed';
export type CourseCategory = 'digital_marketing' | 'programming' | 'design' | 'business' | 'language' | 'other';
export type UserRole = 'student' | 'instructor' | 'sales' | 'admin' | 'super_admin';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cbe' | 'telebirr';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  gender: 'male' | 'female' | 'other' | null;
  age_group: '13-17' | '18-24' | '25-34' | '35-44' | '45+' | null;
  life_status: 'student' | 'worker' | 'business_owner' | 'freelancer' | 'other' | null;
  role: UserRole;
  is_active: boolean;
  onboarding_completed: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Instructor {
  full_name: string | null;
  avatar_url?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price: number;
  thumbnail_url: string;
  certificate_template_key?: string | null;
  is_published: boolean;
  instructor_id: string;
  instructor?: Instructor;
  duration_hours?: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  lesson_type: LessonType;
  video_key?: string;
  video_title?: string;
  video_description?: string;
  text_content?: string;
  quiz_data?: any;
  duration_seconds?: number;
  order_index: number;
  is_published: boolean;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  file_type?: string;
  price: number;
  thumbnail_url: string;
  file_key: string;
  file_size_bytes?: number;
  is_published: boolean;
  includes?: string[];
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  review_text: string;
  is_published: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  item_type: 'course' | 'digital_product';
  item_id: string;
  amount: number;
  payment_method: PaymentMethod;
  receipt_image_key: string;
  status: PaymentStatus;
  rejection_reason?: string;
  transaction_number?: string;
  created_at: string;
}