import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { ConfirmDialog, ConfirmOptions } from '../components/ConfirmDialog';

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(opts => {
    setOptions(opts);
    setVisible(true);
    return new Promise(resolve => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    setVisible(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        visible={visible}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        destructive={options.destructive}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  return useContext(ConfirmContext);
}
