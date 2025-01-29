"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Button,
  Group,
  Text,
  Table,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { showNotification } from "@mantine/notifications";
import { supabase } from "@/lib/supabase";

interface PdfFile {
  name: string;
  uploadedat: string;
  uploadedby: string;
  modifiedat: string;
  signaturestatus: "Pendiente" | "Firmado";
}

function normalizeFileName(fileName: string): string {
  const uniqueId = Date.now(); // Agregar un identificador único
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()
    .replace(/\.[^/.]+$/, "") // Eliminar la extensión
    .concat(`_${uniqueId}.pdf`); // Agregar el identificador único y la extensión
}

export default function Dashboard() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Función auxiliar para verificar si el usuario está autenticado
  async function ensureAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showNotification({
        title: "Error",
        message: "User not authenticated.",
        color: "red",
      });
      console.error("User not authenticated.");
      return false;
    }
    console.log("Authenticated user:", user);
    return true;
  }

  useEffect(() => {
    fetchPdfFiles();
  }, []);

  async function fetchPdfFiles() {
    if (!(await ensureAuthenticated())) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("pdf_metadata") // Suponiendo que esta es la tabla donde guardas info de los PDFs
        .select("*")
        .eq("owner", user?.id) // Solo los archivos del usuario actual
        .order("uploadedat", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setPdfFiles(data || []);
    } catch (err: any) {
      setError(`Error fetching files: ${err.message}`);
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: File[]) {
    if (!(await ensureAuthenticated())) return;

    const file = files[0];

    if (!file || file.size === 0) {
      showNotification({
        title: "Error",
        message: "No file selected or file is empty.",
        color: "red",
      });
      return;
    }

    const normalizedFileName = normalizeFileName(file.name);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Subir el archivo con el nombre normalizado
      const { data: uploadData, error: uploadError } =
        await supabase.storage.from("pdfs").upload(normalizedFileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Guardar metadatos en Supabase
      await supabase.from("pdf_metadata").insert([
        {
          name: normalizedFileName,
          uploadedat: new Date().toISOString(),
          uploadedby: user?.email || "unknown",
          modifiedat: new Date().toISOString(),
          signaturestatus: "Pendiente",
          owner: user?.id,
        },
      ]);

      showNotification({
        title: "Success",
        message: "File uploaded successfully",
        color: "green",
      });
      fetchPdfFiles();
    } catch (err: any) {
      console.error("Upload error:", err);
      showNotification({
        title: "Error",
        message: err.message || "Unknown error occurred.",
        color: "red",
      });
    }
  }

  async function handleDelete(fileName: string) {
    if (!(await ensureAuthenticated())) return;

    try {
      const { error } = await supabase.storage.from("pdfs").remove([fileName]);
      if (error) {
        throw new Error(error.message);
      }

      // Eliminar metadatos de la base de datos
      await supabase.from("pdf_metadata").delete().eq("name", fileName);

      showNotification({
        title: "Success",
        message: "File deleted successfully",
        color: "green",
      });
      fetchPdfFiles();
    } catch (err: any) {
      console.error("Delete error:", err);
      showNotification({
        title: "Error",
        message: err.message || "Unknown error occurred.",
        color: "red",
      });
    }
  }

  async function handleSign(fileName: string) {
    if (!(await ensureAuthenticated())) return;

    try {
      // Actualizar el estado de la firma en la base de datos
      const { error } = await supabase
        .from("pdf_metadata")
        .update({
          signaturestatus: "Firmado",
          modifiedat: new Date().toISOString(),
        })
        .eq("name", fileName);

      if (error) {
        throw new Error(error.message);
      }

      showNotification({
        title: "Success",
        message: "File signed successfully",
        color: "green",
      });
      fetchPdfFiles();
    } catch (err: any) {
      console.error("Sign error:", err);
      showNotification({
        title: "Error",
        message: err.message || "Unknown error occurred.",
        color: "red",
      });
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleView(fileName: string) {
    if (!(await ensureAuthenticated())) return;

    try {
      const { data, error } = await supabase.storage
        .from("pdfs")
        .createSignedUrl(fileName, 60);

      if (error) {
        throw new Error(error.message);
      }

      router.push(
        `/view-pdf?fileName=${fileName}&fileUrl=${encodeURIComponent(
          data.signedUrl
        )}`
      );
    } catch (err: any) {
      console.error("Error generating signed URL:", err);
      showNotification({
        title: "Error",
        message: "No se pudo generar la URL del archivo.",
        color: "red",
      });
    }
  }

  return (
    <Container>
      <Group position="apart" mb="md">
        <Title order={1}>Firmare</Title>
        <Button color="red" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </Group>
      <Dropzone
        onDrop={handleUpload}
        accept={[MIME_TYPES.pdf]}
        styles={(theme) => ({
          root: {
            backgroundColor: "#e4f6d7",
            border: `2px dashed ${theme.colors.blue[6]}`,
            padding: theme.spacing.xl,
            textAlign: "center",
            color: "#000",
            "&:hover": {
              backgroundColor: "#f1f3f5",
            },
          },
        })}
      >
        <Text style={{ textAlign: "center", color: "#000" }}>
          Arrastra el PDF aquí o haz clic aquí para seleccionar el PDF
        </Text>
      </Dropzone>
      <Table mt="md" highlightOnHover withBorder withColumnBorders>
        <thead style={{ backgroundColor: "#e4f6d7", color: "#000" }}>
          <tr>
            <th style={{ borderColor: "#000", color: "#000" }}>Nombre</th>
            <th style={{ borderColor: "#000", color: "#000" }}>
              Fecha de Creación
            </th>
            <th style={{ borderColor: "#000", color: "#000" }}>Creado por</th>
            <th style={{ borderColor: "#000", color: "#000" }}>
              Fecha de Modificación
            </th>
            <th style={{ borderColor: "#000", color: "#000" }}>
              Estado de Firma
            </th>
            <th style={{ borderColor: "#000", color: "#000" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pdfFiles.map((file) => (
            <tr
              key={file.name}
              style={{ borderColor: "#000", color: "#000" }}
              onMouseEnter={(e) => (
                (e.currentTarget.style.backgroundColor = "#e4f6d7"),
                (e.currentTarget.style.color = "#000")
              )}
              onMouseLeave={(e) => (
                (e.currentTarget.style.backgroundColor = ""),
                (e.currentTarget.style.color = "#000")
              )}
            >
              <td style={{ borderColor: "#000", color: "#000" }}>
                {file.name}
              </td>
              <td style={{ borderColor: "#000", color: "#000" }}>
                {new Date(file.uploadedat).toLocaleString()}
              </td>
              <td style={{ borderColor: "#000", color: "#000" }}>
                {file.uploadedby}
              </td>
              <td style={{ borderColor: "#000", color: "#000" }}>
                {new Date(file.modifiedat).toLocaleString()}
              </td>
              <td style={{ borderColor: "#000", color: "#000" }}>
                {file.signaturestatus}
              </td>
              <td style={{ borderColor: "#000", color: "#000" }}>
                <Button onClick={() => handleView(file.name)}>Ver</Button>
                <Button color="red" onClick={() => handleDelete(file.name)}>
                  Borrar
                </Button>
                <Button color="green" onClick={() => handleSign(file.name)}>
                  Firmar
                </Button>
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