export function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
