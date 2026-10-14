import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireStaff } from '@/lib/auth';
import { createCourseSchema, courseQuerySchema } from '@/lib/validators';
import { createHandler, withAuth } from '@/lib/api-handler';

export const GET = createHandler(
  null,
  courseQuerySchema,
  withAuth(async (request) => {
    const { validatedQuery } = request;
    const supabase = await createClient();

    const auth = await requireStaff();
    const { user, profile } = auth;

    let query = supabase
      .from('courses')
      .select('*, instructor:profiles!courses_instructor_id_fkey ( id, full_name )')
      .order('created_at', { ascending: false });

    if (profile.role === 'instructor') {
      query = query.eq('instructor_id', user.id);
    }

    if (validatedQuery.category) {
      query = query.eq('category', validatedQuery.category);
    }
    if (validatedQuery.isPublished !== undefined) {
      query = query.eq('is_published', validatedQuery.isPublished);
    }
    if (validatedQuery.instructorId) {
      query = query.eq('instructor_id', validatedQuery.instructorId);
    }

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      courses: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  }, 'staff')
);

export const POST = createHandler(
  createCourseSchema,
  null,
  withAuth(async (request) => {
    const { validatedData: body } = request;
    const supabase = await createClient();

    const auth = await requireStaff();
    const { user, profile } = auth;

    const instructorId = profile.role === 'instructor' ? user.id : (body.instructorId || user.id);

    const { data, error } = await supabase
      .from('courses')
      .insert({
        instructor_id: instructorId,
        title: body.title.trim(),
        description: body.description ?? null,
        category: body.category ?? 'other',
        price: body.price,
        thumbnail_url: body.thumbnailUrl || null,
        certificate_template_key: body.certificateTemplateKey || null,
        is_published: body.isPublished ?? false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const adminDb = (await import('@/lib/supabase-admin')).createAdminClient();
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: profile.role,
      action: 'create_course',
      target_type: 'course',
      target_id: data.id,
      details: { title: body.title, category: body.category, price: body.price },
    });

    return NextResponse.json({ success: true, course: data });
  }, 'staff')
);