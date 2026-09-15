import { createClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

const LOGIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_LOGIN_SLUG || 'staff-login-x7k9m';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${LOGIN_SLUG}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single();

  // If user is not staff, return 404 safely
  if (
    !profile?.is_active ||
    !['super_admin', 'admin', 'sales', 'instructor'].includes(profile.role)
  ) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <AdminHeader userName={profile.full_name} role={profile.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}