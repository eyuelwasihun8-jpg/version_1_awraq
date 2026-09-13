import { VerifyClient } from '@/components/certificate/VerifyClient';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <VerifyClient code={code} />;
}