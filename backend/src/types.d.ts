/// <reference types="node" />

declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toString(text: string, options?: any): Promise<string>;
}

declare module 'otp-generator' {
  export function generate(length: number, options?: any): string;
}

declare module 'nodemailer' {
  export function createTransport(options?: any): any;
}

declare module 'multer' {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
}