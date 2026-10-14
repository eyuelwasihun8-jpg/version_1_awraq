import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { studentQuerySchema } from '@/lib/validators';
import { createGetHandler, withAuth } from '@/lib/api-handler';

export const GET = createGetHandler(
  studentQuerySchema,
  withAuth(async (request) => {
    const { validatedQuery } = request;
    const { user, profile: authProfile } = (request as any).auth;

    const adminDb = createAdminClient();

    const {
      search,
      courseId,
      hasPurchases,
      sort,
      page,
      limit,
    } = validatedQuery;

    const offset = (page - 1) * limit;

    const instructorId = authProfile.role === 'instructor' ? user.id : null;
    const salesId = authProfile.role === 'sales' ? user.id : null;

    const { data, error } = await adminDb.rpc('get_students_page', {
      p_search: search,
      p_course_id: courseId,
      p_has_purchases: hasPurchases,
      p_sort: sort,
      p_limit: limit,
      p_offset: offset,
      p_instructor_id: instructorId,
      p_sales_id: salesId,
    });

    if (error) {
      console.error('get_students_page error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const total = rows.length > 0 ? Number(rows[0].total_count || 0) : 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return NextResponse.json({
      students: rows.map((s: any) => ({
        id: s.id,
        fullName: s.full_name,
        phone: s.phone,
        avatarUrl: s.avatar_url,
        email: s.email,
        gender: s.gender,
        ageGroup: s.age_group,
        lifeStatus: s.life_status,
        isActive: s.is_active,
        createdAt: s.created_at,
        coursesCount: Number(s.courses_count || 0),
        productsCount: Number(s.products_count || 0),
        avgProgress: Number(s.avg_progress || 0),
        lastActivity: s.last_activity,
        assignedToId: s.assigned_to,
        assignedToName: s.assigned_to_name,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }, 'staff')
);