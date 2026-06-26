import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const LOCAL_PATHS = {
  img1: 'C:\\Users\\USER\\Desktop\\AngVel\\1.png',
  img2: 'C:\\Users\\USER\\Desktop\\AngVel\\2.png',
  footer: 'C:\\Users\\USER\\Desktop\\coso\\pie de pagina.jpg',
}

function fileToDataUri(absPath: string): string {
  const fallbacks = [absPath]
  for (const p of fallbacks) {
    try {
      const buf = fs.readFileSync(p)
      const ext = path.extname(p).toLowerCase()
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch { /* try next */ }
  }
  return ''
}

function buildHtml(bodyHtml: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin-top:3.5cm;margin-bottom:2.0cm;margin-left:0;margin-right:0}
body{font-family:'Times New Roman',Times,serif;font-size:12px;color:#000;line-height:1.5;background:#fff}
.content{padding:0.5cm 0.5cm 5.5cm 0.5cm}
.content>[style*="padding"]{padding-left:0!important;padding-right:0!important}
.content table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10px}
.content table tr{page-break-inside:avoid;break-inside:avoid}
.content table th,.content table td{border:1px solid #000;padding:3px 5px;font-size:10px;vertical-align:top}
.content table th{background:#f0f0f0;font-weight:bold;text-align:center}
.content p{margin:0 0 10px 0;text-align:justify}
</style></head><body>
<div class="content">
${bodyHtml}
</div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { html, numeroActa } = await req.json()
    if (!html) {
      return NextResponse.json({ error: 'HTML requerido' }, { status: 400 })
    }

    // Read local images → base64
    const hdrLeft = fileToDataUri(LOCAL_PATHS.img1)
    const hdrRight = fileToDataUri(LOCAL_PATHS.img2)
    const ftr = fileToDataUri(LOCAL_PATHS.footer)

    const fullHtml = buildHtml(html)

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(fullHtml, { waitUntil: 'load' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;height:3.5cm;position:relative;">
${hdrLeft ? `<img src="${hdrLeft}" style="position:absolute;top:0.15cm;left:2.0cm;width:5.45cm;height:2.51cm;"/>` : ''}
${hdrRight ? `<img src="${hdrRight}" style="position:absolute;top:0.07cm;right:2.09cm;width:3.1cm;height:2.67cm;"/>` : ''}
</div>`,
      footerTemplate: `<div style="position:relative;width:100%;height:2cm;">
<img src="${ftr}" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:19.95cm;height:1.9cm;display:block;"/>
</div>`,
      margin: { top: '3.5cm', bottom: '2cm', left: '0cm', right: '0cm' },
    })

    await browser.close()

    const fileName = `Acta_${numeroActa || 'SinNumero'}.pdf`

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
