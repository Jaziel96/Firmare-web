"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Button, Group, Text, Card, Table } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfFile {
  name: string;
  uploadedAt: string;
  uploadedBy: string;
  modifiedAt: string;
  signatureStatus: 'Pendiente' | 'Firmado';
}

export default function Dashboard() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const router = useRouter();

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
      const files = data.map((file) => ({
        name: file.name,
        uploadedAt: file.created_at,
        uploadedBy: file.metadata.uploadedBy,
        modifiedAt: file.metadata.modifiedAt || file.created_at,
        signatureStatus: file.metadata.signatureStatus || 'Pendiente',
      }));
      // Ordenar los archivos por fecha de creación de mayor a menor
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setPdfFiles(files);
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
  
    const { data, error } = await supabase.storage.from('pdfs').upload(file.name, file, {
      cacheControl: '3600',
      upsert: false,
      metadata: {
        uploadedBy: 'user@example.com', // Reemplaza con el usuario actual
        modifiedAt: new Date().toISOString(),
        signatureStatus: 'Pendiente',
      },
    });
  
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

  async function handleSign(fileName: string) {
    const { data, error } = await supabase.storage.from('pdfs').update(fileName, fileName, {
      cacheControl: '3600',
      upsert: true,
      metadata: {
        modifiedAt: new Date().toISOString(),
        signatureStatus: 'Firmado',
      },
    });
    if (error) {
      console.error("Sign error:", error);
      showNotification({ title: 'Error', message: error.message || 'Unknown error occurred.', color: 'red' });
    } else {
      showNotification({ title: 'Success', message: 'File signed successfully', color: 'green' });
      fetchPdfFiles(); // Refrescar la lista de archivos
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    } else {
      // Redirigir a la página de inicio después de cerrar la sesión
      router.push('/');
    }
  }

  function handleView(fileName: string) {
    const fileUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
    router.push(`/view-pdf?fileName=${fileName}&fileUrl=${encodeURIComponent(fileUrl)}`);
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
      <Table mt="md">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Uploaded At</th>
            <th>Uploaded By</th>
            <th>Modified At</th>
            <th>Signature Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pdfFiles.map((file) => (
            <tr key={file.name}>
              <td>{file.name}</td>
              <td>{new Date(file.uploadedAt).toLocaleString()}</td>
              <td>{file.uploadedBy}</td>
              <td>{new Date(file.modifiedAt).toLocaleString()}</td>
              <td>{file.signatureStatus}</td>
              <td>
                <Button onClick={() => handleView(file.name)}>View</Button>
                <Button color="red" onClick={() => handleDelete(file.name)}>Delete</Button>
                
                
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {loading && <Text>Loading...</Text>}
      {error && <Text color="red">{error}</Text>}
    </Container>
  );
}