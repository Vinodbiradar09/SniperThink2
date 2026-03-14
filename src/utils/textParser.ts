import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import type { ProcessedFileData } from "../types/index.js";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "its",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "not",
  "no",
  "nor",
  "so",
  "yet",
  "both",
  "either",
  "neither",
  "as",
  "if",
  "then",
  "than",
  "that",
  "this",
  "these",
  "those",
  "i",
  "we",
  "you",
  "he",
  "she",
  "they",
  "my",
  "our",
  "your",
  "his",
  "her",
  "their",
]);

const extractText = async (
  filePath: string,
  mimeType: string,
): Promise<string> => {
  if (mimeType === "text/plain") {
    return fs.readFileSync(filePath, "utf-8");
  }
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  throw new Error(`unsupported file type: ${mimeType}`);
};

const countWords = (text: string) => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

const countParagraphs = (text: string): number => {
  return text.split(/\n\s*\n/).filter((para) => para.trim().length > 0).length;
};

const extractKeywords = (text: string, topN: number = 10): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] ?? 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
};

const parseFile = async (
  filePath: string,
  mimeType: string,
): Promise<ProcessedFileData> => {
  const absolutePath = path.resolve(filePath);
  const text = await extractText(absolutePath, mimeType);
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);
  const topKeywords = extractKeywords(text);
  return { wordCount, paragraphCount, topKeywords };
};

const deleteFile = (filePath: string): void => {
  try {
    const absolutePath = path.resolve(filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`deleted file: ${absolutePath}`);
    }
  } catch (err) {
    console.error(`failed to delete file: ${filePath}`, err);
  }
};

export { parseFile, deleteFile };
