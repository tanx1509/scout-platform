import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from 'next/server';
import { parseUploadedFile } from '@/lib/upload/file-parser';

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    let fileType: 'csv' | 'xlsx';
    if (name.endsWith('.csv')) fileType = 'csv';
    else if (name.endsWith('.xlsx') || name.endsWith('.xls')) fileType = 'xlsx';
    else return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    
    let content: string | ArrayBuffer = arrayBuffer;
    if (fileType === 'csv') {
      content = Buffer.from(arrayBuffer).toString('utf-8');
    }

    const validationResult = await parseUploadedFile(content, fileType);
    
    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
