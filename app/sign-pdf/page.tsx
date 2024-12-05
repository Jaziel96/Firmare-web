"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, TextInput, FileInput, Notification } from '@mantine/core';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist';
import plainAddPlaceholder from 'node-signpdf/dist/helpers/plainAddPlaceholder';
import SignPdf from 'node-signpdf';
import forge from 'node-forge';

export default function SignPdfComponent() {
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

  // Validar archivo .cer como PEM
  const validateCerFile = async (cerFile: File): Promise<boolean> => {
    try {
      const cerArrayBuffer = await cerFile.arrayBuffer();
      const cerPem = new TextDecoder().decode(new Uint8Array(cerArrayBuffer));
      forge.pki.certificateFromPem(cerPem); // Lanza error si no es válido
      return true;
    } catch (error) {
      console.error('El archivo .cer no es válido:', error);
      setErrorMessage('Invalid .cer file. Please ensure it is in PEM format.');
      return false;
    }
  };

  // Verificar contraseña
  const handleVerifyPassword = async () => {
    if (!keyFile || !password) {
      setErrorMessage('Missing key or password');
      return;
    }

    try {
      const keyArrayBuffer = await keyFile.arrayBuffer();
      const keyPem = new TextDecoder().decode(keyArrayBuffer);

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

  // Conversión de .cer y .key a .p12
  const convertToP12 = async (
    cerBytes: ArrayBuffer,
    keyBytes: ArrayBuffer,
    password: string
  ): Promise<Buffer> => {
    try {
      const cerPem = new TextDecoder().decode(new Uint8Array(cerBytes));
      const keyPem = new TextDecoder().decode(new Uint8Array(keyBytes));

      const cert = forge.pki.certificateFromPem(cerPem);
      const privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);

      if (!privateKey) {
        throw new Error('Invalid password or key format');
      }

      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], password);
      const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

      return Buffer.from(p12Der, 'binary');
    } catch (error) {
      console.error('Error al crear el archivo .p12:', error);
      throw new Error('Failed to create .p12');
    }
  };

  // Firmar PDF
  const handleSign = async () => {
    if (!cerFile || !keyFile || !password) {
      console.error('Missing certificate, key, or password');
      return;
    }

    try {
      const isValidCer = await validateCerFile(cerFile);
      if (!isValidCer) return;

      const cerArrayBuffer = await cerFile.arrayBuffer();
      const keyArrayBuffer = await keyFile.arrayBuffer();

      const p12Buffer = await convertToP12(cerArrayBuffer, keyArrayBuffer, password);

      if (!fileUrl) {
        console.error('File URL is missing');
        return;
      }

      const existingPdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
      const pdfBuffer = Buffer.from(existingPdfBytes);

      const pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer,
        reason: 'Firma digital',
        signatureLength: 1612,
      });

      const pdfBytesWithText = Buffer.from(pdfWithPlaceholder);

      const signedPdfBytes = SignPdf.sign(pdfBytesWithText, {
        p12: p12Buffer,
        passphrase: password,
      });

      localStorage.setItem('signedPdf', Buffer.from(signedPdfBytes).toString('base64'));
      router.push(`/view-signed-pdf?fileName=${fileName}-signed`);
      console.log('PDF firmado con éxito');
    } catch (error) {
      console.error('Error al firmar el PDF:', error);
      setErrorMessage('Error signing the PDF');
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
          <div style={{ height: '400px' }}>
            <Viewer fileUrl={fileUrl || ''} plugins={[defaultLayoutPluginInstance]} />
          </div>
        </Worker>
      </Card>
      <Card mt="md" shadow="sm" padding="lg">
        <FileInput label="Upload .cer file" placeholder="Choose a .cer file" accept=".cer" value={cerFile} onChange={setCerFile} />
        <FileInput label="Upload .key file" placeholder="Choose a .key file" accept=".key" value={keyFile} onChange={setKeyFile} />
        <TextInput
          label="Password"
          placeholder="Enter password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        <Button mt="md" onClick={handleVerifyPassword}>
          Verify Password
        </Button>
        {verificationStatus && <Notification color="green">{verificationStatus}</Notification>}
        {errorMessage && <Notification color="red">{errorMessage}</Notification>}
        <Button mt="md" onClick={handleSign} disabled={!isPasswordValid}>
          Sign
        </Button>
      </Card>
    </Container>
  );
}