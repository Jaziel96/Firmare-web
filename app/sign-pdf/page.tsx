// C:\Users\jazco\Firmare-web\app\sign-pdf\page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, TextInput, FileInput, Notification, Text, useMantineTheme } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import forge from 'node-forge';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { supabase } from "@/lib/supabase";
import Footer from '@/components/Footer';

export const dynamic = "force-dynamic";

export default function SignPdfComponent() {
  return (
    <Suspense fallback={<Text>Cargando parámetros...</Text>}>
      <SignPdfComponentContent />
    </Suspense>
  );
}

function SignPdfComponentContent() {
  const theme = useMantineTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl'); // URL firmada temporal del PDF a firmar
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  const validateCerFile = async (cerFile: File): Promise<boolean> => {
    try {
      const cerArrayBuffer = await cerFile.arrayBuffer();
      const cerPem = new TextDecoder().decode(new Uint8Array(cerArrayBuffer));
      forge.pki.certificateFromPem(cerPem);
      return true;
    } catch (error) {
      console.error('El archivo .cer no es válido:', error);
      setErrorMessage('Archivo .cer no válido. Asegúrese de que está en formato PEM.');
      return false;
    }
  };

  const handleVerifyPassword = async () => {
    if (!keyFile || !password) {
      setErrorMessage('Falta la clave o la contraseña');
      return;
    }
    try {
      const keyArrayBuffer = await keyFile.arrayBuffer();
      const keyPem = new TextDecoder().decode(keyArrayBuffer);
      const privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);
      if (privateKey) {
        setIsPasswordValid(true);
        setVerificationStatus('Contraseña válida');
        setErrorMessage('');
      } else {
        setIsPasswordValid(false);
        setVerificationStatus('');
        setErrorMessage('Contraseña invalida');
      }
    } catch (error) {
      setIsPasswordValid(false);
      setVerificationStatus('');
      setErrorMessage('Contraseña no válida o error de lectura de la clave');
    }
  };

  const generarCadenaOriginal = (datos: any) => {
    return `
      ${datos.institucion} | ${datos.nombre} | ${datos.grado} | ${datos.fecha}
      ${datos.cadenaAdicional || ''}
    `.trim();
  };

  const generarHash = async (cadenaOriginal: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(cadenaOriginal);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const firmarHash = (hash: string, clavePrivadaPem: string, password: string) => {
    const privateKey = forge.pki.decryptRsaPrivateKey(clavePrivadaPem, password);
    const firma = privateKey.sign(forge.md.sha256.create().update(hash, 'utf8'));
    return forge.util.encode64(firma);
  };

  const handleSign = async () => {
    if (!cerFile || !keyFile || !password) {
      console.error('Falta el certificado, la clave o la contraseña');
      showNotification({ title: 'Error', message: 'Falta el certificado, la clave o la contraseña.', color: 'red' });
      return;
    }
    if (!fileName) {
        showNotification({ title: 'Error', message: 'Nombre de archivo no encontrado.', color: 'red' });
        return;
    }
    if (!fileUrl) {
      showNotification({ title: 'Error', message: 'URL del archivo no encontrada.', color: 'red' });
      return;
    }

    try {
      const isValidCer = await validateCerFile(cerFile);
      if (!isValidCer) return;

      const cerArrayBuffer = await cerFile.arrayBuffer();
      const keyArrayBuffer = await keyFile.arrayBuffer();
      const keyPem = new TextDecoder().decode(keyArrayBuffer);
      const privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);

      if (!privateKey) {
        console.error('Contraseña o formato de clave no válidos');
        showNotification({ title: 'Error', message: 'Contraseña o formato de clave no válidos.', color: 'red' });
        return;
      }

      const existingPdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
      const uint8Array = new Uint8Array(existingPdfBytes);
      const header = String.fromCharCode.apply(null, Array.from(uint8Array.subarray(0, 5)));
      if (header !== '%PDF-') {
        throw new Error('El archivo no es un PDF válido');
      }
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const cerPem = new TextDecoder().decode(new Uint8Array(cerArrayBuffer));
      const cert = forge.pki.certificateFromPem(cerPem);
      const subject = cert.subject.attributes.find(attr => attr.name === 'commonName')?.value || 'Unknown';
      const currentDate = new Date().toLocaleString();
      const uuid = uuidv4(); 

      // Generar un ID único para el enlace público
      const publicId = uuidv4(); 
      
  
      // Construir la RUTA RELATIVA para public_url
      const relativePublicUrl = `/view-signed-pdf?id=${publicId}`;
      // ------------------------------------

      const datos = {
        institucion: "Universidad de Colima, Colima",
        nombre: subject,
        grado: "Facultad de Telematica",
        fecha: currentDate,
      };
      const cadenaOriginal = generarCadenaOriginal(datos);

      // Para el código QR, necesitamos la URL completa de producción
      const appProdBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appProdBaseUrl) {
          console.error("Error: NEXT_PUBLIC_APP_URL no está configurado para el código QR.");
          showNotification({
              title: "Error de Configuración",
              message: "La URL base de la aplicación no está configurada para el QR. Contacte al administrador.",
              color: "red",
          });
          
      }
      const qrCodeFullPublicUrl = appProdBaseUrl ? `${appProdBaseUrl}${relativePublicUrl}` : relativePublicUrl; // Fallback a ruta relativa si no hay URL base

      // Generar el hash de la cadena original
      const hash = await generarHash(cadenaOriginal);
      const firma = firmarHash(hash, keyPem, password);
      const qrCodeData = qrCodeFullPublicUrl;
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

      const newPage = pdfDoc.addPage();
      const { width, height } = newPage.getSize();
      const qrImageBytes = await fetch(qrCodeUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      newPage.drawImage(qrImage, { x: 50, y: height - 150, width: 100, height: 100 });
      newPage.drawText(`Firmado por: ${subject}`, { x: 50, y: height - 160, size: 10, color: rgb(0, 0, 0), maxWidth: width - 100 });
      newPage.drawText(`Fecha: ${currentDate}`, { x: 50, y: height - 170, size: 10, color: rgb(0, 0, 0), maxWidth: width - 100 });
      newPage.drawText(`UUID: ${uuid}`, { x: 50, y: height - 180, size: 10, color: rgb(0, 0, 0), maxWidth: width - 100 });
      newPage.drawText(`Cadena Original: ${cadenaOriginal}`, { x: 50, y: height - 200, size: 10, maxWidth: width - 100 });

      const splitTextIntoLines = (text: string, maxWidth: number, fontSize: number): string[] => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return [text];
        context.font = `${fontSize}px sans-serif`;
        const words = text.split('');
        const lines: string[] = [];
        let currentLine = '';
        words.forEach((char) => {
          const testLine = currentLine + char;
          const testWidth = context.measureText(testLine).width;
          if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      newPage.drawText('Firma Digital:', { x: 50, y: height - 250, size: 10, color: rgb(0, 0, 0), maxWidth: width - 100 });
      const firmaLines = splitTextIntoLines(firma, width - 100, 10);
      firmaLines.forEach((line, index) => {
        newPage.drawText(line, { x: 50, y: height - 260 - (index * 15), size: 10, color: rgb(0, 0, 0), maxWidth: width - 100 });
      });

      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, signedPdfBlob, { upsert: true });

      if (uploadError) throw new Error(`Error al subir PDF firmado: ${uploadError.message}`);

      
      const { error: updateError } = await supabase
        .from('pdf_metadata')
        .update({
          signaturestatus: 'Firmado',
          modifiedat: new Date().toISOString(),
          public_url: relativePublicUrl, // Guardar la RUTA RELATIVA
          public_id: publicId,           // Guardar el ID único
          cadena_original: cadenaOriginal // Guardar la cadena original
        })
        .eq('name', fileName);
      // ------------------------------------

      if (updateError) throw new Error(`Error al actualizar metadatos: ${updateError.message}`);

      router.push('/dashboard?firma=success'); // Redirige con parámetro de éxito
      // La notificación de éxito se maneja en el dashboard basado en el parámetro 'firma=success'

    } catch (error: any) {
      console.error('Error al firmar el PDF:', error);
      setErrorMessage(error.message || 'Error desconocido al firmar el PDF');
      showNotification({
        title: 'Error',
        message: error.message || 'Ocurrió un error al firmar el PDF',
        color: 'red',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <Container fluid style={{ padding: 0, margin: 0, maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Group position="apart" align="center" style={{ width: '100%', padding: '16px', backgroundColor: '#f0fce8' }}>
        <img src="/images/UdeC_2L izq Negro.png" alt="Logo UdeC" style={{ height: '40px', width: 'auto' }} />
        <Title order={1} style={{ fontFamily: 'Futura, sans-serif' }}>Firmare</Title>
        <Button color="red" onClick={handleLogout}>Cerrar Sesión</Button>
      </Group>
      <div style={{ flex: 1, padding: '16px' }}>
        <Group position="apart" mb="md" align="center">
          <Title order={1}>Firma: {fileName}</Title>
          <Button style={{ backgroundColor: theme.colors.myColor[1], color: theme.colors.dark[7] }} onClick={() => router.push('/dashboard')}>
            Regresar a Inicio
          </Button>
        </Group>
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7', width: '80%', margin: '0 auto' }}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
            <div style={{ height: '400px' }}>
              {fileUrl ? (
                <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
              ) : (
                <Text>Cargando PDF...</Text>
              )}
            </div>
          </Worker>
        </Card>
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7', width: '80%', margin: '0 auto' }}>
          <FileInput label="Subir archivo .cer" accept=".cer" value={cerFile} onChange={setCerFile} styles={{ input: { backgroundColor: '#f1f3f5', color: '#000' }, label: { color: '#000' } }} />
          <FileInput label="Subir archivo .key" value={keyFile} onChange={setKeyFile} styles={{ input: { backgroundColor: '#f1f3f5', color: '#000' }, label: { color: '#000' } }} />
          <TextInput label="Contraseña" placeholder="Introduzca la contraseña" type="password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} styles={{ input: { backgroundColor: '#f1f3f5', color: '#000' }, label: { color: '#000' } }} />
          <Button mt="md" style={{ backgroundColor: 'blue', color: 'white' }} onClick={handleVerifyPassword}>Verificar Contraseña</Button>
          {verificationStatus && <Notification color="green" title="Verificación" onClose={() => setVerificationStatus('')}>{verificationStatus}</Notification>}
          {errorMessage && <Notification color="red" title="Error" onClose={() => setErrorMessage('')}>{errorMessage}</Notification>}
          <Button mt="md" style={{ backgroundColor: 'green', color: 'white' }} onClick={handleSign} disabled={!isPasswordValid}>Firmar</Button>
        </Card>
      </div>
      <div style={{ width: '100%' }}><Footer /></div>
    </Container>
  );
}