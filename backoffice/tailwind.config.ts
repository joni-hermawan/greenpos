import type { Config } from 'tailwindcss';

// Color tokens ported directly from GreenPos/src/theme.ts (the mobile app),
// which itself was ported from demo-frontend's tailwind.config.ts — kept
// identical here so the web back-office is visually consistent with the
// GREEN POS mobile app rather than the older reference project's styling.
const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        register: '#0B3D2E',
        'register-light': '#12513D',
        leaf: '#2E9E4C',
        'leaf-light': '#57BE72',
        paper: '#FAF8F3',
        'paper-dim': '#F1EEE5',
        ink: '#1C1B18',
        'ink-soft': '#5B584E',
        alert: '#B3412C',
        'alert-light': '#E88A78',
        teal: '#1D7A73',
      },
    },
  },
  plugins: [],
};
export default config;
