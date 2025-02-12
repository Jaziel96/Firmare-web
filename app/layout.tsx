import { Mantine } from '@/lib/mantine';
import '../styles/fonts.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'FuturaBT, Arial, sans-serif' }}>
        <Mantine>{children}</Mantine>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </body>
    </html>
  );
}
