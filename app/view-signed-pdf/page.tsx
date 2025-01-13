"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';

export default function ViewSignedPdf() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const signedPdf = localStorage.getItem('signedPdf');
    if (signedPdf) {
      setFileUrl(`data:application/pdf;base64,${signedPdf}`);
    } else {
      console.error('No se ha encontrado ningún PDF firmado en el almacenamiento local');
    }
  }, []);

  return (
    <Container>
      <Group align="apart" mb="md">
        <Title order={1}>Nombre: {fileName}</Title>
      </Group>
      <Button style={{ backgroundColor: 'gray' }} onClick={() => router.push('/dashboard')}>Regresar a Inicio</Button>
      <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7' }}>
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
          <div style={{ height: '800px' }}>
            {fileUrl ? (
              <Viewer
                fileUrl={fileUrl}
                plugins={[defaultLayoutPluginInstance]}
              />
            ) : (
              <p>Cargando PDF firmado...</p>
            )}
          </div>
        </Worker>
      </Card>
    </Container>
  );
}