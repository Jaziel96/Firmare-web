import { MantineProvider } from '@mantine/core';
import { ReactNode } from 'react';

interface MantineProps {
  children: ReactNode;
}

export function Mantine({ children }: MantineProps) {
  return (
    <MantineProvider>
      {children}
    </MantineProvider>
  );
}