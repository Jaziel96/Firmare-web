"use client";

import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Text, Card } from '@mantine/core';
import dynamic from 'next/dynamic';
import { Dropzone } from '@mantine/dropzone';
import { MIME_TYPES } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import { pdfjs } from 'react-pdf';

// Configurar el trabajador de pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

interface FileObject {
  name: string;
  // Agrega otras propiedades si es necesario
}

export default function Dashboard() {
  const [pdfFiles, setPdfFiles] = useState<FileObject[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  async function fetchPdfFiles() {
    const { data, error } = await supabase.storage.from('pdfs').list();
    if (error) {
      console.error(error);
    } else {
      setPdfFiles(data);
    }
  }

  async function handleUpload(files: File[]) {
    const file = files[0];
    const { data, error } = await supabase.storage.from('pdfs').upload(file.name, file);
    if (error) {
      showNotification({ title: 'Error', message: error.message, color: 'red' });
    } else {
      showNotification({ title: 'Success', message: 'File uploaded successfully', color: 'green' });
      fetchPdfFiles();
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
  }

  return (
    <Container>
      <Group align="apart" mb="md">
        <Title order={1}>Dashboard</Title>
        <Button onClick={handleLogout}>Sign out</Button>
      </Group>
      <Dropzone onDrop={handleUpload} accept={[MIME_TYPES.pdf]}>
        <Text style={{ textAlign: 'center' }}>Drag PDF files here or click to select files</Text>
      </Dropzone>
      <Group mt="md">
        {pdfFiles.map((file) => (
          <Card key={file.name} shadow="sm" padding="lg">
            <Text>{file.name}</Text>
            <Button onClick={() => setSelectedPdf(file.name)}>View</Button>
          </Card>
        ))}
      </Group>
      {selectedPdf && (
        <Card mt="md" shadow="sm" padding="lg">
          <Title order={2}>Viewing: {selectedPdf}</Title>
          <Document file={`${supabase.storage.from('pdfs').getPublicUrl(selectedPdf).data.publicUrl}`}>
            <Page pageNumber={1} />
          </Document>
          <Button mt="md" onClick={() => setSelectedPdf(null)}>Close</Button>
        </Card>
      )}
    </Container>
  );
}