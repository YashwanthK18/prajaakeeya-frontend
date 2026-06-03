// UNIT TESTS for src/utils/fileUtils.ts
// We test the pure helpers (isFileSizeValid, formatBytes). compressImage needs
// canvas/image APIs jsdom doesn't fully support, so we don't test it here.
import {
  MAX_UPLOAD_SIZE_BYTES,
  isFileSizeValid,
  formatBytes,
} from '../utils/fileUtils';

// Helper: build a fake File of a given size without allocating real bytes.
function fakeFile(sizeBytes: number, name = 'test.pdf', type = 'application/pdf'): File {
  const file = new File(['x'], name, { type });
  // size is read-only on File, so override it for the test.
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('isFileSizeValid', () => {
  it('returns false for null/undefined', () => {
    expect(isFileSizeValid(null)).toBe(false);
    expect(isFileSizeValid(undefined)).toBe(false);
  });

  it('accepts a file at or below the max', () => {
    expect(isFileSizeValid(fakeFile(MAX_UPLOAD_SIZE_BYTES))).toBe(true);
    expect(isFileSizeValid(fakeFile(1024))).toBe(true);
  });

  it('rejects a file above the max', () => {
    expect(isFileSizeValid(fakeFile(MAX_UPLOAD_SIZE_BYTES + 1))).toBe(false);
  });

  it('respects a custom max', () => {
    expect(isFileSizeValid(fakeFile(2048), 1024)).toBe(false);
    expect(isFileSizeValid(fakeFile(512), 1024)).toBe(true);
  });
});

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });
  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });
  it('rounds to 2 decimals', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});
