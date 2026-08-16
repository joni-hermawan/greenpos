import { useWindowDimensions } from 'react-native';

// Breakpoints in dp — react-native's useWindowDimensions already reports
// density-independent points, same unit React Native layout uses everywhere
// else, so these compare directly against style values like maxWidth.
const TABLET_BREAKPOINT = 700;
const WIDE_TABLET_BREAKPOINT = 1000;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const productColumns = width >= WIDE_TABLET_BREAKPOINT ? 4 : width >= TABLET_BREAKPOINT ? 3 : 2;
  return { width, height, isTablet, productColumns };
}
