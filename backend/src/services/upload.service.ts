import fs from "node:fs";
import path from "node:path";

type ParsedFileResult = {
  text: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
};

export async function parseUploadedFile(filePath: string, originalName: string): Promise<ParsedFileResult> {
  const ext = path.extname(originalName).toLowerCase();
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  let text = "";

  if (ext === ".txt") {
    text = fs.readFileSync(filePath, "utf-8");
  } else if (ext === ".pdf") {
    text = await parsePdf(filePath);
  } else {
    text = `[File uploaded: ${originalName} (${(fileSize / 1024).toFixed(1)} KB)]`;
  }

  return {
    text,
    fileName: originalName,
    fileType: ext.replace(".", ""),
    fileSize,
    filePath,
  };
}

async function parsePdf(filePath: string): Promise<string> {
  try {
    const pdfParse = require("pdf-parse");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (err) {
    console.error("[Upload] PDF parse error:", err);
    return "[PDF could not be parsed]";
  }
}
