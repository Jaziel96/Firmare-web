"use client";
import { GlobalWorkerOptions } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, Text, useMantineTheme } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import { supabase } from "@/lib/supabase";
import Footer from '@/components/Footer';
// Antes de importar pdfjsLib


export const dynamic = "force-dynamic";

// Componente padre con Suspense
export default function ViewPdf() {
  return (
    <Suspense fallback={<Text>Cargando parámetros...</Text>}>
      <ViewPdfContent />
    </Suspense>
  );
}

// Subcomponente con la lógica
function ViewPdfContent() {
  const theme = useMantineTheme();
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Ahora está dentro de Suspense
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  const handleSign = () => {
    if (fileName && fileUrl) {
      router.push(`/sign-pdf?fileName=${fileName}&fileUrl=${encodeURIComponent(fileUrl)}`);
    }
  };

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault();
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/');
  };

  return (
    <Container fluid style={{ padding: 0, margin: 0, maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Group position="apart" align="center" style={{ width: '100%', padding: '16px', backgroundColor: '#f0fce8' }}>
        <img src="/images/UdeC_2L izq Negro.png" alt="Logo UdeC" style={{ height: '40px', width: 'auto' }} />
        <Title order={1} style={{ fontFamily: 'Futura, sans-serif' }}>Firmare</Title>
        <Button color="red" onClick={handleLogout}>Cerrar Sesión</Button>
      </Group>

      {/* Contenido principal */}
      <div style={{ flex: 1, padding: '16px' }}>
        <Group position="apart" mb="md" align="center">
          <Title order={1} style={{ fontFamily: 'Futura, sans-serif' }}>Nombre: {fileName}</Title>
          <Button
            style={{ backgroundColor: theme.colors.myColor[1], color: theme.colors.dark[7] }}
            onClick={() => router.push('/dashboard')}
          >
            Regresar
          </Button>
        </Group>

        {/* Visor de PDF */}
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: theme.colors.myColor[1], width: '80%', margin: '0 auto' }}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
            <Viewer fileUrl={fileUrl || ''} plugins={[defaultLayoutPluginInstance]} />
          </Worker>
        </Card>

        {/* Botón de firmar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <Button color="green" onClick={handleSign} style={{ fontFamily: 'Myriad Pro, sans-serif' }}>
            Firmar
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ width: '100%' }}>
        <Footer />
      </div>
    </Container>
  );
}