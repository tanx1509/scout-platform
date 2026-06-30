import { Tool, ToolResult } from "../core/interfaces";

export class DocumentParserTool implements Tool {
  name = "DocumentParserTool";

  async execute(input: { fileUrl?: string; rawContent?: string; type?: string }): Promise<ToolResult> {
    try {
      let content = input.rawContent;

      if (!content && input.fileUrl) {
        try {
          // Check if it's a Google Drive link and convert it to a direct download link
          let downloadUrl = input.fileUrl;
          if (downloadUrl.includes("drive.google.com/file/d/")) {
            const fileIdMatch = downloadUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
            }
          }

          // Attempt to download the file
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Try parsing as PDF
          try {
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(buffer);
            content = pdfData.text;
          } catch (pdfError) {
            // If it's not a PDF or fails to parse, try decoding as raw text (e.g. TXT or Markdown)
            content = buffer.toString('utf-8');
            if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
              throw new Error("URL returned an HTML page (possibly a Google Drive viewer) instead of raw document data.");
            }
          }
        } catch (fetchError: any) {
          throw new Error(`Document download/parse error: ${fetchError.message}`);
        }
      }

      if (!content) {
        throw new Error("No content could be extracted from the document.");
      }
      // Sanitize text to remove null bytes (\x00) which break PostgreSQL inserts
      content = content.replace(/\0/g, '');
      
      const parsedData = {
        text: content,
        type: input.type || "unknown",
        length: content.length,
      };

      return {
        success: true,
        data: parsedData
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Parse failed" };
    }
  }
}
