import { useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

interface Props {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

// Renders a real scannable QR code as a grid of Views — no native
// dependency (qrcode-generator is pure JS, just computes the module
// matrix), so no rebuild is needed to pick it up.
export function QRCodeView({ value, size = 160, bgColor = '#FFFFFF', fgColor = '#111111' }: Props) {
  const modules = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const cells: boolean[][] = [];
    for (let row = 0; row < count; row++) {
      const rowCells: boolean[] = [];
      for (let col = 0; col < count; col++) {
        rowCells.push(qr.isDark(row, col));
      }
      cells.push(rowCells);
    }
    return cells;
  }, [value]);

  const cellSize = size / modules.length;

  return (
    <View style={{ width: size, height: size, backgroundColor: bgColor }}>
      {modules.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: dark ? fgColor : bgColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
