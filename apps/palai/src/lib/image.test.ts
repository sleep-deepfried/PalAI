import { describe, it, expect } from 'vitest';
import { validateImageFile } from './image';

describe('Image Validation', () => {
  it('should accept valid image files', () => {
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB

    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  it('should reject files over 10MB', () => {
    const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('should reject invalid file types', () => {
    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(invalidFile, 'size', { value: 1024 });

    const result = validateImageFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('file type');
  });
});
