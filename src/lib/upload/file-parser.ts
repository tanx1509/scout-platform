import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import prisma from '@/lib/db/prisma';
import type { UploadPreviewRow, UploadValidationResult } from '@/types/candidate';

const COLUMN_MAPPINGS: Record<string, string> = {
  'name': 'name',
  'full name': 'name',
  'candidate name': 'name',
  'email': 'email',
  'email address': 'email',
  'e-mail': 'email',
  'college': 'college',
  'university': 'college',
  'institution': 'college',
  'school': 'college',
  'branch': 'branch',
  'degree': 'branch',
  'major': 'branch',
  'specialization': 'branch',
  'cgpa': 'cgpa',
  'gpa': 'cgpa',
  'grade': 'cgpa',
  'resume link': 'resumeLink',
  'resume url': 'resumeLink',
  'resume': 'resumeLink',
  'cv link': 'resumeLink',
  'cv': 'resumeLink',
  'github': 'githubProfile',
  'github profile': 'githubProfile',
  'github url': 'githubProfile',
  'github link': 'githubProfile',
  'linkedin': 'linkedinProfile',
  'linkedin profile': 'linkedinProfile',
  'linkedin url': 'linkedinProfile',
  'phone': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'contact': 'phone',
  'best ai project': 'bestAiProject',
  'best_ai_project': 'bestAiProject',
  'research work': 'researchWork',
  'research_work': 'researchWork',
  'test_la': 'testLa',
  'test la': 'testLa',
  'test_code': 'testCode',
  'test code': 'testCode',
};

function normalizeHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    if (COLUMN_MAPPINGS[normalized]) {
      mapping[header] = COLUMN_MAPPINGS[normalized];
    }
  }
  return mapping;
}

function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function parseCSV(content: string): Record<string, string>[] {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  return result.data as Record<string, string>[];
}

function parseExcel(buffer: ArrayBuffer, sheetName?: string): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  let targetSheet = workbook.Sheets[workbook.SheetNames[0]];
  
  if (sheetName && workbook.Sheets[sheetName]) {
    targetSheet = workbook.Sheets[sheetName];
  } else if (!sheetName && workbook.Sheets['Response']) {
    targetSheet = workbook.Sheets['Response'];
  }
  
  return XLSX.utils.sheet_to_json(targetSheet, { defval: '' }) as Record<string, string>[];
}

export async function parseUploadedFile(
  fileContent: string | ArrayBuffer,
  fileType: 'csv' | 'xlsx'
): Promise<UploadValidationResult> {
  const rawRows = fileType === 'csv'
    ? parseCSV(fileContent as string)
    : parseExcel(fileContent as ArrayBuffer);

  if (rawRows.length === 0) {
    return { totalRows: 0, validRows: 0, errorRows: 0, duplicateRows: 0, preview: [], rawData: [] };
  }

  const headers = Object.keys(rawRows[0]);
  const headerMapping = normalizeHeaders(headers);

  const normalizedRows = rawRows.map(row => {
    const normalized: Record<string, string> = {};
    for (const [original, canonical] of Object.entries(headerMapping)) {
      normalized[canonical] = (row[original] || '').toString().trim();
    }
    return normalized;
  });

  const existingCandidates = await prisma.candidate.findMany({
    select: { email: true },
  });
  const existingEmails = new Set(existingCandidates.map(c => c.email.toLowerCase()));
  const uploadEmails = new Set<string>();

  let validRows = 0;
  let errorRows = 0;
  let duplicateRows = 0;

  const preview: UploadPreviewRow[] = normalizedRows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isDuplicate = false;

    if (!row.name || row.name.length === 0) {
      errors.push('Name is required');
    }

    if (!row.email || row.email.length === 0) {
      errors.push('Email is required');
    } else if (!validateEmail(row.email)) {
      errors.push('Invalid email format');
    } else {
      const emailLower = row.email.toLowerCase();
      if (existingEmails.has(emailLower)) {
        isDuplicate = true;
        warnings.push('Email already exists in database');
      } else if (uploadEmails.has(emailLower)) {
        isDuplicate = true;
        warnings.push('Duplicate email in upload file');
      }
      uploadEmails.add(emailLower);
    }

    if (row.cgpa) {
      const cgpa = parseFloat(row.cgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        errors.push('CGPA must be between 0 and 10');
      }
    }

    if (errors.length > 0) {
      errorRows++;
    } else if (isDuplicate) {
      duplicateRows++;
    } else {
      validRows++;
    }

    return {
      rowIndex: index + 1,
      name: row.name || '',
      email: row.email || '',
      college: row.college,
      branch: row.branch,
      cgpa: row.cgpa,
      resumeLink: row.resumeLink,
      githubProfile: row.githubProfile,
      bestAiProject: row.bestAiProject,
      researchWork: row.researchWork,
      testLa: row.testLa,
      testCode: row.testCode,
      errors,
      warnings,
      isDuplicate,
    };
  });

  return {
    totalRows: normalizedRows.length,
    validRows,
    errorRows,
    duplicateRows,
    preview,
    rawData: normalizedRows,
  };
}
