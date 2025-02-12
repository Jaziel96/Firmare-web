"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';

export default function ViewPdf() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

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
      <Button
          style={{ backgroundColor: 'gray' }} // Cuarto color de myColor
          onClick={() => router.push('/dashboard')}
        >
          Regresar
        </Button>
      <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7' }}> {/* Segundo color de myColor */}
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