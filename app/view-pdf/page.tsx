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
      <Group align="apart" mb="md">
        <Title order={1}>Viewing: {fileName}</Title>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Group>
      <Card mt="md" shadow="sm" padding="lg">
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
          <Viewer
            fileUrl={fileUrl || ''}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      </Card>
      <Button mt="md" onClick={handleSign}>Sign</Button>
    </Container>
  );
}