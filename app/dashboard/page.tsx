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

function normalizeFileName(fileName: string): string {
  const uniqueId = Date.now(); // Agregar un identificador único
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Eliminar la extensión
    .concat(`_${uniqueId}.pdf`); // Agregar el identificador único y la extensión
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
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.storage.from('pdfs').list();

    if (error) {
      setError(error.message);
      console.error(error);
    } else {
      const files = data.map((file) => ({
        name: file.name,
        uploadedAt: file.created_at,
        uploadedBy: file.metadata?.uploadedBy || 'unknown',
        modifiedAt: file.metadata?.modifiedAt || file.created_at,
        signatureStatus: file.metadata?.signatureStatus || 'Pendiente',
      }));

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
    
    // Normalizar el nombre del archivo
    const normalizedFileName = normalizeFileName(file.name);

    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    if (authError || !user) {
      console.error("Auth error:", authError);
      showNotification({ title: 'Error', message: 'User not authenticated.', color: 'red' });
      return;
    }
  
    // Subir el archivo con el nombre normalizado
    const { data, error } = await supabase.storage.from('pdfs').upload(normalizedFileName, file, {
      cacheControl: '3600',
      upsert: false,
      metadata: {
        uploadedBy: user.email || 'unknown',
        modifiedAt: new Date().toISOString(),
        signatureStatus: 'Pendiente',
        owner: user.id,
      },
    });
  
    if (error) {
      console.error("Upload error details:", JSON.stringify(error, null, 2)); // Registrar el error completo
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
      fetchPdfFiles();
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
      fetchPdfFiles();
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    } else {
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
            backgroundColor: '#e4f6d7',
            border: `2px dashed ${theme.colors.blue[6]}`,
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: '#000',
            '&:hover': {
              backgroundColor: '#f1f3f5',
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
                <Button onClick={() => handleView(file.name)}>Ver</Button>
                <Button color="red" onClick={() => handleDelete(file.name)}>Borrar</Button>
                <Button color="green" onClick={() => handleSign(file.name)}>Firmar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {loading && <Text>Cargando...</Text>}
      {error && <Text color="red">{error}</Text>}
    </Container>
  );
}