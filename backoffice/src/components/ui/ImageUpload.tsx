'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Label } from './Input';
import { useToast } from './Toast';
import { uploadApi } from '@/lib/api';

// Browse-to-upload replaces typing a URL by hand — value still just holds
// a plain URL string underneath, so existing dummy/seed data that already
// points at an external URL displays exactly the same way, no migration
// needed. Used for both product images and merchant logos.
export function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so picking the same file again still fires onChange
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadApi.upload(file);
      onChange(url);
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengunggah gambar', description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Pratinjau" className="h-14 w-14 flex-shrink-0 rounded-lg border border-ink/10 object-contain" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-ink/15 bg-paper-dim/40 text-ink-soft">
            <Upload size={16} />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-dim disabled:opacity-50">
          {uploading ? 'Mengunggah…' : 'Browse…'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
