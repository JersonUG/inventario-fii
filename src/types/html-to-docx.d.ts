declare module 'html-to-docx' {
  export default function htmlToDocx(
    html: string,
    headerFooter?: any,
    options?: { table?: { row?: { repeatHeader?: boolean } }; footer?: boolean; pageNumber?: boolean }
  ): Promise<Buffer>
}
