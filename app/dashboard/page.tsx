"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Button, Group, Text, Table } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { supabase } from '@/lib/supabase';

interface PdfFile {
  name: string;
  uploadedAt: string;
  uploadedBy: string;
  modifiedAt: string;
  signatureStatus: 'Pendiente' | 'Firmado';
}

export default function Dashboard() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      <Group position="apart" mb="md">
        <Title order={1}>Firmare</Title>
        <Button color="red" onClick={handleLogout}>Cerrar Sesión</Button>
      </Group>
      <Dropzone
        onDrop={handleUpload}
        accept={[MIME_TYPES.pdf]}
        styles={(theme) => ({
          root: {
            backgroundColor: '#e4f6d7', // Segundo color de myColor
            border: `2px dashed ${theme.colors.blue[6]}`,
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: '#000', // Color de las letras en negro
            '&:hover': {
              backgroundColor: '#f1f3f5', // Color de fondo al pasar el mouse
            },
          },
        })}
      >
        <Text style={{ textAlign: 'center', color: '#000' }}>Arrastra el PDF aqui o has click aqui para seleccionar el PDF</Text>
      </Dropzone>
      <Table mt="md" highlightOnHover withBorder withColumnBorders>
        <thead style={{ backgroundColor: '#e4f6d7', color: '#000' }}>
          <tr>
            <th style={{ borderColor: '#000', color: '#000' }}>Nombre</th>
            <th style={{ borderColor: '#000', color: '#000' }}>Fecha de Creacion</th>
            <th style={{ borderColor: '#000', color: '#000' }}>Creado por</th>
            <th style={{ borderColor: '#000', color: '#000' }}>Fecha de Modificaicon</th>
            <th style={{ borderColor: '#000', color: '#000' }}>Estado de Firma</th>
            <th style={{ borderColor: '#000', color: '#000' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pdfFiles.map((file) => (
            <tr
              key={file.name}
              style={{ borderColor: '#000', color: '#000' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4f6d7', e.currentTarget.style.color = '#000')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '', e.currentTarget.style.color = '#000')}
            >
              <td style={{ borderColor: '#000', color: '#000' }}>{file.name}</td>
              <td style={{ borderColor: '#000', color: '#000' }}>{new Date(file.uploadedAt).toLocaleString()}</td>
              <td style={{ borderColor: '#000', color: '#000' }}>{file.uploadedBy}</td>
              <td style={{ borderColor: '#000', color: '#000' }}>{new Date(file.modifiedAt).toLocaleString()}</td>
              <td style={{ borderColor: '#000', color: '#000' }}>{file.signatureStatus}</td>
              <td style={{ borderColor: '#000', color: '#000' }}>
                <Button onClick={() => handleView(file.name)}>View</Button>
                <Button color="red" onClick={() => handleDelete(file.name)}>Delete</Button>
                <Button color="green" onClick={() => handleSign(file.name)}>Sign</Button>
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