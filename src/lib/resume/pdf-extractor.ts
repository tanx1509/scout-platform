const pdf = require('pdf-parse');

export interface ExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  pageCount?: number;
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<ExtractionResult> {
  try {
    if (!buffer || buffer.length === 0) {
      return { success: false, text: '', error: 'Empty file provided' };
    }

    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return { success: false, text: '', error: 'PDF contains no extractable text (possibly scanned/image-based)' };
    }

    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown PDF parsing error';
    return { success: false, text: '', error: `PDF parsing failed: ${message}` };
  }
}

export async function extractTextFromUrl(url: string): Promise<ExtractionResult> {
  try {
    if (!url || url.trim().length === 0) {
      return { success: false, text: '', error: 'No resume URL provided' };
    }

    // Handle Google Drive links
    let downloadUrl = url;
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    
    // Also handle drive.google.com/open?id= format
    const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (driveOpenMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${driveOpenMatch[1]}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(downloadUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScoutBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, text: '', error: `Failed to download resume: HTTP ${response.status} ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return { success: false, text: '', error: 'Downloaded file is empty' };
    }

    // Check if it's actually a PDF
    if (contentType.includes('text/html')) {
      // Might be a redirect page or access denied
      const textContent = buffer.toString('utf-8').substring(0, 500);
      if (textContent.includes('Sign in') || textContent.includes('access denied') || textContent.includes('not found')) {
        return { success: false, text: '', error: 'Resume URL requires authentication or is not accessible' };
      }
    }

    return await extractTextFromPdfBuffer(buffer);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, text: '', error: 'Resume download timed out (30s)' };
    }
    const message = error instanceof Error ? error.message : 'Unknown download error';
    return { success: false, text: '', error: `Resume download failed: ${message}` };
  }
}
