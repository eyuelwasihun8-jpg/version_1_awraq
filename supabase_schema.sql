-- ==================== TABLES ====================

CREATE TABLE IF NOT EXISTS public.audit_logs (id uuid NOT NULL DEFAULT gen_random_uuid(), actor_id uuid, created_at timestamp with time zone DEFAULT now(), details jsonb, target_id uuid, actor_role text, ip_address text, target_type text, action text NOT NULL);

CREATE TABLE IF NOT EXISTS public.certificates (course_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), certificate_code text, certificate_url text, student_name text NOT NULL, issued_at timestamp with time zone DEFAULT now(), user_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS public.course_modules (id uuid NOT NULL DEFAULT gen_random_uuid(), course_id uuid NOT NULL, order_index integer NOT NULL DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), title text NOT NULL, description text);

CREATE TABLE IF NOT EXISTS public.courses (updated_at timestamp with time zone DEFAULT now(), instructor_id uuid, id uuid NOT NULL DEFAULT gen_random_uuid(), price numeric NOT NULL DEFAULT 0, is_published boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), title text NOT NULL, description text, category text, thumbnail_url text, certificate_template_key text);

CREATE TABLE IF NOT EXISTS public.digital_products (title text NOT NULL, created_at timestamp with time zone DEFAULT now(), is_published boolean DEFAULT false, price numeric NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), thumbnail_url text, file_type text, file_key text NOT NULL, description text);

CREATE TABLE IF NOT EXISTS public.enrollments (enrollment_source text DEFAULT 'purchase'::text, revoked_at timestamp with time zone, notes text, revoke_reason text, is_active boolean DEFAULT true, enrolled_by uuid, enrolled_at timestamp with time zone DEFAULT now(), payment_request_id uuid, course_id uuid NOT NULL, user_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), revoked_by uuid);

CREATE TABLE IF NOT EXISTS public.lesson_notes (content text NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), updated_at timestamp with time zone DEFAULT now(), created_at timestamp with time zone DEFAULT now(), course_id uuid NOT NULL, lesson_id uuid NOT NULL, user_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS public.lesson_progress (updated_at timestamp with time zone DEFAULT now(), completed_at timestamp with time zone, watch_seconds integer DEFAULT 0, is_completed boolean DEFAULT false, id uuid NOT NULL DEFAULT gen_random_uuid(), time_on_page_seconds integer DEFAULT 0, scroll_percentage integer DEFAULT 0, lesson_id uuid NOT NULL, user_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS public.lesson_quiz_attempts (attempted_at timestamp with time zone DEFAULT now(), answers jsonb NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, score integer NOT NULL, passed boolean DEFAULT false, lesson_id uuid NOT NULL);

CREATE TABLE IF NOT EXISTS public.lesson_resources (created_at timestamp with time zone DEFAULT now(), id uuid NOT NULL DEFAULT gen_random_uuid(), lesson_id uuid NOT NULL, external_url text, resource_type text NOT NULL, title text NOT NULL, file_key text);

CREATE TABLE IF NOT EXISTS public.lessons (id uuid NOT NULL DEFAULT gen_random_uuid(), title text NOT NULL, course_id uuid NOT NULL, order_index integer NOT NULL, duration_seconds integer, created_at timestamp with time zone DEFAULT now(), module_id uuid, quiz_data jsonb, is_published boolean DEFAULT true, lesson_type text NOT NULL, video_key text, text_content text, video_title text, video_description text);

CREATE TABLE IF NOT EXISTS public.payment_requests (transaction_number text, receipt_image_key text, item_id uuid NOT NULL, amount numeric NOT NULL, created_at timestamp with time zone DEFAULT now(), payment_method text NOT NULL, item_type text NOT NULL, user_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), reviewed_by uuid, reviewed_at timestamp with time zone, rejection_reason text, status text DEFAULT 'pending'::text);

CREATE TABLE IF NOT EXISTS public.profiles (age_group text, role text DEFAULT 'student'::text, updated_at timestamp with time zone DEFAULT now(), avatar_url text, created_at timestamp with time zone DEFAULT now(), onboarding_completed boolean DEFAULT false, is_active boolean DEFAULT true, id uuid NOT NULL, assigned_to uuid, full_name text, phone text, gender text, life_status text);

CREATE TABLE IF NOT EXISTS public.purchases (revoked_by uuid, revoke_reason text, purchased_at timestamp with time zone DEFAULT now(), payment_request_id uuid, product_id uuid NOT NULL, enrollment_source text DEFAULT 'purchase'::text, notes text, user_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), enrolled_by uuid, is_active boolean DEFAULT true, revoked_at timestamp with time zone);

CREATE TABLE IF NOT EXISTS public.reviews (rating integer NOT NULL, published_by uuid, published_at timestamp with time zone, is_published boolean NOT NULL DEFAULT false, created_at timestamp with time zone DEFAULT now(), course_id uuid NOT NULL, user_id uuid NOT NULL, id uuid NOT NULL DEFAULT gen_random_uuid(), review_text text);

CREATE TABLE IF NOT EXISTS public.student_progress_summary (enrollment_active boolean, enrollment_source text, enrolled_at timestamp with time zone, course_id uuid, total_lessons bigint, completed_lessons bigint, progress_percent numeric, user_id uuid, course_thumbnail text, course_title text, instructor_id uuid, enrolled_by uuid);

CREATE TABLE IF NOT EXISTS public.testimonials (media_type text NOT NULL DEFAULT 'image'::text, quote text, rating integer NOT NULL DEFAULT 5, media_key text, is_published boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, poster_key text, name text NOT NULL, updated_at timestamp with time zone NOT NULL DEFAULT now(), created_at timestamp with time zone NOT NULL DEFAULT now(), role text NOT NULL DEFAULT 'Awraq Learner'::text, id uuid NOT NULL DEFAULT gen_random_uuid());

-- ==================== CONSTRAINTS ====================

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id);

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.certificates ADD CONSTRAINT certificates_certificate_code_key UNIQUE (certificate_code);

ALTER TABLE public.certificates ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.certificates ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);

ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_id_course_id_key UNIQUE (user_id, course_id);

ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.payment_requests ADD CONSTRAINT chk_rejection_reason CHECK (((status <> 'rejected'::text) OR (rejection_reason IS NOT NULL)));

ALTER TABLE public.payment_requests ADD CONSTRAINT chk_transaction_required CHECK (((status <> 'approved'::text) OR (transaction_number IS NOT NULL)));

ALTER TABLE public.course_modules ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_modules ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);

ALTER TABLE public.courses ADD CONSTRAINT courses_category_check CHECK ((category = ANY (ARRAY['digital_marketing'::text, 'programming'::text, 'design'::text, 'business'::text, 'language'::text, 'other'::text])));

ALTER TABLE public.courses ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.courses ADD CONSTRAINT courses_pkey PRIMARY KEY (id);

ALTER TABLE public.digital_products ADD CONSTRAINT digital_products_file_type_check CHECK ((file_type = ANY (ARRAY['pdf'::text, 'template'::text, 'spreadsheet'::text, 'other'::text])));

ALTER TABLE public.digital_products ADD CONSTRAINT digital_products_pkey PRIMARY KEY (id);

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_enrollment_source_check CHECK ((enrollment_source = ANY (ARRAY['purchase'::text, 'manual'::text, 'gift'::text, 'promotion'::text])));

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id);

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id);

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_notes ADD CONSTRAINT lesson_notes_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_notes ADD CONSTRAINT lesson_notes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_notes ADD CONSTRAINT lesson_notes_pkey PRIMARY KEY (id);

ALTER TABLE public.lesson_notes ADD CONSTRAINT lesson_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);

ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);

ALTER TABLE public.lesson_quiz_attempts ADD CONSTRAINT lesson_quiz_attempts_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_quiz_attempts ADD CONSTRAINT lesson_quiz_attempts_pkey PRIMARY KEY (id);

ALTER TABLE public.lesson_quiz_attempts ADD CONSTRAINT lesson_quiz_attempts_score_check CHECK (((score >= 0) AND (score <= 100)));

ALTER TABLE public.lesson_quiz_attempts ADD CONSTRAINT lesson_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_resources ADD CONSTRAINT lesson_resources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_resources ADD CONSTRAINT lesson_resources_pkey PRIMARY KEY (id);

ALTER TABLE public.lesson_resources ADD CONSTRAINT lesson_resources_resource_type_check CHECK ((resource_type = ANY (ARRAY['pdf'::text, 'link'::text, 'file'::text])));

ALTER TABLE public.lessons ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.lessons ADD CONSTRAINT lessons_lesson_type_check CHECK ((lesson_type = ANY (ARRAY['video'::text, 'text'::text, 'quiz'::text, 'mixed'::text])));

ALTER TABLE public.lessons ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;

ALTER TABLE public.lessons ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_item_type_check CHECK ((item_type = ANY (ARRAY['course'::text, 'digital_product'::text])));

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_payment_method_check CHECK ((payment_method = ANY (ARRAY['cbe'::text, 'telebirr'::text])));

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_pkey PRIMARY KEY (id);

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id);

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_group_check CHECK ((age_group = ANY (ARRAY['13-17'::text, '18-24'::text, '25-34'::text, '35-44'::text, '45+'::text])));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_life_status_check CHECK ((life_status = ANY (ARRAY['student'::text, 'worker'::text, 'business_owner'::text, 'freelancer'::text, 'other'::text])));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text, 'student'::text])));

ALTER TABLE public.purchases ADD CONSTRAINT purchases_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.purchases ADD CONSTRAINT purchases_enrollment_source_check CHECK ((enrollment_source = ANY (ARRAY['purchase'::text, 'manual'::text, 'gift'::text, 'promotion'::text])));

ALTER TABLE public.purchases ADD CONSTRAINT purchases_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id);

ALTER TABLE public.purchases ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);

ALTER TABLE public.purchases ADD CONSTRAINT purchases_product_id_fkey FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE;

ALTER TABLE public.purchases ADD CONSTRAINT purchases_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_product_id_key UNIQUE (user_id, product_id);

ALTER TABLE public.reviews ADD CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE public.reviews ADD CONSTRAINT reviews_published_by_fkey FOREIGN KEY (published_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_course_id_key UNIQUE (user_id, course_id);

ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])));

ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);

ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

-- ==================== INDEXES ====================

CREATE UNIQUE INDEX certificates_certificate_code_key ON public.certificates USING btree (certificate_code);

CREATE UNIQUE INDEX certificates_user_id_course_id_key ON public.certificates USING btree (user_id, course_id);

CREATE UNIQUE INDEX enrollments_user_id_course_id_key ON public.enrollments USING btree (user_id, course_id);

CREATE INDEX idx_audit_action ON public.audit_logs USING btree (action);

CREATE INDEX idx_audit_actor ON public.audit_logs USING btree (actor_id);

CREATE INDEX idx_audit_created ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_target ON public.audit_logs USING btree (target_type, target_id);

CREATE INDEX idx_certificates_code ON public.certificates USING btree (certificate_code);

CREATE INDEX idx_courses_category ON public.courses USING btree (category);

CREATE INDEX idx_courses_description_search ON public.courses USING gin (description gin_trgm_ops);

CREATE INDEX idx_courses_published ON public.courses USING btree (is_published);

CREATE INDEX idx_courses_title_search ON public.courses USING gin (title gin_trgm_ops);

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);

CREATE INDEX idx_enrollments_course_active ON public.enrollments USING btree (course_id, is_active);

CREATE INDEX idx_enrollments_source ON public.enrollments USING btree (enrollment_source);

CREATE INDEX idx_enrollments_user ON public.enrollments USING btree (user_id);

CREATE INDEX idx_enrollments_user_active ON public.enrollments USING btree (user_id, is_active);

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);

CREATE INDEX idx_lessons_course ON public.lessons USING btree (course_id);

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);

CREATE INDEX idx_lessons_order ON public.lessons USING btree (course_id, order_index);

CREATE INDEX idx_modules_course ON public.course_modules USING btree (course_id);

CREATE INDEX idx_modules_order ON public.course_modules USING btree (course_id, order_index);

CREATE INDEX idx_notes_lesson ON public.lesson_notes USING btree (lesson_id);

CREATE INDEX idx_notes_user_course ON public.lesson_notes USING btree (user_id, course_id);

CREATE INDEX idx_payments_created ON public.payment_requests USING btree (created_at DESC);

CREATE INDEX idx_payments_status ON public.payment_requests USING btree (status);

CREATE INDEX idx_payments_user ON public.payment_requests USING btree (user_id);

CREATE INDEX idx_products_published ON public.digital_products USING btree (is_published);

CREATE INDEX idx_profiles_active ON public.profiles USING btree (is_active);

CREATE INDEX idx_profiles_assigned_to ON public.profiles USING btree (assigned_to);

CREATE INDEX idx_profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone) WHERE (phone IS NOT NULL);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_profiles_students ON public.profiles USING btree (created_at DESC) WHERE (role = 'student'::text);

CREATE INDEX idx_progress_lesson ON public.lesson_progress USING btree (lesson_id);

CREATE INDEX idx_progress_user ON public.lesson_progress USING btree (user_id);

CREATE INDEX idx_purchases_user ON public.purchases USING btree (user_id);

CREATE INDEX idx_purchases_user_active ON public.purchases USING btree (user_id, is_active);

CREATE INDEX idx_quiz_attempts_lesson ON public.lesson_quiz_attempts USING btree (lesson_id);

CREATE INDEX idx_quiz_attempts_user ON public.lesson_quiz_attempts USING btree (user_id);

CREATE INDEX idx_resources_lesson ON public.lesson_resources USING btree (lesson_id);

CREATE INDEX idx_reviews_course ON public.reviews USING btree (course_id);

CREATE INDEX idx_reviews_course_published ON public.reviews USING btree (course_id, is_published, created_at DESC);

CREATE UNIQUE INDEX lesson_progress_user_id_lesson_id_key ON public.lesson_progress USING btree (user_id, lesson_id);

CREATE UNIQUE INDEX purchases_user_id_product_id_key ON public.purchases USING btree (user_id, product_id);

CREATE UNIQUE INDEX reviews_user_id_course_id_key ON public.reviews USING btree (user_id, course_id);

CREATE INDEX testimonials_published_sort_idx ON public.testimonials USING btree (is_published, sort_order, created_at DESC);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_quiz_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- ==================== POLICIES ====================

CREATE POLICY "Admins see all enrollments" ON public.enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));

CREATE POLICY "Admins see all payments" ON public.payment_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))))));

CREATE POLICY "Admins update payments" ON public.payment_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))))));

CREATE POLICY "Attempts insert: own only" ON public.lesson_quiz_attempts FOR INSERT WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Attempts read: own or staff" ON public.lesson_quiz_attempts FOR SELECT USING (((user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))));

CREATE POLICY "Certificates read: own or staff" ON public.certificates FOR SELECT USING (((user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))));

CREATE POLICY "Courses read policy" ON public.courses FOR SELECT USING (((is_published = true) OR (auth.uid() = instructor_id) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text]))));

CREATE POLICY "Instructors read own course enrollments" ON public.enrollments FOR SELECT USING (((get_user_role(auth.uid()) = 'instructor'::text) AND (course_id IN ( SELECT courses.id
   FROM courses
  WHERE (courses.instructor_id = auth.uid())))));

CREATE POLICY "Lessons manage: staff" ON public.lessons FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text])));

CREATE POLICY "Lessons read: active enrollment or staff" ON public.lessons FOR SELECT USING (((EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.course_id = lessons.course_id) AND (e.user_id = auth.uid()) AND (COALESCE(e.is_active, true) = true)))) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text]))));

CREATE POLICY "Modules manage: staff" ON public.course_modules FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text])));

CREATE POLICY "Modules read: active enrollment, staff, or published course" ON public.course_modules FOR SELECT USING (((EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.course_id = course_modules.course_id) AND (e.user_id = auth.uid()) AND (COALESCE(e.is_active, true) = true)))) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text])) OR (EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = course_modules.course_id) AND (c.is_published = true))))));

CREATE POLICY "Notes: own only" ON public.lesson_notes FOR ALL USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Products read policy" ON public.digital_products FOR SELECT USING (((is_published = true) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))));

CREATE POLICY "Profiles read self or staff" ON public.profiles FOR SELECT USING (((auth.uid() = id) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text]))));

CREATE POLICY "Profiles update self or staff" ON public.profiles FOR UPDATE USING (((auth.uid() = id) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text])))) WITH CHECK (((auth.uid() = id) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))));

CREATE POLICY "Progress: own only" ON public.lesson_progress FOR ALL USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Public read published products" ON public.digital_products FOR SELECT USING ((is_published = true));

CREATE POLICY "Public read published testimonials" ON public.testimonials FOR SELECT USING ((is_published = true));

CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING ((is_published = true));

CREATE POLICY "Resources manage: staff" ON public.lesson_resources FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text])));

CREATE POLICY "Resources read: active enrollment or staff" ON public.lesson_resources FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN enrollments e ON ((e.course_id = l.course_id)))
  WHERE ((l.id = lesson_resources.lesson_id) AND (e.user_id = auth.uid()) AND (COALESCE(e.is_active, true) = true)))) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text]))));

CREATE POLICY "Reviews insert own" ON public.reviews FOR INSERT WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Reviews read published or own or staff" ON public.reviews FOR SELECT USING (((is_published = true) OR (user_id = auth.uid()) OR (get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text, 'instructor'::text]))));

CREATE POLICY "Reviews staff manage" ON public.reviews FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text])));

CREATE POLICY "Reviews update own unpublished" ON public.reviews FOR UPDATE USING (((user_id = auth.uid()) AND (is_published = false))) WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Staff delete courses" ON public.courses FOR DELETE USING (((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text])) OR (auth.uid() = instructor_id)));

CREATE POLICY "Staff insert courses" ON public.courses FOR INSERT WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text])));

CREATE POLICY "Staff manage enrollments" ON public.enrollments FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text])));

CREATE POLICY "Staff manage products" ON public.digital_products FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'instructor'::text])));

CREATE POLICY "Staff manage purchases" ON public.purchases FOR ALL USING ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text]))) WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'sales'::text])));

CREATE POLICY "Staff update courses" ON public.courses FOR UPDATE USING (((get_user_role(auth.uid()) = ANY (ARRAY['super_admin'::text, 'admin'::text])) OR (auth.uid() = instructor_id)));

CREATE POLICY "Super admin reads audit logs" ON public.audit_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'super_admin'::text)))));

CREATE POLICY "System inserts audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users create payment requests" ON public.payment_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users see own enrollments" ON public.enrollments FOR SELECT USING ((user_id = auth.uid()));

CREATE POLICY "Users see own payments" ON public.payment_requests FOR SELECT USING ((user_id = auth.uid()));

-- ==================== VIEWS ====================

CREATE OR REPLACE VIEW public.student_progress_summary AS  SELECT e.user_id,
    e.course_id,
    e.enrolled_at,
    e.is_active AS enrollment_active,
    e.enrollment_source,
    e.enrolled_by,
    c.title AS course_title,
    c.thumbnail_url AS course_thumbnail,
    c.instructor_id,
    COALESCE(lesson_stats.total_lessons, (0)::bigint) AS total_lessons,
    COALESCE(lesson_stats.completed_lessons, (0)::bigint) AS completed_lessons,
        CASE
            WHEN (COALESCE(lesson_stats.total_lessons, (0)::bigint) = 0) THEN (0)::numeric
            ELSE round((((COALESCE(lesson_stats.completed_lessons, (0)::bigint))::numeric / (lesson_stats.total_lessons)::numeric) * (100)::numeric))
        END AS progress_percent
   FROM ((enrollments e
     JOIN courses c ON ((c.id = e.course_id)))
     LEFT JOIN LATERAL ( SELECT count(l.id) AS total_lessons,
            count(lp.id) FILTER (WHERE (lp.is_completed = true)) AS completed_lessons
           FROM (lessons l
             LEFT JOIN lesson_progress lp ON (((lp.lesson_id = l.id) AND (lp.user_id = e.user_id))))
          WHERE ((l.course_id = e.course_id) AND (COALESCE(l.is_published, true) = true))) lesson_stats ON (true));;

-- ==================== FUNCTIONS ====================

CREATE OR REPLACE FUNCTION public.check_lesson_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  lesson RECORD;
  has_video BOOLEAN := false;
  has_text BOOLEAN := false;
  has_quiz BOOLEAN := false;
  video_ok BOOLEAN := false;
  text_ok BOOLEAN := false;
  quiz_ok BOOLEAN := false;
  dur INT := 0;
BEGIN
  -- If already completed, preserve completed status forever
  IF OLD IS NOT NULL AND OLD.is_completed = true THEN
    NEW.is_completed := true;
    RETURN NEW;
  END IF;

  SELECT * INTO lesson FROM public.lessons WHERE id = NEW.lesson_id;
  IF lesson IS NULL THEN
    RETURN NEW;
  END IF;

  dur := COALESCE(lesson.duration_seconds, 0);

  has_video := lesson.video_key IS NOT NULL AND lesson.video_key != '';
  has_text := lesson.text_content IS NOT NULL 
    AND length(trim(regexp_replace(lesson.text_content, '<[^>]*>', '', 'g'))) > 0;
  has_quiz := lesson.quiz_data IS NOT NULL 
    AND jsonb_array_length(COALESCE(lesson.quiz_data->'questions', '[]'::jsonb)) > 0;

  -- Video check: 80% watched OR >=1s if duration is missing/0
  IF has_video THEN
    IF dur > 0 THEN
      video_ok := NEW.watch_seconds >= (dur * 0.8);
    ELSE
      video_ok := NEW.watch_seconds >= 1;
    END IF;
  END IF;

  -- Text check: 80% scroll
  IF has_text THEN
    text_ok := NEW.scroll_percentage >= 80;
  END IF;

  -- Quiz check: any attempt exists
  IF has_quiz THEN
    quiz_ok := EXISTS (
      SELECT 1 FROM public.lesson_quiz_attempts
      WHERE lesson_id = NEW.lesson_id AND user_id = NEW.user_id
    );
  END IF;

  -- Auto-complete if any section is completed
  IF (has_video AND video_ok) OR (has_text AND text_ok) OR (has_quiz AND quiz_ok) THEN
    NEW.is_completed := true;
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_profile_update_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid;
  caller_role text;
BEGIN
  caller_id := auth.uid();

  -- Service role / admin API (createAdminClient): auth.uid() is NULL.
  -- Allow these system updates (manual enroll, create student, etc.).
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  caller_role := public.get_user_role(caller_id);

  -- Super admin: full access
  IF caller_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  -- Admin: everything except granting super_admin
  IF caller_role = 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NEW.role = 'super_admin' THEN
      RAISE EXCEPTION 'Only super_admin can grant super_admin role';
    END IF;
    RETURN NEW;
  END IF;

  -- Sales: can edit student fields, but not role / is_active / assigned_to
  IF caller_role = 'sales' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Sales cannot change role';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Sales cannot change is_active';
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      RAISE EXCEPTION 'Sales cannot change assigned_to';
    END IF;
    RETURN NEW;
  END IF;

  -- Users editing their OWN profile: block sensitive columns
  IF caller_id = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot change your role';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'You cannot change is_active';
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      RAISE EXCEPTION 'You cannot change assigned_to';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'You cannot change id';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this profile';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_students_page(p_search text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid, p_has_purchases text DEFAULT 'all'::text, p_sort text DEFAULT 'newest'::text, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0, p_instructor_id uuid DEFAULT NULL::uuid, p_sales_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, full_name text, phone text, avatar_url text, email text, gender text, age_group text, life_status text, is_active boolean, created_at timestamp with time zone, courses_count bigint, products_count bigint, avg_progress numeric, last_activity timestamp with time zone, total_count bigint, assigned_to uuid, assigned_to_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
  v_total BIGINT;
BEGIN
  -- 1. Count total matching students
  SELECT COUNT(DISTINCT p.id)
  INTO v_total
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'student'
    AND (
      p_search IS NULL
      OR p.full_name ILIKE '%' || p_search || '%'
      OR p.phone ILIKE '%' || p_search || '%'
      OR u.email ILIKE '%' || p_search || '%'
    )
    AND (p_sales_id IS NULL OR p.assigned_to = p_sales_id)
    AND (
      p_course_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.enrollments e2
        WHERE e2.user_id = p.id AND e2.course_id = p_course_id AND COALESCE(e2.is_active, true) = true
      )
    )
    AND (
      p_instructor_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.enrollments e3
        JOIN public.courses c3 ON c3.id = e3.course_id
        WHERE e3.user_id = p.id AND c3.instructor_id = p_instructor_id AND COALESCE(e3.is_active, true) = true
      )
    )
    AND (
      p_has_purchases = 'all'
      OR (p_has_purchases = 'yes' AND (
        EXISTS (SELECT 1 FROM public.enrollments ex WHERE ex.user_id = p.id AND COALESCE(ex.is_active,true)=true)
        OR EXISTS (SELECT 1 FROM public.purchases px WHERE px.user_id = p.id AND COALESCE(px.is_active,true)=true)
      ))
      OR (p_has_purchases = 'no' AND (
        NOT EXISTS (SELECT 1 FROM public.enrollments ex WHERE ex.user_id = p.id AND COALESCE(ex.is_active,true)=true)
        AND NOT EXISTS (SELECT 1 FROM public.purchases px WHERE px.user_id = p.id AND COALESCE(px.is_active,true)=true)
      ))
    );

  -- 2. Return result rows
  RETURN QUERY
  SELECT
    p.id AS id,
    p.full_name AS full_name,
    p.phone AS phone,
    p.avatar_url AS avatar_url,
    u.email::TEXT AS email,
    p.gender AS gender,
    p.age_group AS age_group,
    p.life_status AS life_status,
    COALESCE(p.is_active, true) AS is_active,
    p.created_at AS created_at,
    COALESCE((
      SELECT COUNT(*) FROM public.enrollments e
      WHERE e.user_id = p.id AND COALESCE(e.is_active, true) = true
    ), 0) AS courses_count,
    COALESCE((
      SELECT COUNT(*) FROM public.purchases pu
      WHERE pu.user_id = p.id AND COALESCE(pu.is_active, true) = true
    ), 0) AS products_count,
    COALESCE((
      SELECT ROUND(AVG(sps.progress_percent), 0)
      FROM public.student_progress_summary sps
      WHERE sps.user_id = p.id AND sps.enrollment_active = true
    ), 0) AS avg_progress,
    GREATEST(
      p.updated_at,
      (SELECT MAX(lp.updated_at) FROM public.lesson_progress lp WHERE lp.user_id = p.id)
    ) AS last_activity,
    v_total AS total_count,
    p.assigned_to AS assigned_to,
    (SELECT sales_prof.full_name FROM public.profiles sales_prof WHERE sales_prof.id = p.assigned_to) AS assigned_to_name
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'student'
    AND (
      p_search IS NULL
      OR p.full_name ILIKE '%' || p_search || '%'
      OR p.phone ILIKE '%' || p_search || '%'
      OR u.email ILIKE '%' || p_search || '%'
    )
    AND (p_sales_id IS NULL OR p.assigned_to = p_sales_id)
    AND (
      p_course_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.enrollments e2
        WHERE e2.user_id = p.id AND e2.course_id = p_course_id AND COALESCE(e2.is_active, true) = true
      )
    )
    AND (
      p_instructor_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.enrollments e3
        JOIN public.courses c3 ON c3.id = e3.course_id
        WHERE e3.user_id = p.id AND c3.instructor_id = p_instructor_id AND COALESCE(e3.is_active, true) = true
      )
    )
    AND (
      p_has_purchases = 'all'
      OR (p_has_purchases = 'yes' AND (
        EXISTS (SELECT 1 FROM public.enrollments ex WHERE ex.user_id = p.id AND COALESCE(ex.is_active,true)=true)
        OR EXISTS (SELECT 1 FROM public.purchases px WHERE px.user_id = p.id AND COALESCE(px.is_active,true)=true)
      ))
      OR (p_has_purchases = 'no' AND (
        NOT EXISTS (SELECT 1 FROM public.enrollments ex WHERE ex.user_id = p.id AND COALESCE(ex.is_active,true)=true)
        AND NOT EXISTS (SELECT 1 FROM public.purchases px WHERE px.user_id = p.id AND COALESCE(px.is_active,true)=true)
      ))
    )
  ORDER BY
    CASE WHEN p_sort = 'newest' THEN p.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN p.created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'name_asc' THEN p.full_name END ASC NULLS LAST,
    CASE WHEN p_sort = 'name_desc' THEN p.full_name END DESC NULLS LAST,
    p.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$
;

CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$
;

CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$
;

CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)
 RETURNS "char"
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_compress$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_consistent$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_decompress$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_distance$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_in$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/pg_trgm', $function$gtrgm_options$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_out$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_penalty$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_same$function$
;

CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_union$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_payment_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only fire when status changes TO 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    IF NEW.item_type = 'course' THEN
      INSERT INTO enrollments (user_id, course_id, payment_request_id)
      VALUES (NEW.user_id, NEW.item_id, NEW.id)
      ON CONFLICT (user_id, course_id) DO NOTHING;
    
    ELSIF NEW.item_type = 'digital_product' THEN
      INSERT INTO purchases (user_id, product_id, payment_request_id)
      VALUES (NEW.user_id, NEW.item_id, NEW.id)
      ON CONFLICT (user_id, product_id) DO NOTHING;
    END IF;

    -- Log to audit trail
    INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, details)
    VALUES (
      NEW.reviewed_by,
      (SELECT role FROM profiles WHERE id = NEW.reviewed_by),
      'approve_payment',
      'payment_request',
      NEW.id,
      jsonb_build_object(
        'transaction_number', NEW.transaction_number,
        'amount', NEW.amount,
        'item_type', NEW.item_type,
        'item_id', NEW.item_id
      )
    );
  END IF;

  -- Log rejections too
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, details)
    VALUES (
      NEW.reviewed_by,
      (SELECT role FROM profiles WHERE id = NEW.reviewed_by),
      'reject_payment',
      'payment_request',
      NEW.id,
      jsonb_build_object('reason', NEW.rejection_reason)
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recheck_after_quiz_submit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert or bump the lesson_progress row to trigger check_lesson_completion
  INSERT INTO lesson_progress (user_id, lesson_id, watch_seconds, scroll_percentage, time_on_page_seconds)
  VALUES (NEW.user_id, NEW.lesson_id, 0, 0, 0)
  ON CONFLICT (user_id, lesson_id) DO UPDATE
  SET updated_at = now();

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_limit(real)
 RETURNS real
 LANGUAGE c
 STRICT
AS '$libdir/pg_trgm', $function$set_limit$function$
;

CREATE OR REPLACE FUNCTION public.show_limit()
 RETURNS real
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_limit$function$
;

CREATE OR REPLACE FUNCTION public.show_trgm(text)
 RETURNS text[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_trgm$function$
;

CREATE OR REPLACE FUNCTION public.similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity$function$
;

CREATE OR REPLACE FUNCTION public.similarity_dist(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_dist$function$
;

CREATE OR REPLACE FUNCTION public.similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_op$function$
;

CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity$function$
;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_commutator_op$function$
;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_commutator_op$function$
;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_op$function$
;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_op$function$
;

CREATE OR REPLACE FUNCTION public.word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity$function$
;

CREATE OR REPLACE FUNCTION public.word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_commutator_op$function$
;

CREATE OR REPLACE FUNCTION public.word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_commutator_op$function$
;

CREATE OR REPLACE FUNCTION public.word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_op$function$
;

CREATE OR REPLACE FUNCTION public.word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_op$function$
;

-- ==================== TRIGGERS ====================

CREATE TRIGGER enforce_profile_update_rules_trg BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION enforce_profile_update_rules();

CREATE TRIGGER on_payment_status_change AFTER UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION handle_payment_approval();

CREATE TRIGGER on_progress_update BEFORE INSERT OR UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION check_lesson_completion();

CREATE TRIGGER on_quiz_submitted AFTER INSERT ON public.lesson_quiz_attempts FOR EACH ROW EXECUTE FUNCTION recheck_after_quiz_submit();