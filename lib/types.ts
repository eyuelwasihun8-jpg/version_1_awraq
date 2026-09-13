export type LessonType = 'video' | 'text' | 'quiz';
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
  slug: string;
  description: string;
  short_description?: string;
  category: CourseCategory;
  price: number;
  original_price?: number;
  thumbnail_url: string;
  preview_video_url?: string;
  duration_minutes: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  is_published: boolean;
  is_popular?: boolean;
  instructor_id: string;
  instructor?: Instructor;
  total_lessons?: number;
  average_rating?: number;
  total_reviews?: number;
  highlights?: string[];
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description?: string;
  lesson_type: LessonType;
  video_key?: string;
  content?: string;
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
  slug: string;
  description: string;
  short_description?: string;
  category: string;
  price: number;
  thumbnail_url: string;
  file_key: string;
  file_size_bytes?: number;
  is_published: boolean;
  includes?: string[];
  who_is_it_for?: string[];
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
  lessons?: { title: string };
  courses?: { title: string };
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  review_text: string;
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

export interface Resource {
  id: string;
  lesson_id: string;
  title: string;
  resource_type: 'pdf' | 'link' | 'file';
  file_key?: string;
  external_url?: string;
  download_url?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  student_name: string;
  certificate_code: string;
  issued_at: string;
  file_key: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar: string;
  highlightTag?: string;
}