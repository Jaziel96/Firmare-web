"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, TextInput, FileInput } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';

export default function SignPdf() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const handleSign = () => {
    // Implementar la lógica de firma aquí
    console.log('Firmar con:', cerFile, keyFile, password);
  };

  return (
    <Container>
      <Group align="apart" mb="md">
        <Title order={1}>Signing: {fileName}</Title>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Group>
      <Card mt="md" shadow="sm" padding="lg">
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
          <div style={{ height: '400px' }}> {/* Ajustar la altura para que sea más pequeño */}
            <Viewer
              fileUrl={fileUrl || ''}
              plugins={[defaultLayoutPluginInstance]}
            />
          </div>
        </Worker>
      </Card>
      <Card mt="md" shadow="sm" padding="lg">
        <FileInput
          label="Upload .cer file"
          placeholder="Choose a .cer file"
          accept=".cer"
          value={cerFile}
          onChange={setCerFile}
        />
        <FileInput
          label="Upload .key file"
          placeholder="Choose a .key file"
          accept=".key"
          value={keyFile}
          onChange={setKeyFile}
        />
        <TextInput
          label="Password"
          placeholder="Enter password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        <Button mt="md" onClick={handleSign}>Sign</Button>
      </Card>
    </Container>
  );
}