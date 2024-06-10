declare module 'newman-reporter-htmlextra' {
  export default function PostmanHTMLExtraReporter(
    newman: object,
    options: { template?: string; export?: string; [key: string]: unknown },
    collectionRunOptions: object,
  ): void;
}
