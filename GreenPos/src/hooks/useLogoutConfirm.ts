import { useConfirmDialog } from '../context/ConfirmDialogContext';

// Shared confirm dialog for the "Keluar" action — used by both the phone
// header dropdown and the tablet sidebar so the prompt stays consistent.
export function useLogoutConfirm(logout: () => void) {
  const confirm = useConfirmDialog();
  return async () => {
    const ok = await confirm({
      title: 'Keluar',
      message: 'Yakin ingin keluar dari aplikasi?',
      confirmLabel: 'Keluar',
      destructive: true,
    });
    if (ok) logout();
  };
}
