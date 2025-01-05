import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { ReactNode } from 'react';



interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <MantineProvider >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}