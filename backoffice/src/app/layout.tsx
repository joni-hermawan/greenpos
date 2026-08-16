import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { MerchantScopeProvider } from '@/lib/MerchantScopeContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'GREEN POS Back-Office',
  description: 'Pengaturan merchant, store, produk, promo, dan pembayaran GREEN POS.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            <MerchantScopeProvider>{children}</MerchantScopeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
