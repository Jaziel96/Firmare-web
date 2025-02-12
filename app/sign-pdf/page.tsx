"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Button, Group, Card, TextInput, FileInput, Notification } from '@mantine/core';
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
import crypto from 'crypto';
import { supabase } from "@/lib/supabase";

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
      setErrorMessage('Archivo .cer no válido. Asegúrese de que está en formato PEM.');
      return false;
    }
  };

  // Verificar contraseña
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

  // Generar la cadena original
  const generarCadenaOriginal = (datos: any) => {
    return `
      ${datos.institucion} | ${datos.nombre} | ${datos.grado} | ${datos.fecha}
      ${datos.cadenaAdicional || ''}
    `.trim();
  };

  // Generar el hash de la cadena original
  const generarHash = (cadenaOriginal: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(cadenaOriginal, 'utf8');
    return hash.digest('hex');
  };

  // Crear la firma electrónica avanzada
  const firmarHash = (hash: string, clavePrivadaPem: string, password: string) => {
    const privateKey = forge.pki.decryptRsaPrivateKey(clavePrivadaPem, password);
    const firma = privateKey.sign(forge.md.sha256.create().update(hash, 'utf8'));
    return forge.util.encode64(firma); // Convertir a Base64 para almacenamiento
  };

  // Firmar PDF
  const handleSign = async () => {
  if (!cerFile || !keyFile || !password) {
    console.error('Falta el certificado, la clave o la contraseña');
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
      return;
    }

    if (!fileUrl) {
      console.error('Falta la URL del archivo');
      return;
    }

    const existingPdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Obtener información del certificado
    const cerPem = new TextDecoder().decode(new Uint8Array(cerArrayBuffer));
    const cert = forge.pki.certificateFromPem(cerPem);
    const subject = cert.subject.attributes.find(attr => attr.name === 'commonName')?.value || 'Unknown';
    const currentDate = new Date().toLocaleString();
    const uuid = uuidv4();

    // Datos para la cadena original
    const datos = {
      institucion: "Universidad de Colima, Colima",
      nombre: subject,
      grado: "Facultad de Telematica",
      fecha: currentDate,
    };

    // Generar la cadena original
    const cadenaOriginal = generarCadenaOriginal(datos);

    // Generar un ID único para el enlace público
    const publicId = uuidv4();

    // Crear el enlace público
    const publicUrl = `https://wpph6dmr-3000.usw3.devtunnels.ms/view-signed-pdf?id=${publicId}`;
    //`http://localhost:3000/view-signed-pdf?id=${publicId}`;
    //`https://wpph6dmr-3000.usw3.devtunnels.ms/view-signed-pdf?id=${publicId}`;

    // Guardar la cadena original en la base de datos
    const { error: updateError1 } = await supabase
    .from('pdf_metadata')
    .update({
      signaturestatus: 'Firmado',
      modifiedat: new Date().toISOString(),
      public_url: publicUrl, // Guardar el enlace público
      public_id: publicId, // Guardar el ID único
      cadena_original: cadenaOriginal, // Guardar la cadena original
    })
    .eq('name', fileName);

    if (updateError1) {
      throw new Error(updateError1.message);
    }

    // Generar el hash de la cadena original
    const hash = generarHash(cadenaOriginal);

    // Firmar el hash
    const firma = firmarHash(hash, keyPem, password);

    // Generar código QR
    const qrCodeData = `${publicUrl}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    // Agregar una nueva página para la firma y la información adicional
    const newPage = pdfDoc.addPage();
    const { width, height } = newPage.getSize();

    // Agregar el código QR al lado izquierdo arriba de la cadena original
    const qrImageBytes = await fetch(qrCodeUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    newPage.drawImage(qrImage, {
      x: 50,
      y: height - 150,
      width: 100,
      height: 100,
    });

    // Dibujar textos "Firmado por", "Fecha", "UUID"
    newPage.drawText(`Firmado por: ${subject}`, {
      x: 50,
      y: height - 160,
      size: 10,
      color: rgb(0, 0, 0),
      maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
    });
    newPage.drawText(`Fecha: ${currentDate}`, {
      x: 50,
      y: height - 170,
      size: 10,
      color: rgb(0, 0, 0),
      maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
    });
    newPage.drawText(`UUID: ${uuid}`, {
      x: 50,
      y: height - 180,
      size: 10,
      color: rgb(0, 0, 0),
      maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
    });

    // Incrustar la cadena original
    newPage.drawText(`Cadena Original: ${cadenaOriginal}`, {
      x: 50,
      y: height - 200,
      size: 10,
      maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
    });

    // Función para dividir la firma en líneas
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

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    // Dibujar "Firma Digital:" en un renglón arriba del código de la firma
    newPage.drawText('Firma Digital:', {
      x: 50,
      y: height - 250, // Posición inicial para "Firma Digital:"
      size: 10,
      color: rgb(0, 0, 0),
      maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
    });

    // Dividir la firma digital en líneas
    const firmaLines = splitTextIntoLines(firma, width - 100, 10);

    // Dibujar la firma digital en varias líneas
    firmaLines.forEach((line, index) => {
      newPage.drawText(line, {
        x: 50,
        y: height - 260 - (index * 15), // Ajustar la posición vertical para cada línea
        size: 10,
        color: rgb(0, 0, 0),
        maxWidth: width - 100, // Asegurarse de que el texto no se salga de los márgenes
      });
    });

    // Guardar el PDF firmado
    const signedPdfBytes = await pdfDoc.save();

    // Sobreescribir el archivo original en Supabase Storage
    const signedPdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
    if (!fileName) {
      throw new Error('File name is missing');
    }
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, signedPdfBlob, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Actualizar el estado de firma y el enlace público en la base de datos
    const { error: updateError } = await supabase
      .from('pdf_metadata')
      .update({
        signaturestatus: 'Firmado',
        modifiedat: new Date().toISOString(),
        public_url: publicUrl, // Guardar el enlace público
        public_id: publicId, // Guardar el ID único
      })
      .eq('name', fileName);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Redirigir al dashboard y mostrar notificación
    router.push('/dashboard?firma=success');
    showNotification({
      title: 'Éxito',
      message: 'PDF firmado y sobreescrito correctamente',
      color: 'green',
    });
  } catch (error) {
    console.error('Error al firmar el PDF:', error);
    setErrorMessage('Error signing the PDF');
    showNotification({
      title: 'Error',
      message: 'Error al firmar el PDF',
      color: 'red',
    });
  }
};
  return (
    <Container>
      <Group align="apart" mb="md">
        <Title order={1}>Signing: {fileName}</Title>
      </Group>
      <Button style={{ backgroundColor: 'gray' }} onClick={() => router.push('/dashboard')}>Regresar a Inicio</Button>
      <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7' }}> {/* Segundo color de myColor */}
        <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
          <div style={{ height: '400px' }}>
            <Viewer fileUrl={fileUrl || ''} plugins={[defaultLayoutPluginInstance]} />
          </div>
        </Worker>
      </Card>
      <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: '#e4f6d7' }}> {/* Segundo color de myColor */}
        <FileInput
          label="Subir archivo .cer"
          accept=".cer"
          value={cerFile}
          onChange={setCerFile}
          styles={{
            input: { backgroundColor: '#f1f3f5', color: '#000' },
            label: { color: '#000' },
          }}
        />
        <FileInput
          label="Subir archivo .key"
          value={keyFile}
          onChange={setKeyFile}
          styles={{
            input: { backgroundColor: '#f1f3f5', color: '#000' },
            label: { color: '#000' },
          }}
        />
        <TextInput
          label="Contraseña"
          placeholder="Introdusca la contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          styles={{
            input: { backgroundColor: '#f1f3f5', color: '#000' },
            label: { color: '#000' },
          }}
        />
        <Button mt="md" style={{ backgroundColor: 'blue', color: 'white' }} onClick={handleVerifyPassword}>
          Verificar Contraseña
        </Button>
        {verificationStatus && <Notification color="green">{verificationStatus}</Notification>}
        {errorMessage && <Notification color="red">{errorMessage}</Notification>}
        <Button mt="md" style={{ backgroundColor: 'green', color: 'white' }} onClick={handleSign} disabled={!isPasswordValid}>
          Firmar
        </Button>
      </Card>
    </Container>
  );
}