import {
  DocumentChunk,
  ChunkingOptions,
  DEFAULT_CHUNKING_OPTIONS,
  ProcessingError,
  isProcessingError,
  createProcessingError,
} from "@/lib/types/document-processing";

export class DocumentChunkingService {
  private options: ChunkingOptions;

  constructor(options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS) {
    this.options = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  }

  async chunkDocument(
    text: string,
    options?: Partial<ChunkingOptions>
  ): Promise<DocumentChunk[]> {
    const chunkingOptions = { ...this.options, ...options };

    try {
      if (!text || text.trim().length === 0) {
        throw this.createError("EMPTY_TEXT", "Cannot chunk empty text");
      }

      // Normalize text
      const normalizedText = this.normalizeText(text);

      // Split into semantic units first
      const semanticUnits = this.splitIntoSemanticUnits(normalizedText);

      // Create chunks while respecting semantic boundaries
      const chunks = this.createChunks(semanticUnits, chunkingOptions);

      return chunks;
    } catch (error) {
      if (isProcessingError(error)) {
        throw error;
      }

      throw this.createError(
        "CHUNKING_FAILED",
        `Failed to chunk document: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  private normalizeText(text: string): string {
    // Remove excessive whitespace while preserving paragraph breaks
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines to 2
      .replace(/[ \t]+/g, " ") // Normalize spaces and tabs
      .trim();
  }

  private splitIntoSemanticUnits(text: string): SemanticUnit[] {
    const units: SemanticUnit[] = [];
    let position = 0;

    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/);

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) continue;

      const trimmedParagraph = paragraph.trim();
      const semanticType = this.detectSemanticType(trimmedParagraph);

      // For very long paragraphs, split into sentences
      if (
        semanticType === "paragraph" &&
        this.estimateTokenCount(trimmedParagraph) > this.options.maxTokens
      ) {
        const sentences = this.splitIntoSentences(trimmedParagraph);

        for (const sentence of sentences) {
          if (sentence.trim().length === 0) continue;

          units.push({
            content: sentence.trim(),
            type: "paragraph",
            startPosition: position,
            endPosition: position + sentence.length,
            tokenCount: this.estimateTokenCount(sentence.trim()),
          });

          position += sentence.length;
        }
      } else {
        units.push({
          content: trimmedParagraph,
          type: semanticType,
          startPosition: position,
          endPosition: position + trimmedParagraph.length,
          tokenCount: this.estimateTokenCount(trimmedParagraph),
        });

        position += trimmedParagraph.length + 2; // +2 for the paragraph break
      }
    }

    return units;
  }

  private detectSemanticType(
    text: string
  ): "paragraph" | "heading" | "list" | "table" | "other" {
    const trimmed = text.trim();

    // Detect headings (common patterns)
    if (this.isHeading(trimmed)) {
      return "heading";
    }

    // Detect lists
    if (this.isList(trimmed)) {
      return "list";
    }

    // Detect tables (basic pattern detection)
    if (this.isTable(trimmed)) {
      return "table";
    }

    return "paragraph";
  }

  private isHeading(text: string): boolean {
    // Common heading patterns
    const headingPatterns = [
      /^#{1,6}\s+/, // Markdown headers
      /^[A-Z][A-Z\s]{2,}$/, // ALL CAPS short lines
      /^\d+\.?\s+[A-Z]/, // Numbered headings
      /^[A-Z][^.!?]*$/, // Short lines starting with capital, no punctuation
    ];

    return (
      headingPatterns.some((pattern) => pattern.test(text)) && text.length < 100
    );
  }

  private isList(text: string): boolean {
    const listPatterns = [
      /^[-*+]\s+/, // Bullet points
      /^\d+\.\s+/, // Numbered lists
      /^[a-z]\.\s+/i, // Letter lists
      /^•\s+/, // Unicode bullets
      /^\([a-z0-9]+\)\s+/i, // Parenthetical lists
    ];

    const lines = text.split("\n");
    if (lines.length === 1) {
      return listPatterns.some((pattern) => pattern.test(text));
    }

    // Check if multiple lines follow list patterns
    const listLines = lines.filter((line) =>
      listPatterns.some((pattern) => pattern.test(line.trim()))
    );

    return listLines.length >= 2 && listLines.length === lines.length;
  }

  private isTable(text: string): boolean {
    const lines = text.split("\n").filter((line) => line.trim());

    // Look for table-like patterns (pipes, consistent separators)
    if (lines.some((line) => line.includes("|"))) {
      return lines.filter((line) => line.includes("|")).length >= 2;
    }

    // Look for consistent column alignment (tabs or multiple spaces)
    if (lines.length >= 2) {
      const tabPattern = lines.every((line) => line.includes("\t"));
      const spacePattern = lines.every((line) => /\s{3,}/.test(line));

      return tabPattern || spacePattern;
    }

    return false;
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that handles common abbreviations
    const abbreviations = [
      "Dr",
      "Prof",
      "Mr",
      "Mrs",
      "Ms",
      "vs",
      "etc",
      "e.g",
      "i.e",
      "Inc",
      "Ltd",
      "Co",
    ];
    const abbreviationPattern = new RegExp(
      `\\b(${abbreviations.join("|")})\\.`,
      "gi"
    );

    // Replace abbreviations temporarily
    const processedText = text.replace(
      abbreviationPattern,
      (_match, abbr) => `${abbr}<!DOT!>`
    );

    // Split on sentence endings
    const sentences = processedText
      .split(/[.!?]+\s+/)
      .map((sentence) => sentence.replace(/<!DOT!>/g, "."))
      .filter((sentence) => sentence.trim().length > 0);

    return sentences;
  }

  private createChunks(
    semanticUnits: SemanticUnit[],
    options: ChunkingOptions
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let currentChunk: SemanticUnit[] = [];
    let currentTokenCount = 0;
    let chunkIndex = 0;

    for (const unit of semanticUnits) {
      const unitTokenCount = unit.tokenCount;

      // If adding this unit would exceed max tokens and we have content
      if (
        currentTokenCount + unitTokenCount > options.maxTokens &&
        currentChunk.length > 0
      ) {
        // Create chunk from current content
        chunks.push(this.buildChunk(currentChunk, chunkIndex));
        chunkIndex++;

        // Start new chunk
        if (options.overlapTokens > 0) {
          // Add overlap from previous chunk
          currentChunk = this.createOverlap(
            currentChunk,
            options.overlapTokens
          );
          currentTokenCount = currentChunk.reduce(
            (sum, u) => sum + u.tokenCount,
            0
          );
        } else {
          currentChunk = [];
          currentTokenCount = 0;
        }
      }

      // If single unit exceeds max tokens, split it further
      if (unitTokenCount > options.maxTokens) {
        const splitUnits = this.splitLargeUnit(unit, options.maxTokens);

        for (const splitUnit of splitUnits) {
          if (
            currentTokenCount + splitUnit.tokenCount > options.maxTokens &&
            currentChunk.length > 0
          ) {
            chunks.push(this.buildChunk(currentChunk, chunkIndex));
            chunkIndex++;
            currentChunk = [];
            currentTokenCount = 0;
          }

          currentChunk.push(splitUnit);
          currentTokenCount += splitUnit.tokenCount;
        }
      } else {
        currentChunk.push(unit);
        currentTokenCount += unitTokenCount;
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.length > 0) {
      chunks.push(this.buildChunk(currentChunk, chunkIndex));
    }

    // Filter out chunks that are too small
    return chunks.filter(
      (chunk) => chunk.tokenCount >= options.minChunkSize || chunks.length === 1
    );
  }

  private createOverlap(
    units: SemanticUnit[],
    overlapTokens: number
  ): SemanticUnit[] {
    const overlap: SemanticUnit[] = [];
    let tokenCount = 0;

    // Take units from the end until we have enough overlap tokens
    for (let i = units.length - 1; i >= 0 && tokenCount < overlapTokens; i--) {
      overlap.unshift(units[i]);
      tokenCount += units[i].tokenCount;
    }

    return overlap;
  }

  private splitLargeUnit(
    unit: SemanticUnit,
    maxTokens: number
  ): SemanticUnit[] {
    const sentences = this.splitIntoSentences(unit.content);
    const splitUnits: SemanticUnit[] = [];

    let currentContent = "";
    let currentTokens = 0;
    let startPos = unit.startPosition;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokenCount(sentence);

      if (currentTokens + sentenceTokens > maxTokens && currentContent) {
        splitUnits.push({
          content: currentContent.trim(),
          type: unit.type,
          startPosition: startPos,
          endPosition: startPos + currentContent.length,
          tokenCount: currentTokens,
        });

        startPos += currentContent.length;
        currentContent = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentContent += (currentContent ? " " : "") + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentContent) {
      splitUnits.push({
        content: currentContent.trim(),
        type: unit.type,
        startPosition: startPos,
        endPosition: startPos + currentContent.length,
        tokenCount: currentTokens,
      });
    }

    return splitUnits;
  }

  private buildChunk(units: SemanticUnit[], index: number): DocumentChunk {
    const content = units.map((unit) => unit.content).join("\n\n");
    const tokenCount = units.reduce((sum, unit) => sum + unit.tokenCount, 0);
    const startPosition = units[0]?.startPosition || 0;
    const endPosition = units[units.length - 1]?.endPosition || 0;

    // Determine primary semantic type (most common)
    const typeCounts = units.reduce((acc, unit) => {
      acc[unit.type] = (acc[unit.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryType = Object.entries(typeCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as "paragraph" | "heading" | "list" | "table" | "other";

    return {
      index,
      content: content.trim(),
      tokenCount,
      startPosition,
      endPosition,
      semanticType: primaryType,
      metadata: {
        unitCount: units.length,
        types: typeCounts,
      },
    };
  }

  private estimateTokenCount(text: string): number {
    // More sophisticated token estimation
    // Note: This is still an approximation. For production use, consider:
    // - Using an actual tokenizer like tiktoken for OpenAI models
    // - Different ratios for different content types or languages
    // - Caching token counts for repeated text

    if (!text || text.length === 0) return 0;

    // Base estimation using word count and character adjustments
    const words = text.trim().split(/\s+/).length;

    // Estimate tokens based on multiple factors:
    // - Average English word ≈ 1.3 tokens
    // - Add extra tokens for punctuation and special characters
    const punctuationCount = (text.match(/[.!?,:;()[\]{}'"]/g) || []).length;
    const specialCharCount = (text.match(/[^\w\s.!?,:;()[\]{}'"]/g) || [])
      .length;

    // Baseline: words * 1.3, plus penalties for complexity
    const baseTokens = words * 1.3;
    const punctuationTokens = punctuationCount * 0.2;
    const specialTokens = specialCharCount * 0.3;

    return Math.ceil(baseTokens + punctuationTokens + specialTokens);
  }

  private createError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ProcessingError {
    return createProcessingError(code, message, details, false);
  }
}

interface SemanticUnit {
  content: string;
  type: "paragraph" | "heading" | "list" | "table" | "other";
  startPosition: number;
  endPosition: number;
  tokenCount: number;
}
