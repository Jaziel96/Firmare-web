"use client";

import React, { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Text, Card } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';

export default function Dashboard() {
  const [pdfFiles, setPdfFiles] = useState<{ name: string }[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  async function fetchPdfFiles() {
    setLoading(true);
    const { data, error } = await supabase.storage.from('pdfs').list();
    if (error) {
      setError(error.message);
      console.error(error);
    } else {
      setPdfFiles(data);
    }
    setLoading(false);
  }

  async function handleUpload(files: File[]) {
    const file = files[0];
  
    if (!file || file.size === 0) {
      console.error("No file selected or file is empty.");
      showNotification({ title: 'Error', message: 'No file selected or file is empty.', color: 'red' });
      return;
    }
  
    console.log("Uploading file:", file);
  
    const { data, error } = await supabase.storage.from('pdfs').upload(file.name, file);
  
    if (error) {
      console.error("Upload error:", error); // Log el error
      console.error("Error details:", JSON.stringify(error)); // Agregar más detalles del error
      showNotification({ title: 'Error', message: error.message || 'Unknown error occurred.', color: 'red' });
    } else {
      showNotification({ title: 'Success', message: 'File uploaded successfully', color: 'green' });
      fetchPdfFiles(); // Refrescar la lista de archivos
    }
  }

  async function handleDelete(fileName: string) {
    const { error } = await supabase.storage.from('pdfs').remove([fileName]);
    if (error) {
      console.error("Delete error:", error);
      showNotification({ title: 'Error', message: error.message || 'Unknown error occurred.', color: 'red' });
    } else {
      showNotification({ title: 'Success', message: 'File deleted successfully', color: 'green' });
      fetchPdfFiles(); // Refrescar la lista de archivos
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
            <Group>
              <Button onClick={() => setSelectedPdf(file.name)}>View</Button>
              <Button color="red" onClick={() => handleDelete(file.name)}>Delete</Button>
            </Group>
          </Card>
        ))}
      </Group>
      {loading && <Text>Loading...</Text>}
      {error && <Text color="red">{error}</Text>}
      {selectedPdf && (
        <Card mt="md" shadow="sm" padding="lg">
          <Title order={2}>Viewing: {selectedPdf}</Title>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
            <Viewer
              fileUrl={`${supabase.storage.from('pdfs').getPublicUrl(selectedPdf).data.publicUrl}`}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
          <Button mt="md" onClick={() => setSelectedPdf(null)}>Close</Button>
        </Card>
      )}
    </Container>
  );
}