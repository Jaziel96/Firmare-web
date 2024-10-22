import { Mantine } from '@/lib/mantine';

import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Mantine>{children}</Mantine>
      </body>
    </html>
  );
}