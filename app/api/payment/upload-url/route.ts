import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUploadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create a unique file name: user_id/random-uuid.jpg
  const fileKey = `${user.id}/${uuidv4()}.jpg`;
  
  // Get a 10-minute valid upload URL for the receipts bucket
  const uploadUrl = await getUploadUrl(BUCKETS.receipts, fileKey, 'image/jpeg', 600);

  return NextResponse.json({ uploadUrl, fileKey });
}