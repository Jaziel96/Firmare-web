"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, TextInput, FileInput, Notification } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import forge from 'node-forge';

export default function SignPdf() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileName = searchParams.get('fileName');
  const fileUrl = searchParams.get('fileUrl');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerifyPassword = async () => {
    if (!cerFile || !keyFile || !password) {
      setErrorMessage('Missing certificate, key, or password');
      return;
    }

    try {
      // Leer los archivos .cer y .key
      const cerArrayBuffer = await cerFile.arrayBuffer();
      const keyArrayBuffer = await keyFile.arrayBuffer();

      const cerPem = new TextDecoder().decode(cerArrayBuffer);
      const keyPem = new TextDecoder().decode(keyArrayBuffer);

      // Verificar la contraseña
      const privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);
      if (privateKey) {
        setIsPasswordValid(true);
        setVerificationStatus('Password is valid');
        setErrorMessage('');
      } else {
        setIsPasswordValid(false);
        setVerificationStatus('');
        setErrorMessage('Invalid password');
      }
    } catch (error) {
      setIsPasswordValid(false);
      setVerificationStatus('');
      setErrorMessage('Invalid password or error reading the key');
    }
  };

  const handleSign = async () => {
    if (!cerFile || !keyFile || !password) {
      console.error('Missing certificate, key, or password');
      return;
    }

    try {
      // Leer los archivos .cer y .key
      const cerArrayBuffer = await cerFile.arrayBuffer();
      const keyArrayBuffer = await keyFile.arrayBuffer();

      const cerPem = new TextDecoder().decode(cerArrayBuffer);
      const keyPem = new TextDecoder().decode(keyArrayBuffer);

      // Cargar el PDF
      if (!fileUrl) {
        console.error('File URL is missing');
        return;
      }
      const existingPdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Crear una nueva página para el sello
      const page = pdfDoc.addPage();
      page.drawText('Documento firmado digitalmente', {
        x: 50,
        y: 700,
        size: 30,
      });

      // Firmar el PDF
      const privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);
      const cert = forge.pki.certificateFromPem(cerPem);

      // Aquí puedes agregar la lógica para firmar el PDF usando pdf-lib y node-forge
      // Nota: pdf-lib no soporta firma digital directamente, necesitarás una biblioteca adicional o implementar la lógica de firma

      const signedPdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

      // Almacenar el PDF firmado en el almacenamiento local
      localStorage.setItem('signedPdf', signedPdfBytes);

      // Redirigir a la página de visualización del PDF firmado
      router.push(`/view-signed-pdf?fileName=${fileName}-signed`);

      console.log('PDF firmado con éxito');
    } catch (error) {
      console.error('Error al firmar el PDF:', error);
    }
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
        <Button mt="md" onClick={handleVerifyPassword}>Verify Password</Button>
        {verificationStatus && <Notification color="green">{verificationStatus}</Notification>}
        {errorMessage && <Notification color="red">{errorMessage}</Notification>}
        <Button mt="md" onClick={handleSign} disabled={!isPasswordValid}>Sign</Button>
      </Card>
    </Container>
  );
}