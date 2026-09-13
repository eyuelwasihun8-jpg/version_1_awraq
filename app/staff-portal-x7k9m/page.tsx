import { createClient } from '@/lib/supabase-server';
import { StatCard } from '@/components/admin/StatCard';
import { Receipt, Users, BookOpen, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PORTAL_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'staff-portal-x7k9m';

async function getStats() {
  const supabase = await createClient();

  const [
    { count: pendingPayments },
    { count: approvedPayments },
    { count: rejectedPayments },
    { count: totalUsers },
    { count: totalCourses },
    { data: recentPayments },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('payment_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('payment_requests').select('amount').eq('status', 'approved'),
  ]);

  const totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  // Fetch user names for recent payments
  const userIds = Array.from(new Set((recentPayments || []).map((p: any) => p.user_id).filter(Boolean)));
  let usersMap = new Map();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (users || []).forEach((u) => usersMap.set(u.id, u));
  }

  const enrichedPayments = (recentPayments || []).map((p: any) => ({
    ...p,
    user: usersMap.get(p.user_id) || null,
  }));

  return {
    pendingPayments: pendingPayments || 0,
    approvedPayments: approvedPayments || 0,
    rejectedPayments: rejectedPayments || 0,
    totalUsers: totalUsers || 0,
    totalCourses: totalCourses || 0,
    totalRevenue,
    recentPayments: enrichedPayments,
  };
}

export default async function StaffOverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Overview</h1>
        <p className="text-sm text-slate-500 font-medium">Platform activity at a glance</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Pending Payments" value={stats.pendingPayments} icon={Clock} color="amber" />
        <StatCard
          label="Total Revenue"
          value={`ETB ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="cyan" />
        <StatCard label="Total Courses" value={stats.totalCourses} icon={BookOpen} color="purple" />
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Approved" value={stats.approvedPayments} icon={CheckCircle2} color="emerald" />
        <StatCard label="Rejected" value={stats.rejectedPayments} icon={XCircle} color="pink" />
        <StatCard label="Pending" value={stats.pendingPayments} icon={Clock} color="amber" />
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">Recent Payment Requests</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Latest 5 submissions</p>
          </div>
          <Link
            href={`/${PORTAL_SLUG}/payments`}
            className="text-xs font-bold text-[#07CCFD] hover:underline cursor-pointer"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {stats.recentPayments.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No payment requests yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Payments will appear here when students upload receipts
              </p>
            </div>
          ) : (
            stats.recentPayments.map((p: any) => (
              <Link
                key={p.id}
                href={`/${PORTAL_SLUG}/payments`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {p.user?.full_name || 'Unknown'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {new Date(p.created_at).toLocaleDateString()} · ETB{' '}
                    {Number(p.amount).toLocaleString()} · {p.payment_method?.toUpperCase()}
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase font-black px-2 py-1 rounded-full border ${
                    p.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : p.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}
                >
                  {p.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}