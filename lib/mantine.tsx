import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { ReactNode } from 'react';

const theme: MantineThemeOverride = {
  colors: {
    // Define your custom colors here
    brand: [
      '#f0f4ff',
      '#d9e2ff',
      '#b3c7ff',
      '#8daaff',
      '#668dff',
      '#3f70ff',
      '#1953ff',
      '#0036e6',
      '#0029b3',
      '#001c80',
    ],
  },
  primaryColor: 'brand',
};

interface MantineProps {
  children: ReactNode;
}

export function Mantine({ children }: MantineProps) {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  );
}