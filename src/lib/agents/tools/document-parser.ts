import { Tool, ToolResult } from "../core/interfaces";

export class DocumentParserTool implements Tool {
  name = "DocumentParserTool";

  async execute(input: { fileUrl?: string; rawContent?: string; type?: string }): Promise<ToolResult> {
    try {
      let content = input.rawContent;

      if (!content && input.fileUrl) {
        try {
          // Attempt to download the file
          const response = await fetch(input.fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Try parsing as PDF
          try {
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = (pdfParseModule as any).default || pdfParseModule;
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
