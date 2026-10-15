import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { updateCourseSchema } from '@/lib/validators';
import { createHandler, withAuth } from '@/lib/api-handler';
import { deleteR2File, deleteR2Files } from '@/lib/r2-delete';
import { BUCKETS } from '@/lib/r2';

export const GET = createHandler(
  null,
  null,
  withAuth(async (request) => {
    const params = await (request as any).context?.params;
    const { id } = params;
    const supabase = await createClient();
    const { user, profile: authProfile } = (request as any).auth;

    if (authProfile.role === 'instructor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (!course || course.instructor_id !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*, instructor:profiles(full_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    return NextResponse.json({ success: true, course: data });
  }, 'staff')
);

export const PATCH = createHandler(
  updateCourseSchema,
  null,
  withAuth(async (request) => {
    const params = await (request as any).context?.params;
    const { id } = params;
    const { validatedData: body } = request;
    const supabase = await createClient();
    const { user, profile: authProfile } = (request as any).auth;

    if (authProfile.role === 'instructor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (!course || course.instructor_id !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title?.trim();
    if (body.description !== undefined) updates.description = body.description ?? null;
    if (body.category !== undefined) updates.category = body.category;
    if (body.price !== undefined) updates.price = body.price;
    if (body.thumbnailUrl !== undefined) updates.thumbnail_url = body.thumbnailUrl || null;
    if (body.certificateTemplateKey !== undefined) {
      updates.certificate_template_key = body.certificateTemplateKey || null;
    }
    if (body.isPublished !== undefined) updates.is_published = body.isPublished;

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const adminDb = createAdminClient();
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: authProfile.role,
      action: 'update_course',
      target_type: 'course',
      target_id: id,
      details: { updated_fields: Object.keys(updates).filter(k => k !== 'updated_at') },
    });

    return NextResponse.json({ success: true, course: data });
  }, 'staff')
);

export const DELETE = createHandler(
  null,
  null,
  withAuth(async (request) => {
    const params = await (request as any).context?.params;
    const { id } = params;
    const { user, profile: authProfile } = (request as any).auth;

    if (!['super_admin', 'admin'].includes(authProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // 1. Collect all R2 file keys before deleting DB rows
    const { data: course } = await adminDb
      .from('courses')
      .select('thumbnail_url, certificate_template_key')
      .eq('id', id)
      .single();

    const { data: lessons } = await adminDb
      .from('lessons')
      .select('id, video_key')
      .eq('course_id', id);

    const lessonIds = (lessons || []).map((l) => l.id);

    let resourceKeys: string[] = [];
    if (lessonIds.length > 0) {
      const { data: resources } = await adminDb
        .from('lesson_resources')
        .select('file_key')
        .in('lesson_id', lessonIds);
      resourceKeys = (resources || [])
        .map((r) => r.file_key)
        .filter((k): k is string => !!k);
    }

    const { data: certificates } = await adminDb
      .from('certificates')
      .select('certificate_url')
      .eq('course_id', id);

    // 2. Delete DB row (cascades to modules, lessons, enrollments, progress, etc.)
    const supabase = await createClient();
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 3. Clean up R2 files
    const contentFilesToDelete = [
      course?.thumbnail_url,
      course?.certificate_template_key,
      ...(lessons || []).map((l) => l.video_key),
      ...resourceKeys,
    ];

    await deleteR2Files(BUCKETS.content, contentFilesToDelete);

    const certFilesToDelete = (certificates || [])
      .map((c) => c.certificate_url)
      .filter((k): k is string => !!k);
    await deleteR2Files(BUCKETS.certificates, certFilesToDelete);

    // 4. Audit log
    await adminDb.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: authProfile.role,
      action: 'delete_course',
      target_type: 'course',
      target_id: id,
      details: {
        files_deleted: contentFilesToDelete.filter(Boolean).length + certFilesToDelete.length,
      },
    });

    return NextResponse.json({ success: true });
  }, 'admin')
);