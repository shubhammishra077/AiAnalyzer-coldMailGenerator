const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mockPackage, load } = require('./helpers');

const calls = { pdf: [], docx: [] };
mockPackage('pdf-parse/lib/pdf-parse.js', async (buffer, opts) => {
  calls.pdf.push(opts);
  return { text: buffer.toString('latin1').replace('%PDF-', '') };
});
mockPackage('mammoth', {
  extractRawText: async ({ buffer }) => {
    calls.docx.push(buffer.length);
    if (buffer.includes(Buffer.from('CORRUPT'))) throw new Error('bad zip');
    return { value: 'Docx resume text. '.repeat(10) };
  },
});

const { extractResumeText, detectType, ResumeParseError } = load('utils/resumeParser');

const longText = 'Senior engineer with experience in Node.js and MongoDB. '.repeat(5);

describe('detectType (by magic bytes, not by filename)', () => {
  it('identifies pdf, docx, legacy doc, text and binary', () => {
    assert.equal(detectType(Buffer.from('%PDF-1.7 ...')), 'pdf');
    assert.equal(detectType(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00])), 'docx');
    assert.equal(detectType(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x00])), 'doc');
    assert.equal(detectType(Buffer.from('plain text resume')), 'txt');
    assert.equal(detectType(Buffer.from([0x89, 0x00, 0x01, 0x02])), 'unknown');
  });
});

describe('extractResumeText', () => {
  it('reads plain text and normalises whitespace', async () => {
    const messy = `Line one   \r\n\r\n\r\n\r\nLine two\n${longText}`;
    const { text, type } = await extractResumeText(Buffer.from(messy));
    assert.equal(type, 'txt');
    assert.doesNotMatch(text, /\n{3,}/);
    assert.doesNotMatch(text, /\r/);
  });

  it('routes PDFs to pdf-parse with a page cap', async () => {
    const { text, type } = await extractResumeText(Buffer.from(`%PDF-${longText}`));
    assert.equal(type, 'pdf');
    assert.match(text, /Node\.js/);
    assert.equal(calls.pdf.at(-1).max, 10);
  });

  it('routes DOCX to mammoth', async () => {
    const { type } = await extractResumeText(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('word/document.xml')]));
    assert.equal(type, 'docx');
  });

  it('turns parser crashes into a friendly error', async () => {
    const corrupt = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('CORRUPT')]);
    await assert.rejects(extractResumeText(corrupt), (e) => e instanceof ResumeParseError && /could not read/i.test(e.message));
  });

  it('rejects legacy .doc, binaries and empty uploads', async () => {
    await assert.rejects(extractResumeText(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x01])), /\.docx or PDF/);
    await assert.rejects(extractResumeText(Buffer.from([0x89, 0x00, 0x01])), ResumeParseError);
    await assert.rejects(extractResumeText(Buffer.alloc(0)), /empty/);
  });

  it('explains scanned PDFs (no selectable text)', async () => {
    await assert.rejects(extractResumeText(Buffer.from('%PDF-   ')), /scanned/i);
  });

  it('caps very long text and flags it', async () => {
    const { text, truncated } = await extractResumeText(Buffer.from('word '.repeat(10000)));
    assert.equal(text.length, 20000);
    assert.equal(truncated, true);
  });
});
