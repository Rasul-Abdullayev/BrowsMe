/**
 * zipHelper.js - Pure Node.js standard ZIP file generator
 * Zero external dependencies, fast, and generates standard compliant ZIP archives.
 */
const zlib = require('zlib');

// Precomputed CRC32 table
const crcTable = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Builds a ZIP buffer from an array of files: [{ name: 'path/to/file.py', content: '...' }]
 * @param {Array<{name: string, content: string|Buffer}>} files 
 * @returns {Buffer}
 */
function createZipBuffer(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  // Format DOS time & date (now)
  const d = new Date();
  const dosTime = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;

  for (const file of files) {
    // Standardize path with forward slashes and trim leading slash
    const cleanName = (file.name || 'file.txt').replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBuf = Buffer.from(cleanName, 'utf8');
    const dataBuf = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(typeof file.content === 'string' ? file.content : '', 'utf8');

    const crc = crc32(dataBuf);
    const uncompressedSize = dataBuf.length;

    // Use raw deflate compression
    let compressedData = zlib.deflateRawSync(dataBuf);
    let compressionMethod = 8; // Deflate
    let compressedSize = compressedData.length;

    // If deflate makes it bigger (e.g. tiny 3 byte strings), store uncompressed
    if (compressedSize >= uncompressedSize) {
      compressedData = dataBuf;
      compressionMethod = 0; // Stored
      compressedSize = uncompressedSize;
    }

    // Local file header (30 bytes + nameBuf.length)
    const localHdr = Buffer.alloc(30 + nameBuf.length);
    localHdr.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHdr.writeUInt16LE(20, 4);         // Version needed: 2.0
    localHdr.writeUInt16LE(0x0800, 6);     // Flags: UTF-8 encoding (bit 11)
    localHdr.writeUInt16LE(compressionMethod, 8); // Method: Deflate or Store
    localHdr.writeUInt16LE(dosTime, 10);   // File modification time
    localHdr.writeUInt16LE(dosDate, 12);   // File modification date
    localHdr.writeUInt32LE(crc, 14);       // CRC-32
    localHdr.writeUInt32LE(compressedSize, 18);   // Compressed size
    localHdr.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHdr.writeUInt16LE(nameBuf.length, 26);   // File name length
    localHdr.writeUInt16LE(0, 28);         // Extra field length
    nameBuf.copy(localHdr, 30);

    localHeaders.push(localHdr);
    localHeaders.push(compressedData);

    // Central directory header (46 bytes + nameBuf.length)
    const centralHdr = Buffer.alloc(46 + nameBuf.length);
    centralHdr.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralHdr.writeUInt16LE(20, 4);         // Version made by: 2.0
    centralHdr.writeUInt16LE(20, 6);         // Version needed: 2.0
    centralHdr.writeUInt16LE(0x0800, 8);     // Flags: UTF-8
    centralHdr.writeUInt16LE(compressionMethod, 10);
    centralHdr.writeUInt16LE(dosTime, 12);
    centralHdr.writeUInt16LE(dosDate, 14);
    centralHdr.writeUInt32LE(crc, 16);
    centralHdr.writeUInt32LE(compressedSize, 20);
    centralHdr.writeUInt32LE(uncompressedSize, 24);
    centralHdr.writeUInt16LE(nameBuf.length, 28);
    centralHdr.writeUInt16LE(0, 30); // Extra field length
    centralHdr.writeUInt16LE(0, 32); // File comment length
    centralHdr.writeUInt16LE(0, 34); // Disk number start
    centralHdr.writeUInt16LE(0, 36); // Internal file attributes
    centralHdr.writeUInt32LE(0, 38); // External file attributes
    centralHdr.writeUInt32LE(offset, 42); // Relative offset of local header
    nameBuf.copy(centralHdr, 46);

    centralHeaders.push(centralHdr);
    offset += localHdr.length + compressedData.length;
  }

  const centralDirOffset = offset;
  const centralDirBuf = Buffer.concat(centralHeaders);
  const centralDirSize = centralDirBuf.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4);          // Disk number
  eocd.writeUInt16LE(0, 6);          // Start disk
  eocd.writeUInt16LE(files.length, 8); // Total records on disk
  eocd.writeUInt16LE(files.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
}

/**
 * Reads a ZIP buffer and returns array of extracted files: [{ name, path, type, content }]
 * @param {Buffer} buf 
 * @returns {Array<{name: string, path: string, type: 'file'|'folder', content?: string}>}
 */
function readZipBuffer(buf) {
  if (!buf || !Buffer.isBuffer(buf) || buf.length < 22) {
    throw new Error('Etibarsız ZIP faylı: Fayl çox kiçikdir və ya boşdur');
  }

  // Find End of Central Directory (EOCD) signature 0x06054b50 from end of file
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Etibarsız ZIP arxivi: EOCD strukturu tapılmadı');
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const files = [];
  let curr = cdOffset;

  for (let i = 0; i < totalEntries && curr < eocdOffset; i++) {
    if (buf.readUInt32LE(curr) !== 0x02014b50) break;

    const compressionMethod = buf.readUInt16LE(curr + 10);
    const compressedSize = buf.readUInt32LE(curr + 20);
    const uncompressedSize = buf.readUInt32LE(curr + 24);
    const fileNameLen = buf.readUInt16LE(curr + 28);
    const extraLen = buf.readUInt16LE(curr + 30);
    const commentLen = buf.readUInt16LE(curr + 32);
    const localHdrOffset = buf.readUInt32LE(curr + 42);

    const rawFileName = buf.toString('utf8', curr + 46, curr + 46 + fileNameLen);
    const normalizedPath = rawFileName.replace(/\\/g, '/').replace(/^\/+/, '');
    curr += 46 + fileNameLen + extraLen + commentLen;

    // Ignore system entries (__MACOSX, .DS_Store, thumbs.db)
    if (normalizedPath.startsWith('__MACOSX/') || normalizedPath.endsWith('.DS_Store') || normalizedPath.endsWith('Thumbs.db')) {
      continue;
    }

    // Check if entry is directory
    const isDir = normalizedPath.endsWith('/') || (compressedSize === 0 && uncompressedSize === 0 && !normalizedPath.includes('.'));
    if (isDir) {
      const cleanDir = normalizedPath.replace(/\/$/, '');
      if (cleanDir) {
        files.push({
          name: cleanDir.split('/').pop(),
          path: cleanDir,
          type: 'folder'
        });
      }
      continue;
    }

    // Read local header to locate raw data offset
    if (localHdrOffset + 30 > buf.length || buf.readUInt32LE(localHdrOffset) !== 0x04034b50) {
      continue;
    }
    const localNameLen = buf.readUInt16LE(localHdrOffset + 26);
    const localExtraLen = buf.readUInt16LE(localHdrOffset + 28);
    const dataOffset = localHdrOffset + 30 + localNameLen + localExtraLen;

    if (dataOffset + compressedSize > buf.length) {
      continue;
    }

    const compressedSlice = buf.slice(dataOffset, dataOffset + compressedSize);
    let decompressed;

    try {
      if (compressionMethod === 8) {
        decompressed = zlib.inflateRawSync(compressedSlice);
      } else if (compressionMethod === 0) {
        decompressed = compressedSlice;
      } else {
        continue; // Skip unsupported compression
      }
    } catch (e) {
      console.warn(`[zipHelper] Could not decompress ${normalizedPath}:`, e.message);
      continue;
    }

    files.push({
      name: normalizedPath.split('/').pop(),
      path: normalizedPath,
      type: 'file',
      content: decompressed.toString('utf8')
    });
  }

  return files;
}

module.exports = {
  createZipBuffer,
  readZipBuffer
};
