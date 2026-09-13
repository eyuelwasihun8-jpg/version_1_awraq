<div align="center">

# 🎓 Awraq — Digital Learning Platform

**A modern, secure, and scalable course & digital product marketplace built for Ethiopia**

Master Digital Marketing • Programming • Design • Business

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth+DB-3ECF8E?style=flat-square&logo=supabase)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2%20Storage-F38020?style=flat-square&logo=cloudflare)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss)

</div>

---

## 📖 Table of Contents

1. [What Is Awraq?](#-what-is-awraq)
2. [Key Features](#-key-features)
3. [Tech Stack & Why](#-tech-stack--why)
4. [System Architecture](#-system-architecture)
5. [Database Schema](#-database-schema)
6. [Folder Structure](#-folder-structure)
7. [Authentication & Roles](#-authentication--roles)
8. [Payment Flow (CBE / Telebirr)](#-payment-flow-cbe--telebirr)
9. [Course Structure (Modular)](#-course-structure-modular)
10. [Video & File Upload System](#-video--file-upload-system)
11. [Progress Tracking & Certificates](#-progress-tracking--certificates)
12. [Admin Portal Security](#-admin-portal-security)
13. [Performance Optimizations](#-performance-optimizations)
14. [Setup & Installation](#-setup--installation)
15. [Environment Variables](#-environment-variables)
16. [Deployment Guide](#-deployment-guide)
17. [Troubleshooting](#-troubleshooting)

---

## 🌟 What Is Awraq?

**Awraq** is a full-featured online learning platform tailored for the Ethiopian market. Students can:

- 📚 **Browse courses** (Digital Marketing, Programming, Design, Business, Language)
- 🛒 **Purchase courses & digital products** using local payment methods (CBE Bank Transfer / Telebirr)
- 🎥 **Watch video lessons** with adaptive quality on any connection speed
- 📖 **Read text lessons** with rich formatting (TipTap editor)
- ✍️ **Take practice quizzes** with instant grading and explanations
- 📝 **Take notes** during lessons with auto-save
- 🏆 **Earn verifiable certificates** upon course completion (PDF with unique verification code)
- 📊 **Track their progress** across all courses in a dashboard
- 👤 **Manage their profile** with photo upload

Course creators (**instructors, admins**) can:

- 📼 Build multi-module courses with video, text, and quiz sections in a single lesson
- 🎨 Use rich text editing (TipTap) for text lessons
- 💰 Set pricing in Ethiopian Birr (ETB)
- 📎 Attach downloadable PDFs and external links to lessons
- 📊 View analytics and manage enrollments

Business staff can:

- ✅ **Approve or reject payment receipts** with mandatory transaction numbers
- 👥 Manage users and staff accounts
- 📥 Export leads as CSV for marketing
- 🔍 View complete audit logs (every action tracked)

---

## ⭐ Key Features

### For Students
- ✅ Email/password authentication with password reset
- ✅ Google OAuth (optional)
- ✅ Onboarding flow (name, phone, gender, age, life status)
- ✅ Browse & search courses by category
- ✅ Public course preview with reviews, ratings, testimonials, student count
- ✅ CBE + Telebirr payment support with real-time approval detection
- ✅ Auto-compressed receipt uploads (95% smaller files)
- ✅ Real-time payment status via WebSockets
- ✅ Multi-content lessons (Video + Text + Quiz in one lesson)
- ✅ Video player with speed controls (0.75x - 2x), keyboard shortcuts, buffering
- ✅ Automatic 90% completion tracking for videos
- ✅ Scroll + time tracking for text lessons
- ✅ Notes with auto-save (per-lesson)
- ✅ Downloadable lesson resources
- ✅ Auto-generated PDF certificates with student name
- ✅ Public certificate verification page (`/verify/[code]`)
- ✅ Star ratings + text reviews after course completion
- ✅ Mobile bottom navigation
- ✅ Profile photo upload

### For Instructors / Admins
- ✅ Secret admin URL (`/staff-portal-x7k9m`) for security
- ✅ Separate staff login page
- ✅ Modular course builder (Modules → Lessons)
- ✅ 3 lesson types in ONE lesson: Video, Text, Quiz (mix any combination)
- ✅ TipTap rich text editor
- ✅ Quiz builder with 3 question types (Multiple Choice, True/False, Multi-Select)
- ✅ Answer explanations shown to students after submission
- ✅ Video auto-duration detection
- ✅ Drag & drop reordering (modules and lessons)
- ✅ Per-lesson resources (PDFs, links)
- ✅ Digital products management (PDFs, templates)
- ✅ Full-screen lesson editor
- ✅ Payment review with transaction number requirement
- ✅ CSV export of leads
- ✅ Complete audit log

### For Super Admin
- ✅ Create staff accounts (Admin, Sales, Instructor) directly
- ✅ Toggle user active/inactive
- ✅ Change user roles
- ✅ View audit trail of every action

---

## 🧰 Tech Stack & Why

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side rendering for SEO, built-in API routes, server components for fast dashboards |
| **Language** | TypeScript 5 | Type safety, better developer experience, fewer bugs |
| **UI** | Tailwind CSS 4 | Fast styling, consistent design system, small bundle |
| **Database** | Supabase Postgres | Realtime subscriptions, Row-Level Security, generous free tier (500MB) |
| **Auth** | Supabase Auth | Email/password + Google OAuth, JWT tokens, secure cookies |
| **File Storage** | Cloudflare R2 | **Unlimited egress bandwidth**, S3-compatible, extremely cheap |
| **Rich Text Editor** | TipTap | Modern, headless, extensible, matches our design |
| **PDF Generation** | pdf-lib | Server-side certificate PDF generation with custom fonts |
| **Icons** | Lucide React | Clean, consistent, tree-shakeable |
| **Notifications** | Sonner | Beautiful toast notifications |
| **Forms** | react-hook-form + Zod | Type-safe validation, minimal re-renders |
| **Hosting** | Vercel (recommended) | Free tier includes edge functions, custom domains, auto-deploys from Git |

---

## 🏗️ System Architecture
                    │      🌐 USERS          │
                    │  (Students / Admins)   │
                    └───────────┬────────────┘
                                │ HTTPS
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│ 🚀 VERCEL (Next.js App) │
│ │
│ ┌───────────────┐ ┌────────────────┐ ┌──────────────────────┐ │
│ │ Public Pages │ │ Student Pages │ │ Staff Portal │ │
│ │ (SSR + SEO) │ │ (Protected) │ │ (Secret URL slug) │ │
│ │ /courses │ │ /dashboard │ │ /staff-portal-x7k9m │ │
│ │ /products │ │ /learn/[id] │ │ │ │
│ │ /verify/[c] │ │ /profile │ │ │ │
│ └───────────────┘ └────────────────┘ └──────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 🔐 Middleware (Auth + Role Guard) │ │
│ │ • Protects /dashboard, /learn (student auth) │ │
│ │ • Protects /staff-portal-* (staff role check) │ │
│ │ • Blocks legacy /admin URLs (404) │ │
│ └────────────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 🔌 API Routes (Serverless) │ │
│ │ /api/onboarding /api/payment/* /api/quiz/submit │ │
│ │ /api/video /api/notes/* /api/certificate/* │ │
│ │ /api/progress /api/reviews /api/admin/* │ │
│ │ /api/thumbnail /api/profile ... (24+ routes) │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────┘
│
┌────────────────────┼────────────────────┐
│ │ │
▼ ▼ ▼
┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│ 💾 SUPABASE │ │ 📁 CLOUDFLARE R2 │ │ 🔔 SUPABASE │
│ Postgres DB │ │ Object Storage │ │ Realtime │
│ │ │ │ │ │
│ • profiles │ │ • Videos │ │ • Payment approval │
│ • courses │ │ • Course PDFs │ │ push notifications │
│ • modules │ │ • Digital │ │ • Live updates │
│ • lessons │ │ products │ │ │
│ • enrollments │ │ • Receipts │ │ │
│ • payments │ │ • Certificates │ │ │
│ • progress │ │ • Avatars │ │ │
│ • notes │ │ • Thumbnails │ │ │
│ • certificates │ │ │ │ │
│ • quiz_attempts │ │ ⚡ Unlimited │ │ │
│ • audit_logs │ │ egress │ │ │
│ • reviews │ │ (FREE!) │ │ │
│ │ │ │ │ │
│ 🔒 RLS enforced │ │ 🔒 Private + │ │ │
│ on every │ │ signed URLs │ │ │
│ table │ │ (10-min TTL) │ │ │
└──────────────────┘ └──────────────────┘ └─────────────────────┘

### How It Works Step-by-Step

1. **User visits a public page** (e.g., `/courses`)
   - Next.js renders HTML on the server (SEO-friendly)
   - Supabase queries pull published courses
   - Cloudflare R2 provides thumbnail images via signed URLs (cached in browser)

2. **Student clicks a course to purchase**
   - Redirects to `/purchase/item/course/[id]`
   - Student sees CBE + Telebirr account details
   - Student uploads receipt screenshot → **compressed client-side from 8MB to 150KB**
   - Receipt is uploaded directly from browser to Cloudflare R2 (never touches Vercel)
   - Payment request row created in Supabase with `status: pending`

3. **Admin approves payment**
   - Admin sees receipt in `/staff-portal-x7k9m/payments`
   - Enters transaction number (validated by database CHECK constraint)
   - Clicks Approve → Supabase trigger auto-creates `enrollments` row
   - Audit log entry created

4. **Student is notified in real-time**
   - Waiting page uses Supabase Realtime WebSocket
   - Student's browser receives approval in **< 100ms**
   - Auto-redirects to `/learn/[courseId]`

5. **Student watches lesson**
   - Video is streamed from R2 via 10-min signed URL
   - URL auto-refreshes every 9 minutes
   - Progress tracked every 15 seconds (`watch_seconds`)
   - Database trigger marks lesson complete at 90%

6. **Certificate generation**
   - Student completes all lessons → clicks "Get Certificate"
   - Student enters full name
   - `pdf-lib` generates PDF server-side, uploads to R2
   - Unique verification code (e.g., `CERT-2025-ABC123`) stored in database
   - PDF downloads immediately

---

## 🗄️ Database Schema

Awraq uses **14 core tables** with Row-Level Security (RLS) enforced on every table.

### Users & Auth
| Table | Purpose |
|---|---|
| `auth.users` (Supabase managed) | Authentication credentials |
| `profiles` | Public user info: name, phone, role, avatar, onboarding data |

### Courses & Content
| Table | Purpose |
|---|---|
| `courses` | Course metadata (title, price, thumbnail, category, is_published) |
| `course_modules` | Section grouping (e.g., "Module 1: Introduction") |
| `lessons` | Individual lessons (video_key, text_content, quiz_data — can have all 3!) |
| `lesson_resources` | Downloadable files & links per lesson |
| `digital_products` | Standalone PDF/template products |

### Payments & Enrollment
| Table | Purpose |
|---|---|
| `payment_requests` | Receipt submissions (pending / approved / rejected) |
| `enrollments` | Approved course access (auto-created via trigger) |
| `purchases` | Approved digital product access |

### Learning Data
| Table | Purpose |
|---|---|
| `lesson_progress` | Watch time, scroll %, completion |
| `lesson_notes` | Student notes per lesson |
| `lesson_quiz_attempts` | Quiz submission history with scores |
| `certificates` | Issued certificates with unique codes |
| `reviews` | Star rating + review text per course |

### Admin & Security
| Table | Purpose |
|---|---|
| `audit_logs` | Every admin action tracked (who, what, when, before/after) |

### Key Database Triggers
- **`on_auth_user_created`** → Auto-creates `profiles` row on signup
- **`on_payment_status_change`** → When payment approved, auto-creates `enrollments` and logs to audit
- **`check_lesson_completion`** → Auto-marks lessons complete based on video/text/quiz progress
- **`handle_new_user`** → Sets default role, is_active, onboarding status

---

## 📁 Folder Structure
awraq/
├── app/ # Next.js App Router
│ ├── layout.tsx # Root layout with top loader
│ ├── page.tsx # Home page
│ ├── loading.tsx # Global loading UI
│ ├── globals.css # Tailwind + design tokens
│ │
│ ├── (auth)/ # Auth pages (grouped)
│ │ ├── login/page.tsx
│ │ ├── signup/page.tsx
│ │ ├── forgot-password/page.tsx
│ │ └── reset-password/page.tsx
│ │
│ ├── (protected)/ # Requires student auth
│ │ ├── layout.tsx # Auth guard + onboarding gate
│ │ ├── dashboard/page.tsx
│ │ ├── profile/page.tsx
│ │ ├── learn/
│ │ │ └── [id]/
│ │ │ ├── page.tsx # Course overview
│ │ │ └── [lessonId]/page.tsx # Lesson player
│ │ ├── purchase/
│ │ │ ├── item/[type]/[id]/page.tsx
│ │ │ └── waiting/[id]/page.tsx
│ │ └── certificate/[id]/page.tsx
│ │
│ ├── onboarding/page.tsx # 3-step onboarding form
│ │
│ ├── courses/ # Public course browsing
│ │ ├── page.tsx
│ │ └── [id]/page.tsx
│ │
│ ├── verify/[code]/page.tsx # Public cert verification
│ │
│ ├── staff-login-x7k9m/page.tsx # Secret staff login
│ │
│ ├── staff-portal-x7k9m/ # Secret admin portal
│ │ ├── layout.tsx # Role guard
│ │ ├── page.tsx # Overview
│ │ ├── payments/page.tsx
│ │ ├── users/
│ │ │ ├── page.tsx
│ │ │ ├── new/page.tsx
│ │ │ └── [id]/page.tsx
│ │ ├── courses/
│ │ │ ├── page.tsx
│ │ │ ├── new/page.tsx
│ │ │ └── [id]/
│ │ │ ├── page.tsx
│ │ │ └── lessons/[lessonId]/page.tsx # Full-screen editor
│ │ ├── products/
│ │ ├── leads/page.tsx
│ │ └── audit/page.tsx
│ │
│ ├── auth/callback/route.ts # OAuth callback
│ │
│ └── api/ # Serverless API routes
│ ├── onboarding/route.ts
│ ├── search/route.ts
│ ├── thumbnail/route.ts # Batched image URL signer
│ ├── video/route.ts # Video streaming URLs
│ ├── download/route.ts
│ ├── resources/route.ts
│ ├── reviews/route.ts
│ ├── progress/
│ │ ├── route.ts
│ │ └── course/route.ts
│ ├── notes/
│ │ ├── route.ts
│ │ └── [id]/route.ts
│ ├── certificate/
│ │ ├── check/route.ts
│ │ ├── generate/route.ts
│ │ ├── download/route.ts
│ │ └── verify/[code]/route.ts
│ ├── quiz/submit/route.ts
│ ├── payment/
│ │ ├── upload-url/route.ts
│ │ └── submit/route.ts
│ ├── profile/
│ │ ├── route.ts
│ │ └── avatar-upload/route.ts
│ └── admin/
│ ├── upload/route.ts
│ ├── upload-url/route.ts
│ ├── audit/route.ts
│ ├── leads/export/route.ts
│ ├── payments/
│ │ ├── route.ts
│ │ ├── approve/route.ts
│ │ └── reject/route.ts
│ ├── users/
│ │ ├── route.ts
│ │ └── [id]/route.ts
│ ├── courses/
│ │ ├── route.ts
│ │ └── [id]/route.ts
│ ├── modules/
│ │ ├── route.ts
│ │ ├── [id]/route.ts
│ │ └── reorder/route.ts
│ ├── lessons/
│ │ ├── route.ts
│ │ ├── [id]/route.ts
│ │ └── reorder/route.ts
│ ├── resources/
│ ├── products/
│ └── staff/create/route.ts
│
├── components/
│ ├── admin/ # Staff portal UI
│ │ ├── AdminSidebar.tsx
│ │ ├── AdminHeader.tsx
│ │ ├── StatCard.tsx
│ │ ├── PaymentsClient.tsx
│ │ ├── UsersClient.tsx
│ │ ├── UserEditClient.tsx
│ │ ├── NewStaffClient.tsx
│ │ ├── CoursesClient.tsx
│ │ ├── CourseFormClient.tsx
│ │ ├── ModulesBuilder.tsx # Curriculum builder
│ │ ├── ModuleCard.tsx
│ │ ├── LessonEditorClient.tsx # Full-screen editor
│ │ ├── LessonVideoEditor.tsx
│ │ ├── LessonTextEditor.tsx
│ │ ├── LessonQuizEditor.tsx
│ │ ├── QuizBuilder.tsx
│ │ ├── RichTextEditor.tsx # TipTap
│ │ ├── ResourcesManager.tsx
│ │ ├── ProductsClient.tsx
│ │ ├── ProductFormClient.tsx
│ │ ├── LeadsClient.tsx
│ │ ├── AuditClient.tsx
│ │ └── CourseThumbnail.tsx # Cached signed URL loader
│ │
│ ├── courses/ # Public course pages
│ │ ├── CoursesListClient.tsx
│ │ └── CourseDetailClient.tsx
│ │
│ ├── dashboard/ # Student dashboard tabs
│ │ ├── DashboardClient.tsx
│ │ ├── CoursesTab.tsx
│ │ ├── ResourcesTab.tsx
│ │ ├── NotesTab.tsx
│ │ ├── CertificatesTab.tsx
│ │ └── HistoryTab.tsx
│ │
│ ├── learn/ # Learning experience
│ │ ├── CourseOverviewClient.tsx
│ │ ├── LessonClient.tsx
│ │ ├── LessonSidebar.tsx
│ │ ├── VideoPlayer.tsx # Custom player with speed controls
│ │ ├── TextReader.tsx
│ │ └── QuizPlayer.tsx
│ │
│ ├── purchase/
│ │ ├── PurchaseClient.tsx # With image compression
│ │ └── WaitingClient.tsx # Realtime WebSocket
│ │
│ ├── profile/
│ │ └── ProfileClient.tsx
│ │
│ ├── certificate/
│ │ ├── CertificateClient.tsx
│ │ └── VerifyClient.tsx
│ │
│ ├── home/ # Homepage sections
│ │ ├── HomePageClient.tsx
│ │ ├── HeroSection.tsx
│ │ ├── CoursesSection.tsx
│ │ └── ... (other sections)
│ │
│ ├── Navbar.tsx
│ ├── Footer.tsx
│ ├── MobileBottomNav.tsx
│ ├── SignInModal.tsx
│ ├── ConsultationModal.tsx
│ ├── RootLayoutClient.tsx
│ ├── BrandLogo.tsx
│ └── UserAvatar.tsx # Cached avatar loader
│
├── lib/
│ ├── supabase-browser.ts # Client Supabase instance
│ ├── supabase-server.ts # Server component Supabase
│ ├── supabase-admin.ts # Service role (server only)
│ ├── r2.ts # Cloudflare R2 S3 client
│ ├── compressImage.ts # Client-side image compression
│ ├── thumbnailCache.ts # Batched URL cache
│ └── hooks/
│ └── useUser.ts
│
├── middleware.ts # Global auth + role checks
├── .env.local # Environment variables (NEVER commit!)
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md 
#this is

---

## 🔐 Authentication & Roles

### Roles
| Role | Permissions |
|---|---|
| **super_admin** | Full access + can create/delete staff, view audit logs |
| **admin** | Manage payments, courses, users (except role changes) |
| **sales** | Approve/reject payments only |
| **instructor** | Create and edit own courses |
| **student** | Default role — access purchased courses |

### Authentication Flow

1. **Signup** → Supabase creates `auth.users` row → trigger creates `profiles` row with `role: student`
2. **Login** → Supabase issues JWT cookie → middleware validates on every request
3. **Onboarding** → Unskippable form after first signup (name, phone, gender, age, life status)
4. **Staff Login** → Separate URL (`/staff-login-x7k9m`) → validates role → routes to portal

### Row-Level Security (RLS)

Every table has RLS enforced. Examples:
- Students can only see **their own** notes, progress, certificates
- Only enrolled students can see lesson content
- Only staff can access admin tables
- Only super_admin can view audit_logs

---

## 💰 Payment Flow (CBE / Telebirr)

Awraq uses **manual verification** — perfect for Ethiopia where Stripe/PayPal don't work.
Student clicks "Purchase" on course detail page
Redirects to /purchase/item/course/[id]
Sees CBE + Telebirr account numbers (with copy buttons)
Student sends money via bank/mobile
Student takes screenshot of confirmation
Uploads screenshot (auto-compressed 95% smaller)
Screenshot uploads directly browser → R2
Payment request row created (status: pending)
Student redirected to /purchase/waiting/[id]
Waiting page opens Supabase Realtime WebSocket
── Meanwhile, admin side ──

Admin/Sales opens /staff-portal-x7k9m/payments
Sees pending payment with receipt image
Verifies transaction in their bank app
Enters transaction number (REQUIRED by DB constraint)
Clicks Approve
── Real-time magic ──

Database trigger auto-creates enrollments row
Trigger writes to audit_logs
Supabase Realtime pushes UPDATE event to student browser
Student's waiting page redirects to /learn/[courseId] in ~100ms


### Security Guarantees
- ✅ Transaction number **cannot be empty** (database CHECK constraint)
- ✅ Rejection reason **cannot be empty** (database CHECK constraint)
- ✅ Every approval/rejection logged with actor, timestamp, IP
- ✅ Students can't manipulate their own enrollment (RLS)

---

## 📚 Course Structure (Modular)

Awraq uses a **3-level hierarchy** just like Udemy/Coursera:
Course
└── Module 1 (e.g., "Strategy & Finding Your Audience")
├── Lesson 1.1 (Video + Text + Quiz all in one!)
├── Lesson 1.2 (Video only)
└── Lesson 1.3 (Quiz only)
└── Module 2 (e.g., "Advanced Techniques")
├── Lesson 2.1
└── Lesson 2.2


### Multi-Content Lessons

One lesson can contain **ANY combination** of:
- 🎥 **Video** (Cloudflare R2 hosted)
- 📄 **Rich text** (TipTap editor with formatting)
- ❓ **Quiz** (Multiple choice, True/False, Multi-select)

Students see all three stacked on the learning page. Completion requires:
- Video: 90% watched
- Text: 90% scrolled + 60 seconds spent
- Quiz: Optional (no impact on completion)

---

## 🎥 Video & File Upload System

### Video Upload Pipeline
Instructor selects video file
↓
Frontend requests signed upload URL from /api/admin/upload-url
↓
Direct browser-to-R2 upload (bypasses Vercel!)
↓
Progress bar shows real-time upload %
↓
JavaScript auto-detects video duration from metadata
↓
Instructor clicks "Save Video Section"
↓
Video key + duration saved to lessons.video_key

### Why Direct Upload?
- **Bypasses Vercel's 4.5MB request limit**
- **No server bandwidth used**
- **Faster for large files**
- **Progress tracking works**

### Recommended Video Format (Before Upload)
Use **HandBrake** with:
- Codec: H.264
- Bitrate: 1000 kbps (1 Mbps) — perfect for 3G!
- Resolution: 1280x720
- ✅ Check "Web Optimized" (crucial for instant playback)
- Audio: AAC 96 kbps

Result: **A 10-minute lesson = ~30MB** (uploads in 5 seconds, plays smoothly on 3G).

### File Storage Buckets (Cloudflare R2)
| Bucket | Contents | Access |
|---|---|---|
| `course-content` | Videos, thumbnails, PDFs, avatars | Private + signed URLs |
| `receipts` | Payment receipt screenshots | Private + signed URLs |
| `certificates` | Generated PDF certificates | Private + signed URLs |

### Optional Public Bucket for Speed
For instant thumbnail loading (10ms vs 500ms), you can enable public access on `course-content`:
1. R2 → Bucket → Settings → **Allow r2.dev access**
2. Add public URL to `.env.local`:

---

## 📊 Progress Tracking & Certificates

### Auto-Completion Logic (in `check_lesson_completion` trigger)

```sql
IF lesson has video:
→ Complete when watch_seconds ≥ 90% of duration

IF lesson has text:
→ Complete when scroll_percentage ≥ 90% AND time_on_page ≥ 60s

IF lesson has quiz:
→ Quiz doesn't affect completion (optional)

Anti-Cheat Measures
✅ watch_seconds uses Math.max() — can never decrease
✅ Forward-only playback tracking (skipping ahead doesn't count)
✅ Progress saved every 15 seconds while watching
✅ Server validates enrollment on every progress update
Certificate Generation Flow
Student completes 100% of lessons
Clicks "Get Certificate" button
Enters full name (validated, minimum 3 characters)
API generates PDF using pdf-lib:
Loads course-specific template (if uploaded by admin) OR default template
Overlays student name in center
Adds date + unique verification code (e.g., CERT-2025-ABC12345)
PDF uploaded to R2
Row saved to certificates table
PDF opens in new tab for download
Public Certificate Verification
Anyone can visit /verify/CERT-2025-ABC12345 to confirm:

Student name
Course name
Issue date
Verification status
Perfect for LinkedIn / employer verification.
🔒 Admin Portal Security
Awraq uses defense in depth for the admin area:

Layer 1: Secret URL
Admin portal lives at /staff-portal-x7k9m (unguessable slug)
Login page at /staff-login-x7k9m (separate URL)
Legacy /admin URL returns 404 (never reveals admin exists)
Layer 2: Middleware Guard
Every request to /staff-portal-* is checked:

Is user logged in? → If no, redirect to staff login
Is user's is_active = true? → If no, return 404
Is user's role in [super_admin, admin, sales, instructor]? → If no, return 404
Layer 3: Row-Level Security
Even if a student somehow reaches an admin endpoint, RLS blocks them from reading/writing admin tables.

Layer 4: Audit Logging
Every payment approval, role change, user toggle, and staff creation is logged with:

Actor ID and role at time of action
Target (payment/user/course)
Before/after values
Timestamp
IP address (optional)
Layer 5: DB Constraints
Can't approve payment without transaction number
Can't reject payment without reason
Can't have two active certificates for same course
⚡ Performance Optimizations
Awraq is heavily optimized. Here's what makes it fast:

1. Thumbnail Caching System
All thumbnail URLs cached in memory + sessionStorage for 55 minutes
Batch API requests multiple thumbnails in one call
Same thumbnail on 5 pages = only 1 API call
2. Client-Side Image Compression
Receipt uploads compressed from 8MB → 150KB (95% smaller)
Uses HTML5 Canvas + JPEG quality 0.7 at 1200px max width
Upload time: 12 seconds → 0.3 seconds
3. Supabase Realtime for Payment Approval
WebSocket connection detects approval in < 100ms
No 20-second polling delay
Backup poll every 8 seconds if WebSocket fails
4. Parallel Database Queries (Promise.all)
All server pages use Promise.all to run queries in parallel
Dashboard: 5 queries in 300ms instead of 1500ms
5. Direct-to-R2 Uploads
Videos and receipts bypass Vercel entirely
No serverless function bandwidth used
Faster for large files
6. Signed URL Refresh
Video URLs auto-refresh every 8 minutes (before 10-min expiry)
Playback never interrupted during long videos
7. Video Player Optimizations
Preload metadata for instant seeking
HTML Range requests for chunk streaming
Custom controls with speed adjustment (0.75x - 2x)
Keyboard shortcuts (Space, Arrow keys)
8. Next.js Top Loader
Instant visual feedback on every navigation
Cyan progress bar at top of screen
9. Loading Skeletons
Global loading.tsx shows spinner while server components fetch data
No blank screens
10. Force Dynamic Rendering (Where Needed)
Course listings use export const dynamic = 'force-dynamic' for fresh data
Static pages use ISR for CDN caching
🚀 Setup & Installation
Prerequisites
Node.js 20+
npm or yarn
Supabase account (free tier)
Cloudflare account (free tier for R2)
Git