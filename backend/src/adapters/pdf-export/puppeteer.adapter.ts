import puppeteer from 'puppeteer-core';
import type { PdfExportAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

function findChromePath(): string {
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  const chromePath = process.env['CHROME_PATH'];
  if (chromePath) return chromePath;

  return candidates[0]!;
}

export function createPuppeteerAdapter(): PdfExportAdapter {
  return {
    async generateFromHtml(html) {
      let browser;
      try {
        browser = await puppeteer.launch({
          executablePath: findChromePath(),
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
          headless: true,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
          printBackground: true,
        });

        return Buffer.from(pdfBuffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError(`PDF generation failed: ${message}`, 500, 'PDF_EXPORT_ERROR');
      } finally {
        if (browser) await browser.close();
      }
    },
  };
}
