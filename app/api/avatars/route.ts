import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_AVATARS = 6; // Max 6 avatars
const VALID_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];

export async function GET() {
  try {
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');

    if (!fs.existsSync(avatarsDir)) {
      return NextResponse.json({ avatars: [] });
    }

    const files = await fs.promises.readdir(avatarsDir);

    const avatars = files
      .filter((file) => VALID_EXT.includes(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, MAX_AVATARS)
      .map((file) => `/avatars/${file}`);

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error('Failed to read avatars directory:', error);
    return NextResponse.json({ avatars: [] });
  }
}