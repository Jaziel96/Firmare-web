"use client";

import { GlobalWorkerOptions } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Title, Button, Group, Card, Text, useMantineTheme } from "@mantine/core";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";


export const dynamic = "force-dynamic";

export default function ViewSignedPdf() {
  return (
    <Suspense fallback={<Text>Cargando parámetros...</Text>}>
      <ViewSignedPdfContent />
    </Suspense>
  );
}



function ViewSignedPdfContent() {
  const theme = useMantineTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const publicId = searchParams.get("id"); // Obtener el ID único
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    nombre: string;
    fecha: string;
    lugar: string;
  } | null>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Verificar si el usuario está autenticado (solo para mostrar el botón "Regresar")
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  // Obtener el PDF firmado y los metadatos desde Supabase Storage usando el ID único
  useEffect(() => {
    const fetchSignedPdf = async () => {
      if (publicId) {
        try {
          // Buscar el PDF en la tabla pdf_metadata usando el ID único
          const { data: pdfMetadata, error: metadataError } = await supabase
            .from("pdf_metadata")
            .select("name, cadena_original")
            .eq("public_id", publicId);

          if (metadataError) {
            throw new Error("No se encontró el documento solicitado. Por favor, intenta nuevamente.");
          }

          // Verificar si hay exactamente una coincidencia
          if (!pdfMetadata || pdfMetadata.length === 0) {
            throw new Error("No se encontró el documento solicitado. Presiona el botón Inicio.");
          }
          if (pdfMetadata.length > 1) {
            throw new Error("Múltiples documentos encontrados con el mismo ID.");
          }

          // Obtener el archivo desde Supabase Storage
          const { data, error: urlError } = await supabase.storage
            .from("pdfs")
            .createSignedUrl(pdfMetadata[0].name, 3600); // URL válida por 1 hora

          if (urlError) {
            throw new Error("Error al generar la URL del archivo. Inténtalo más tarde.");
          }

          // Extraer los metadatos de la cadena original
          const cadenaOriginal = pdfMetadata[0].cadena_original;
          const [institucion, nombre, grado, fecha] = cadenaOriginal.split(" | ");
          setMetadata({
            nombre: nombre.trim(),
            fecha: fecha.trim(),
            lugar: institucion.trim(),
          });
          setFileUrl(data.signedUrl);
        } catch (err: any) {
          // Capturar el error y mostrarlo en la interfaz de usuario
          setError(err.message || "Ocurrió un error inesperado.");
        }
      }
    };

    fetchSignedPdf();
  }, [publicId]);

  return (
    <>
  <Container fluid style={{ padding: 0, margin: 0, maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
    {/* Navbar con ancho total */}
    <Group
      position="apart"
      align="center"
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: '#f0fce8',
      }}
    >
      <img
        src="/images/UdeC_2L izq Negro.png"
        alt="Logo UdeC"
        style={{ height: '40px', width: 'auto' }}
      />
      <Title order={1} style={{ fontFamily: 'Futura, sans-serif' }}>
        Firmare
      </Title>
      <Group spacing="xs">
        {isAuthenticated && (
          <Button
            style={{ backgroundColor: theme.colors.myColor[1], color: theme.colors.dark[7] }}
            onClick={() => router.push("/dashboard")}
          >
            Regresar
          </Button>
        )}
        <Button
          style={{ backgroundColor: theme.colors.myColor[1], color: theme.colors.dark[7] }}
          onClick={() => router.push("/")}
        >
          Inicio
        </Button>
      </Group>
    </Group>

    {/* Contenido principal */}
    <div style={{ flex: 1, padding: '16px' }}>
      {/* Mostrar mensaje de error si existe */}
      {error && (
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#ffebee", border: "1px solid #e53935" }}>
          <Text color="red">{error}</Text>
        </Card>
      )}

      {/* Mostrar el visor de PDF si no hay errores */}
      {!error && (
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#e4f6d7", height: "150vh",width: "80%", margin: '0 auto' }}>
          {fileUrl ? (
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
              <div style={{ height: "100%", width: "100%" }}>
                <Viewer fileUrl={fileUrl || ''} plugins={[defaultLayoutPluginInstance]} />
              </div>
            </Worker>
          ) : (
            <p>Cargando PDF firmado...</p>
          )}
        </Card>
      )}

      {/* Cuadro adicional con los metadatos del certificado */}
      {metadata && (
        <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0", width: "80%", margin: '0 auto' }}>
          <Text size="lg" weight={700} mb="sm" style={{ color: "#000000" }}>
            Información de la Firma
          </Text>
          <Text style={{ color: "#000000" }}>
            <strong>Firmado por:</strong> {metadata.nombre}
          </Text>
          <Text style={{ color: "#000000" }}>
            <strong>Fecha:</strong> {metadata.fecha}
          </Text>
          <Text style={{ color: "#000000" }}>
            <strong>Lugar:</strong> {metadata.lugar}
          </Text>
        </Card>
      )}
    </div>

    {/* Footer con ancho total */}
    <div style={{ width: '100%' }}>
        <Footer />
      </div>
  </Container>
</>
  );
}