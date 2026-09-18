import React from 'react';
import { CertificateVerification } from '@/components/certificates/CertificateVerification';

export const dynamic = 'force-dynamic';

async function getVerificationData(code: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${appUrl}/api/certificate/verify/${code}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.valid ? json.data : null;
  } catch {
    return null;
  }
}

export default async function PublicVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getVerificationData(code);

  return (
    <CertificateVerification certificateId={code} data={data || undefined} />
  );
}