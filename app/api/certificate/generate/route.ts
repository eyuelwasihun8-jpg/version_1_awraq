import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { r2, getDownloadUrl, BUCKETS } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

// Generate a short verification code like CERT-2025-ABCD1234
function generateCertCode(): string {
  const year = new Date().getFullYear();
  const random = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `CERT-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { courseId, studentName } = body;

  if (!courseId || !studentName?.trim()) {
    return NextResponse.json({ error: 'courseId and studentName required' }, { status: 400 });
  }

  // Prevent duplicate certificates
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    const url = await getDownloadUrl(BUCKETS.certificates, existing.certificate_url!, 600);
    return NextResponse.json({ success: true, certificate: existing, downloadUrl: url });
  }

  // Re-verify eligibility
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ error: 'No lessons' }, { status: 400 });
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessons.map((l) => l.id));

  const done = progress?.filter((p) => p.is_completed).length ?? 0;
  if (done < lessons.length) {
    return NextResponse.json({ error: 'Course not fully completed' }, { status: 403 });
  }

  // Load course + template
  const { data: course } = await supabase
    .from('courses')
    .select('title, certificate_template_key')
    .eq('id', courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const certCode = generateCertCode();
  const issuedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build the PDF
  const pdfDoc = await PDFDocument.create();

  // If admin uploaded a template image, use it as background
  if (course.certificate_template_key) {
    try {
      const templateCmd = new GetObjectCommand({
        Bucket: BUCKETS.content,
        Key: course.certificate_template_key,
      });
      const templateResponse = await r2.send(templateCmd);
      const templateBytes = await templateResponse.Body!.transformToByteArray();

      // Try PNG first, fallback to JPG
      let templateImage;
      try {
        templateImage = await pdfDoc.embedPng(templateBytes);
      } catch {
        templateImage = await pdfDoc.embedJpg(templateBytes);
      }

      const page = pdfDoc.addPage([templateImage.width, templateImage.height]);
      page.drawImage(templateImage, {
        x: 0,
        y: 0,
        width: templateImage.width,
        height: templateImage.height,
      });

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const smallFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Student name — centered, middle
      const nameSize = 48;
      const nameWidth = font.widthOfTextAtSize(studentName, nameSize);
      page.drawText(studentName, {
        x: (templateImage.width - nameWidth) / 2,
        y: templateImage.height / 2,
        size: nameSize,
        font,
        color: rgb(0.1, 0.1, 0.4),
      });

      // Date + cert code — bottom
      const footer = `Issued: ${issuedDate}  |  ${certCode}`;
      const footerWidth = smallFont.widthOfTextAtSize(footer, 14);
      page.drawText(footer, {
        x: (templateImage.width - footerWidth) / 2,
        y: 60,
        size: 14,
        font: smallFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    } catch (err) {
      console.error('Template load failed, using default:', err);
      await drawDefaultCert(pdfDoc, studentName, course.title, issuedDate, certCode);
    }
  } else {
    // No template? Draw a plain certificate
    await drawDefaultCert(pdfDoc, studentName, course.title, issuedDate, certCode);
  }

  const pdfBytes = await pdfDoc.save();

  // Upload PDF to R2
  const fileKey = `${user.id}/${courseId}/${certCode}.pdf`;
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKETS.certificates,
      Key: fileKey,
      Body: pdfBytes,
      ContentType: 'application/pdf',
    })
  );

  // Save to DB
  const { data: cert, error } = await supabase
    .from('certificates')
    .insert({
      user_id: user.id,
      course_id: courseId,
      student_name: studentName.trim(),
      certificate_url: fileKey,
      certificate_code: certCode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const downloadUrl = await getDownloadUrl(BUCKETS.certificates, fileKey, 600);

  return NextResponse.json({ success: true, certificate: cert, downloadUrl });
}

// Fallback certificate design if no template uploaded
async function drawDefaultCert(
  pdfDoc: PDFDocument,
  name: string,
  courseTitle: string,
  date: string,
  code: string
) {
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 782,
    height: 535,
    borderColor: rgb(0.1, 0.3, 0.6),
    borderWidth: 4,
  });

  // Title
  const title = 'CERTIFICATE OF COMPLETION';
  page.drawText(title, {
    x: (842 - font.widthOfTextAtSize(title, 32)) / 2,
    y: 480,
    size: 32,
    font,
    color: rgb(0.1, 0.3, 0.6),
  });

  page.drawText('This is to certify that', {
    x: (842 - italic.widthOfTextAtSize('This is to certify that', 18)) / 2,
    y: 400,
    size: 18,
    font: italic,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Student name
  page.drawText(name, {
    x: (842 - font.widthOfTextAtSize(name, 40)) / 2,
    y: 340,
    size: 40,
    font,
    color: rgb(0.1, 0.1, 0.4),
  });

  // Course
  const line = 'has successfully completed the course';
  page.drawText(line, {
    x: (842 - italic.widthOfTextAtSize(line, 16)) / 2,
    y: 280,
    size: 16,
    font: italic,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(courseTitle, {
    x: (842 - font.widthOfTextAtSize(courseTitle, 24)) / 2,
    y: 240,
    size: 24,
    font,
    color: rgb(0.1, 0.1, 0.4),
  });

  // Footer
  const footer = `Issued: ${date}   |   Verification: ${code}`;
  page.drawText(footer, {
    x: (842 - regular.widthOfTextAtSize(footer, 12)) / 2,
    y: 80,
    size: 12,
    font: regular,
    color: rgb(0.4, 0.4, 0.4),
  });
}