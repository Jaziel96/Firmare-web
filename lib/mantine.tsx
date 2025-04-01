"use client";

import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { ReactNode, useEffect, useState } from 'react';

const theme: MantineThemeOverride = {
  colors: {
    myColor: [
      '#f0fce8',
      '#e4f6d7',
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
  primaryColor: 'myColor',
  fontFamily: 'Myriad Pro, Arial, sans-serif', // Fuente principal
  headings: {
    fontFamily: 'Futura, Arial, sans-serif', // Fuente para títulos
  },
};

interface MantineProps {
  children: ReactNode;
}

export function Mantine({ children }: MantineProps) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const matchDark = window.matchMedia('(prefers-color-scheme: dark)');
    const updateColorScheme = () => setColorScheme(matchDark.matches ? 'dark' : 'light');

    updateColorScheme();
    matchDark.addEventListener('change', updateColorScheme);
    return () => matchDark.removeEventListener('change', updateColorScheme);
  }, []);

  return (
    <MantineProvider theme={{ ...theme, colorScheme }}>
      {children}
    </MantineProvider>
  );
}
