import { NextRequest, NextResponse } from 'next/server'
import * as docx from 'docx'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, convertInchesToTwip,
  Header, Footer } = docx

const CM_TO_EMU = (cm: number) => Math.round(cm * 360000)

const LOCAL_PATHS = {
  img1: 'C:\\Users\\USER\\Desktop\\AngVel\\1.png',
  img2: 'C:\\Users\\USER\\Desktop\\AngVel\\2.png',
  footer: 'C:\\Users\\USER\\Desktop\\coso\\pie de pagina.jpg',
}

function readImageBuffer(...attempts: string[]): Buffer | null {
  for (const p of attempts) {
    try { return fs.readFileSync(p) } catch { /* try next */ }
  }
  return null
}

function parseHtmlToDocxElements(html: string) {
  const $ = cheerio.load(`<div id="root">${html}</div>`)
  const elements: any[] = []

  function processNode(el: any) {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return
    const $el = $(el)

    if (tag === 'div') {
      $el.contents().each((_: any, child: any) => processNode(child))
      return
    }

    if (tag === 'b' || tag === 'strong') {
      const t = $el.text().trim()
      if (t) elements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 276 },
          children: [new TextRun({ text: t, font: 'Times New Roman', size: 22, bold: true })],
        })
      )
      return
    }

    if (tag === 'p') {
      const text = $el.text().trim()
      if (!text) return
      const style = $el.attr('style') || ''
      const isCenter = style.includes('center')

      const runs: any[] = []
      $el.contents().each((_: any, node: any) => {
        if (node.type === 'text') {
          const t = (node.data || '').trim()
          if (t) runs.push(new TextRun({ text: t, font: 'Times New Roman', size: 22 }))
        } else if (node.tagName === 'b' || node.tagName === 'strong') {
          const t = $(node).text().trim()
          if (t) runs.push(new TextRun({ text: t, font: 'Times New Roman', size: 22, bold: true }))
        } else if (node.tagName === 'span') {
          const t = $(node).text().trim()
          if (t) runs.push(new TextRun({ text: t, font: 'Times New Roman', size: 22 }))
        }
      })

      if (runs.length === 0) {
        runs.push(new TextRun({ text, font: 'Times New Roman', size: 22 }))
      }

      elements.push(
        new Paragraph({
          alignment: isCenter ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 276 },
          children: runs,
        })
      )
      return
    }

    if (tag === 'table') {
      const rows: any[] = []
      $el.find('tr').each((_: any, tr: any) => {
        const cells: any[] = []
        $(tr).find('th, td').each((__: any, td: any) => {
          const cellText = $(td).text().trim()
          const isHeader = td.tagName === 'th'
          const colCount = $(tr).find('th, td').length
          cells.push(
            new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: cellText, font: 'Times New Roman', size: 16, bold: isHeader })],
              })],
              width: { size: 100 / colCount, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
              shading: isHeader ? { fill: 'E8E8E8' } : undefined,
            })
          )
        })
        rows.push(new TableRow({ children: cells }))
      })
      elements.push(
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
      )
      elements.push(new Paragraph({ spacing: { after: 120 } }))
    }
  }

  $('#root').contents().each((_: any, child: any) => processNode(child))
  return elements
}

export async function POST(req: NextRequest) {
  try {
    const { html, numeroActa } = await req.json()
    if (!html) {
      return NextResponse.json({ error: 'HTML requerido' }, { status: 400 })
    }

    const bodyChildren = parseHtmlToDocxElements(html)

    // --- Read local images ---
    const buf1 = readImageBuffer(LOCAL_PATHS.img1)
    const buf2 = readImageBuffer(LOCAL_PATHS.img2)
    const bufFooter = readImageBuffer(LOCAL_PATHS.footer)

    // --- BUILD HEADER: table with 2 cells (left logo · right logo) ---
    const hdrCells: any[] = []

    if (buf1) {
      hdrCells.push(
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { before: 0, after: 0 },
              children: [
                new ImageRun({
                  data: buf1,
                  transformation: { width: CM_TO_EMU(5.45), height: CM_TO_EMU(2.51) },
                } as any),
              ],
            }),
          ],
        })
      )
    }

    if (buf2) {
      hdrCells.push(
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 0, after: 0 },
              children: [
                new ImageRun({
                  data: buf2,
                  transformation: { width: CM_TO_EMU(3.1), height: CM_TO_EMU(2.67) },
                } as any),
              ],
            }),
          ],
        })
      )
    }

    const headerDef = hdrCells.length > 0
      ? new Header({
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new Table({
                  rows: [new TableRow({ children: hdrCells })],
                  width: { size: 100, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        })
      : undefined

    // --- BUILD FOOTER with pie de pagina ---
    let footerDef: any = undefined
    if (bufFooter) {
      footerDef = new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new ImageRun({
                data: bufFooter,
                transformation: { width: CM_TO_EMU(21), height: CM_TO_EMU(4.2) },
              } as any),
            ],
          }),
        ],
      })
    }

    // --- DOCUMENT ---
    const doc = new Document({
      title: `Acta ${numeroActa || ''}`,
      creator: 'Inventario FII',
      styles: {
        default: {
          document: {
            run: { font: 'Times New Roman', size: 22 },
            paragraph: { spacing: { after: 80, line: 276 } },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.9055),   // 2.3 cm
              bottom: convertInchesToTwip(0.8268), // 2.1 cm
              left: convertInchesToTwip(0.7874),   // 2.0 cm
              right: convertInchesToTwip(0.8228),  // 2.09 cm
            },
          },
          ...(headerDef ? { header: { default: headerDef } } : {}),
          ...(footerDef ? { footer: { default: footerDef } } : {}),
        },
        children: bodyChildren,
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = `Acta_${numeroActa || 'SinNumero'}.docx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
