// Turns an uploaded resume (PDF, DOCX or TXT) into clean plain text.
// File type is decided from the file's leading bytes, not from the client-supplied mimetype.

const MAX_CHARS = 20000;
const MAX_PDF_PAGES = 10;

class ResumeParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResumeParseError';
  }
}

const detectType = (buffer) => {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return 'docx';
  if (buffer.length >= 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) return 'doc';
  if (!buffer.includes(0)) return 'txt'; // no NUL bytes: treat as text
  return 'unknown';
};

const normalise = (text) =>
  String(text)
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

exports.extractResumeText = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ResumeParseError('The uploaded file is empty.');
  }

  const type = detectType(buffer);
  let text;

  try {
    if (type === 'pdf') {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer, { max: MAX_PDF_PAGES });
      text = data.text;
    } else if (type === 'docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (type === 'txt') {
      text = buffer.toString('utf8');
    } else if (type === 'doc') {
      throw new ResumeParseError('Old .doc files are not supported. Please save as .docx or PDF.');
    } else {
      throw new ResumeParseError('Unsupported file. Upload a PDF, DOCX or TXT resume.');
    }
  } catch (error) {
    if (error instanceof ResumeParseError) throw error;
    throw new ResumeParseError('We could not read that file. Try another export, or paste your resume text instead.');
  }

  text = normalise(text || '');
  if (text.length < 50) {
    throw new ResumeParseError('No readable text found. If this is a scanned PDF, paste your resume text instead.');
  }

  return { text: text.slice(0, MAX_CHARS), type, truncated: text.length > MAX_CHARS };
};

exports.ResumeParseError = ResumeParseError;
exports.detectType = detectType;
