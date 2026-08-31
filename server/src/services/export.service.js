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
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
          .cover-title { font-size: 3em; margin-bottom: 0.2em; }
          .cover-subtitle { font-size: 1.5em; color: #666; margin-bottom: 2em; }
          .cover-author { font-size: 1.2em; font-style: italic; }
          .toc { page-break-after: always; }
          .toc h1 { text-align: center; }
          .toc-item { display: flex; justify-content: space-between; margin-bottom: 0.5em; }
          .chapter { page-break-before: always; }
          .chapter-title { text-align: center; font-size: 2.5em; margin-bottom: 1em; padding-top: 2em;}
          h1, h2, h3 { color: #111; }
          p { margin-bottom: 1em; text-indent: 1.5em; }
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
          let content = ch.content || '';
          // Strip leading markdown H1 if it matches the chapter title or is the first line
          content = content.replace(/^#\s+[^\n]+\n+/, '');
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
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

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
      // Basic inline parsing for bold/italic (simplified)
      // A robust implementation would use marked inline lexer here.
      // For simplicity in this demo, we treat paragraph as plain text if it lacks markdown formatting,
      // or we can just pass raw text. We'll just pass raw text for demo purposes to avoid complex AST traversal.
      elements.push(
        new docx.Paragraph({
          text: token.text,
          spacing: { after: 120 }
        })
      );
    } else if (token.type === 'list') {
      token.items.forEach(item => {
        elements.push(
          new docx.Paragraph({
            text: item.text,
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
        text: book.title,
        heading: docx.HeadingLevel.TITLE,
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 4000, after: 400 }
      })
    );
    if (book.subtitle) {
      docChildren.push(
        new docx.Paragraph({
          text: book.subtitle,
          heading: docx.HeadingLevel.HEADING_2,
          alignment: docx.AlignmentType.CENTER,
          spacing: { after: 2000 }
        })
      );
    }
    docChildren.push(
      new docx.Paragraph({
        text: `By ${book.author || 'Unknown Author'}`,
        alignment: docx.AlignmentType.CENTER,
        pageBreakBefore: false
      })
    );
    
    // Page break after cover
    docChildren.push(new docx.Paragraph({ pageBreakBefore: true }));

    // Table of Contents
    docChildren.push(
      new docx.Paragraph({
        text: "Table of Contents",
        heading: docx.HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );
    docChildren.push(
      new docx.TableOfContents("Summary", {
        hyperlink: true,
        headingStyleRange: "1-3",
      })
    );

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
      if (ch.content) {
        const elements = parseMarkdownToDocx(ch.content);
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
