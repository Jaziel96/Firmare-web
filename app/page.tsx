// C:\Users\jazco\Firmare-web\app\page.tsx
"use client";

import { Container, Title, Text, Paper, Space, Center } from '@mantine/core'; // Añadir Paper, Space, Center
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const ImageSlider = dynamic(() => import('@/components/ImageSlider'), { ssr: false });

const Page = () => {
  return (
    // Usar un flex container para empujar el Footer hacia abajo si el contenido es corto
    <Container fluid p={0} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />
      <ImageSlider />

      {/* Sección de bienvenida y descripción */}
      <Container size="md" py="xl"> {/* py="xl" añade padding vertical */}
        <Paper shadow="xs" p="xl" withBorder radius="md" style={{ backgroundColor: '#f8f9fa' }}>
          <Center>
            <Title order={2} align="center" mb="lg" style={{ fontFamily: 'Futura, sans-serif', color: '#333' }}>
              Bienvenido a Firmare
            </Title>
          </Center>
          <Text size="lg" align="center" mb="md" style={{ color: '#555', lineHeight: 1.6 }}>
            En Firmare, simplificamos la gestión y firma electrónica de tus documentos PDF.
            Nuestra plataforma te permite subir, visualizar y firmar digitalmente tus archivos,
            utilizando Certificados validos X.509.
            
          </Text>
          <Text size="lg" align="center" style={{ color: '#555', lineHeight: 1.6 }}>
            Genera enlaces públicos para compartir tus documentos firmados o mantenlos privados
            en tu dashboard personal. ¡Optimiza tus procesos y di adiós al papel!
          </Text>
        </Paper>
      </Container>
      
      {/* Empujar el Footer hacia abajo */}
      <div style={{ flexGrow: 1 }}></div> 
      <Footer />
    </Container>
  );
}

export default Page;