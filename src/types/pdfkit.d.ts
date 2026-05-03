declare module "pdfkit" {
  import { Writable } from "stream";

  interface PDFKitOptions {
    margin?: number;
    size?: string | number[];
    layout?: "portrait" | "landscape";
    info?: Record<string, any>;
    compress?: boolean;
    pdfVersion?: string;
    autoFirstPage?: boolean;
  }

  interface TextOptions {
    lineBreak?: boolean;
    width?: number;
    align?: "left" | "center" | "right" | "justify";
    continued?: boolean;
    ellipsis?: boolean | string;
    paragraphGap?: number;
    strike?: boolean;
    underline?: boolean;
    oblique?: boolean;
    link?: string;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFKitOptions);
    addPage(options?: PDFKitOptions): this;
    fontSize(size: number): this;
    text(text: string, options?: TextOptions): this;
    text(text: string, x: number, y: number, options?: TextOptions): this;
    moveDown(count?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    pipe(destination: NodeJS.WritableStream): this;
    end(): void;
  }

  export default PDFDocument;
}
