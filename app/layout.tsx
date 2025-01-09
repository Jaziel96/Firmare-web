import { Mantine } from '@/lib/mantine';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Mantine>{children}</Mantine>
      </body>
    </html>
  );
}
