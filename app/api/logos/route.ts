import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logosDir = path.join(process.cwd(), 'public', 'logos');

    // Check if public/logos directory exists
    if (!fs.existsSync(logosDir)) {
      return NextResponse.json({ logos: [] });
    }

    // Read all files in the directory
    const files = await fs.promises.readdir(logosDir);

    // Supported image formats
    const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

    const logos = files
      .filter((file) => validExtensions.includes(path.extname(file).toLowerCase()))
      .map((file) => `/logos/${file}`);

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('Failed to read logos directory:', error);
    return NextResponse.json({ logos: [] });
  }
}