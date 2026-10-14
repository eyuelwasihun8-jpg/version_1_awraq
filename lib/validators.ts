/**
 * Centralized Zod validation schemas for all API endpoints.
 */

import { z } from 'zod';

// ============================================
// Common / Reusable Schemas
// ============================================

export const uuidSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?\d{9,15}$/, 'Invalid phone number').optional(),
  turnstileToken: z.string().optional(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  turnstileToken: z.string().optional(),
});

export const passwordResetConfirmSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  turnstileToken: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// Profile / Onboarding Schemas
// ============================================

export const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\d{9,15}$/, 'Invalid phone number'),
  gender: z.enum(['male', 'female', 'other']),
  ageGroup: z.enum(['13-17', '18-24', '25-34', '35-44', '45+']),
  lifeStatus: z.enum(['student', 'worker', 'business_owner', 'freelancer', 'other']),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?\d{9,15}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  ageGroup: z.enum(['13-17', '18-24', '25-34', '35-44', '45+']).optional().nullable(),
  lifeStatus: z.enum(['student', 'worker', 'business_owner', 'freelancer', 'other']).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

// ============================================
// Course Schemas
// ============================================

export const courseCategorySchema = z.enum([
  'digital_marketing',
  'programming',
  'design',
  'business',
  'language',
  'other',
]);

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional().nullable(),
  category: courseCategorySchema.default('other'),
  price: z.number().nonnegative('Price cannot be negative'),
  thumbnailUrl: z.string().url().optional().nullable(),
  certificateTemplateKey: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  instructorId: uuidSchema.optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseQuerySchema = paginationSchema.extend({
  category: courseCategorySchema.optional(),
  instructorId: uuidSchema.optional(),
  isPublished: z.coerce.boolean().optional(),
});

// ============================================
// Module / Lesson Schemas
// ============================================

export const lessonTypeSchema = z.enum(['video', 'text', 'quiz', 'mixed']);

export const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  orderIndex: z.number().int().nonnegative().default(0),
});

export const updateModuleSchema = createModuleSchema.partial();

export const reorderModulesSchema = z.object({
  moduleIds: z.array(uuidSchema).min(1),
});

export const createLessonSchema = z.object({
  moduleId: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(200),
  lessonType: lessonTypeSchema,
  videoKey: z.string().optional().nullable(),
  videoTitle: z.string().optional().nullable(),
  videoDescription: z.string().optional().nullable(),
  textContent: z.string().optional().nullable(),
  quizData: z.record(z.string(), z.any()).optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  orderIndex: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonsSchema = z.object({
  lessonIds: z.array(uuidSchema).min(1),
});

// ============================================
// Digital Product Schemas
// ============================================

export const fileTypeSchema = z.enum(['pdf', 'template', 'spreadsheet', 'other']);

export const createProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  fileType: fileTypeSchema.default('other'),
  price: z.number().nonnegative(),
  thumbnailUrl: z.string().url().optional().nullable(),
  fileKey: z.string().min(1, 'File is required'),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().default(false),
  includes: z.array(z.string()).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = paginationSchema.extend({
  fileType: fileTypeSchema.optional(),
  isPublished: z.coerce.boolean().optional(),
});

// ============================================
// Student / User Schemas
// ============================================

export const createStudentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?\d{9,15}$/).optional().nullable(),
  password: z.string().min(6).optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  ageGroup: z.enum(['13-17', '18-24', '25-34', '35-44', '45+']).optional().nullable(),
  lifeStatus: z.enum(['student', 'worker', 'business_owner', 'freelancer', 'other']).optional().nullable(),
  assignedTo: uuidSchema.optional().nullable(),
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?\d{9,15}$/).optional().nullable(),
  isActive: z.boolean().optional(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  ageGroup: z.enum(['13-17', '18-24', '25-34', '35-44', '45+']).optional().nullable(),
  lifeStatus: z.enum(['student', 'worker', 'business_owner', 'freelancer', 'other']).optional().nullable(),
  assignedTo: uuidSchema.optional().nullable(),
});

export const studentQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  courseId: uuidSchema.optional(),
  hasPurchases: z.enum(['all', 'yes', 'no']).default('all'),
  sort: z.enum(['newest', 'oldest', 'name', 'progress', 'activity']).default('newest'),
});

// ============================================
// Payment Schemas
// ============================================

export const paymentMethodSchema = z.enum(['cbe', 'telebirr']);
export const paymentStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const submitPaymentSchema = z.object({
  itemType: z.enum(['course', 'digital_product']),
  itemId: uuidSchema,
  paymentMethod: paymentMethodSchema,
  receiptImageKey: z.string().min(1, 'Receipt is required'),
});

export const approvePaymentSchema = z.object({
  paymentId: uuidSchema,
  transactionNumber: z.string().min(1, 'Transaction number is required'),
});

export const rejectPaymentSchema = z.object({
  paymentId: uuidSchema,
  rejectionReason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const paymentQuerySchema = paginationSchema.extend({
  status: paymentStatusSchema.optional(),
  itemType: z.enum(['course', 'digital_product']).optional(),
  userId: uuidSchema.optional(),
});

// ============================================
// Certificate Schemas
// ============================================

export const generateCertificateSchema = z.object({
  courseId: uuidSchema,
});

export const verifyCertificateSchema = z.object({
  code: z.string().regex(/^CERT-\d{4}-[A-Z0-9]+$/i, 'Invalid certificate format'),
});

// ============================================
// Testimonial Schemas
// ============================================

export const mediaTypeSchema = z.enum(['image', 'video']);

export const createTestimonialSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().max(100).default('Awraq Learner'),
  quote: z.string().max(2000).optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  mediaType: mediaTypeSchema.default('image'),
  mediaKey: z.string().optional().nullable(),
  posterKey: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export const testimonialQuerySchema = paginationSchema.extend({
  isPublished: z.coerce.boolean().optional(),
});

// ============================================
// Review Schemas
// ============================================

export const createReviewSchema = z.object({
  courseId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(10).max(2000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().min(10).max(2000).optional(),
});

export const reviewQuerySchema = paginationSchema.extend({
  courseId: uuidSchema.optional(),
  isPublished: z.coerce.boolean().optional(),
});

// ============================================
// Lead / Contact Schemas
// ============================================

export const submitLeadSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  businessType: z.string().max(50).optional().nullable(),
  topic: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  timeSlot: z.string().max(50).optional().nullable(),
  source: z.string().max(50).default('website'),
  turnstileToken: z.string().optional(),
});

// ============================================
// Upload Schemas
// ============================================

export const uploadQuerySchema = z.object({
  folder: z.string().max(100).default('uploads'),
  filename: z.string().max(255).optional(),
});

// ============================================
// Search Schemas
// ============================================

export const searchQuerySchema = z.object({
  q: z.string().max(200).optional().default(''),
  category: courseCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================
// Video / Download Schemas
// ============================================

export const videoQuerySchema = z.object({
  courseId: uuidSchema,
  lessonId: uuidSchema,
});

export const downloadQuerySchema = z.object({
  productId: uuidSchema,
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>;
export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type SubmitLeadInput = z.infer<typeof submitLeadSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;