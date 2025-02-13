"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Title, Button, Group, Card, Text } from "@mantine/core";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";

export default function ViewSignedPdf() {
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
      <Container>
        <Group align="apart" mb="md">
          <img
              src="\Firmare-web\public\images\UdeC_2L izq Negro.png" // Ruta relativa desde la carpeta public
              alt="Logo UdeC"
              style={{
                height: '40px', // Altura del logo
                width: 'auto', // Mantener proporción
              }}
            />
          <Title order={1}>Documento Firmado</Title>
          {isAuthenticated && (
            <Button
              style={{ backgroundColor: "gray" }}
              onClick={() => router.push("/dashboard")}
            >
              Regresar
            </Button>
          )}
          <Button
            style={{ backgroundColor: "blue" }}
            onClick={() => router.push("/")}
          >
            Inicio
          </Button>
        </Group>

        {/* Mostrar mensaje de error si existe */}
        {error && (
          <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#ffebee", border: "1px solid #e53935" }}>
            <Text color="red">{error}</Text>
          </Card>
        )}

        {/* Mostrar el visor de PDF si no hay errores */}
        {!error && (
          <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#e4f6d7", height: "150vh" }}>
            {fileUrl ? (
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}>
                <div style={{ height: "100%", width: "100%" }}>
                  <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
                </div>
              </Worker>
            ) : (
              <p>Cargando PDF firmado...</p>
            )}
          </Card>
        )}

        {/* Cuadro adicional con los metadatos del certificado */}
        {metadata && (
          <Card mt="md" shadow="sm" padding="lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0" }}>
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
      </Container>
      <Footer />
    </>
  );
}