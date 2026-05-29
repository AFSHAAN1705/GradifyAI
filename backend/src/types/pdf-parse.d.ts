declare module "pdf-parse" {
  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  };

  function pdf(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdf;
}
