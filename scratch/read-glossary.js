import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// docx is a zip file - read word/document.xml
import { unzipSync } from 'zlib';

// Use built-in Node to unzip
const buf = readFileSync('C:/Users/pecul/OneDrive/Documents/Ascendance WebApp/Glossary.docx');

// Manually parse ZIP to find word/document.xml
function findZipEntry(buf, filename) {
  // Search for local file headers (PK\x03\x04)
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf[offset] === 0x50 && buf[offset+1] === 0x4B && buf[offset+2] === 0x03 && buf[offset+3] === 0x04) {
      const compMethod = buf.readUInt16LE(offset + 8);
      const compSize = buf.readUInt32LE(offset + 18);
      const uncompSize = buf.readUInt32LE(offset + 22);
      const fnLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const fn = buf.slice(offset + 30, offset + 30 + fnLen).toString('utf8');
      const dataOffset = offset + 30 + fnLen + extraLen;
      
      if (fn === filename) {
        const compData = buf.slice(dataOffset, dataOffset + compSize);
        if (compMethod === 0) return compData; // stored
        if (compMethod === 8) {
          // deflate - need to use zlib with raw deflate
          const { inflateRawSync } = require('zlib');
          return inflateRawSync(compData);
        }
      }
      offset = dataOffset + compSize;
    } else {
      offset++;
    }
  }
  return null;
}

const xmlBuf = findZipEntry(buf, 'word/document.xml');
if (!xmlBuf) {
  console.error('Could not find word/document.xml in the docx');
  process.exit(1);
}

const xml = xmlBuf.toString('utf8');

// Extract text runs: <w:t>...</w:t>
const terms = [];
const matches = xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
const texts = [];
for (const m of matches) {
  texts.push(m[1]);
}
console.log(texts.join(''));
