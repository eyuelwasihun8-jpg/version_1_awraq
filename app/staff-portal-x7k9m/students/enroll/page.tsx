import { createClient } from '@/lib/supabase-server';
import { EnrollStudentWizard } from '@/components/admin/EnrollStudentWizard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EnrollStudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only super_admin, admin, sales can enroll
  if (!profile || !['super_admin', 'admin', 'sales'].includes(profile.role)) {
    redirect('/');
  }

  const [{ data: courses }, { data: products }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, price, is_published')
      .order('title'),
    supabase
      .from('digital_products')
      .select('id, title, price, is_published')
      .order('title'),
  ]);

  return (
    <EnrollStudentWizard
      courses={courses || []}
      products={products || []}
      staffRole={profile.role}
    />
  );
}