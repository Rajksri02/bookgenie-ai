const puppeteer = require('puppeteer');
const docx = require('docx');
const marked = require('marked');
const fs = require('fs');
const path = require('path');
const ExportJob = require('../models/ExportJob.model');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/exports');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate a PDF using Puppeteer
 */
const generatePDF = async (book, chapters, jobId) => {
  try {
    await ExportJob.findByIdAndUpdate(jobId, { status: 'processing' });

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.8; color: #222; margin: 0; padding: 0; text-align: justify; }
          .cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
          .cover-title { font-size: 3.5em; margin-bottom: 0.2em; }
          .cover-subtitle { font-size: 1.8em; color: #555; margin-bottom: 2em; }
          .cover-author { font-size: 1.4em; font-style: italic; }
          .chapter { page-break-before: always; break-before: page; }
          .chapter-title { text-align: center; font-size: 2.5em; margin-bottom: 1.5em; padding-top: 1em; padding-bottom: 0.5em; border-bottom: 1px solid #ddd; }
          h1, h2, h3 { color: #111; text-align: left; margin-top: 1.5em; }
          p { margin-bottom: 1.2em; text-indent: 2em; }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="cover-page">
          <h1 class="cover-title">${book.title}</h1>
          ${book.subtitle ? `<h2 class="cover-subtitle">${book.subtitle}</h2>` : ''}
          <p class="cover-author">By ${book.author || 'Unknown Author'}</p>
        </div>

        <!-- Chapters -->
        ${chapters.map((ch) => {
          let content = ch.content || ch.summary || '*No content generated yet for this chapter.*';
          // Strip leading markdown H1/H2/H3 if it's just repeating the title
          content = content.trim().replace(/^(#+)\s+[^\n]+\n*/, '');
          return `
          <div class="chapter">
            <h1 class="chapter-title">${ch.title}</h1>
            <div class="chapter-content">
              ${marked.parse(content)}
            </div>
          </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const fileName = `export_${jobId}.pdf`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>', // Empty header
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; color: #888;">
          <span class="pageNumber"></span>
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    await browser.close();

    const fileUrl = `/uploads/exports/${fileName}`;
    await ExportJob.findByIdAndUpdate(jobId, { status: 'completed', fileUrl });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    await ExportJob.findByIdAndUpdate(jobId, { status: 'failed', error: error.message });
  }
};

/**
 * Helper to parse inline markdown tokens to docx TextRuns
 */
const parseInlineTokensToRuns = (tokens, activeStyle = {}) => {
  let runs = [];
  tokens.forEach(token => {
    const style = { ...activeStyle };
    if (token.type === 'strong') style.bold = true;
    if (token.type === 'em') style.italics = true;
    
    if (token.tokens && token.tokens.length > 0) {
      runs.push(...parseInlineTokensToRuns(token.tokens, style));
    } else {
      runs.push(new docx.TextRun({ text: token.text || token.raw || '', ...style }));
    }
  });
  return runs;
};

/**
 * Helper to parse markdown into docx elements
 */
const parseMarkdownToDocx = (markdownStr) => {
  const tokens = marked.lexer(markdownStr);
  const elements = [];

  tokens.forEach(token => {
    if (token.type === 'heading') {
      elements.push(
        new docx.Paragraph({
          text: token.text,
          heading: docx.HeadingLevel['HEADING_' + Math.min(token.depth, 6)],
          spacing: { before: 240, after: 120 }
        })
      );
    } else if (token.type === 'paragraph') {
      const runs = token.tokens ? parseInlineTokensToRuns(token.tokens) : [new docx.TextRun(token.text)];
      elements.push(
        new docx.Paragraph({
          children: runs,
          spacing: { after: 120 }
        })
      );
    } else if (token.type === 'list') {
      token.items.forEach(item => {
        const runs = item.tokens ? parseInlineTokensToRuns(item.tokens) : [new docx.TextRun(item.text)];
        elements.push(
          new docx.Paragraph({
            children: runs,
            bullet: { level: 0 },
            spacing: { after: 60 }
          })
        );
      });
    } else if (token.type === 'space') {
      // ignore
    } else {
       // fallback
       elements.push(
        new docx.Paragraph({
          text: token.raw,
          spacing: { after: 120 }
        })
      );
    }
  });

  return elements;
};

/**
 * Generate a DOCX using docx package
 */
const generateDOCX = async (book, chapters, jobId) => {
  try {
    await ExportJob.findByIdAndUpdate(jobId, { status: 'processing' });

    const docChildren = [];

    // Cover Page
    docChildren.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: book.title || 'Untitled', size: 56, bold: true })
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 4000, after: 400 }
      })
    );
    if (book.subtitle) {
      docChildren.push(
        new docx.Paragraph({
          children: [
            new docx.TextRun({ text: book.subtitle, size: 36, color: '555555' })
          ],
          alignment: docx.AlignmentType.CENTER,
          spacing: { after: 2000 }
        })
      );
    }
    docChildren.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: `By ${book.author || 'Unknown Author'}`, size: 28, italics: true })
        ],
        alignment: docx.AlignmentType.CENTER,
        pageBreakBefore: false
      })
    );
    
    // Page break after cover
    docChildren.push(new docx.Paragraph({ pageBreakBefore: true }));

    // Chapters
    chapters.forEach((ch) => {
      // Page break before each chapter
      docChildren.push(
        new docx.Paragraph({
          text: ch.title,
          heading: docx.HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { before: 400, after: 200 }
        })
      );

      // Parse markdown to docx paragraphs
      let content = ch.content || ch.summary || '*No content generated yet for this chapter.*';
      content = content.trim().replace(/^(#+)\s+[^\n]+\n*/, '');
      if (content) {
        const elements = parseMarkdownToDocx(content);
        docChildren.push(...elements);
      }
    });

    const doc = new docx.Document({
      sections: [{
        properties: {
          page: {
            pageNumbers: {
              start: 1,
              formatType: docx.NumberFormat.DECIMAL,
            }
          }
        },
        headers: {
          default: new docx.Header({
            children: [
              new docx.Paragraph({
                text: book.title,
                alignment: docx.AlignmentType.RIGHT
              })
            ]
          })
        },
        footers: {
          default: new docx.Footer({
            children: [
              new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                children: [
                  new docx.TextRun("Page "),
                  new docx.TextRun({
                    children: [docx.PageNumber.CURRENT]
                  })
                ]
              })
            ]
          })
        },
        children: docChildren
      }]
    });

    const fileName = `export_${jobId}.docx`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/exports/${fileName}`;
    await ExportJob.findByIdAndUpdate(jobId, { status: 'completed', fileUrl });
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    await ExportJob.findByIdAndUpdate(jobId, { status: 'failed', error: error.message });
  }
};

module.exports = {
  generatePDF,
  generateDOCX
};
