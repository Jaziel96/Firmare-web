"use client";

import React, { useEffect, useState } from 'react'; // Agregamos useEffect y useState
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, Text } from '@mantine/core'; // Agregamos Text
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from "@/lib/supabase";

export default function ViewPdf() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [loading, setLoading] = useState(true); // Estado para manejar la carga

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/'); // Redirigir al inicio si no está autenticado
      } else {
        setLoading(false); // Permitir acceso si está autenticado
      }
    };
    checkAuth();
  }, [router]);

  // Mostrar carga mientras se verifica la autenticación
  if (loading) {
    return <Text>Cargando...</Text>;
  }

  const handleSign = () => {
    if (fileName && fileUrl) {
      router.push(`/sign-pdf?fileName=${fileName}&fileUrl=${encodeURIComponent(fileUrl)}`);
    } else {
      console.error('fileName or fileUrl is null');
    }
  };

  return (
    <Container>
      <Group position="apart" mb="md">
        <Title order={1}>Nombre: {fileName}</Title>
      </Group>
      <Button style={{ backgroundColor: 'gray' }} onClick={() => router.push('/dashboard')}>
        Regresar
      </Button>
      <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7' }}>
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
          <Viewer
            fileUrl={fileUrl || ''}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      </Card>
      <Button color="green" mt="md" onClick={handleSign}>Firmar</Button>
    </Container>
  );
}