declare module 'qrcode' {
  export interface QRCodeToBufferOptions {
    errorCorrectionLevel?: string;
    type?: string;
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toBuffer(
    text: string,
    options?: QRCodeToBufferOptions,
  ): Promise<Buffer>;
}
