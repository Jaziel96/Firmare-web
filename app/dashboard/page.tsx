"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Container, Title, Button, Group, Text, Table } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { showNotification } from "@mantine/notifications";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { Tooltip } from '@mantine/core'; // Importar el componente Tooltip

export const dynamic = "force-dynamic";

interface PdfFile {
  name: string;
  uploadedat: string;
  uploadedby: string;
  modifiedat: string;
  signaturestatus: "Pendiente" | "Firmado";
  public_url?: string; 
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
  return (
    <Suspense fallback={<Text>Cargando parámetros...</Text>}>
      <DashboardContent />
    </Suspense>
  );
}


function DashboardContent() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Obtener los parámetros de la URL
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado para verificar autenticación

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/'); // Redirigir al inicio si no está autenticado
      } else {
        setIsAuthenticated(true); // Permitir acceso si está autenticado
      }
    };
    checkAuth();
  }, [router]);

  // Verificar si el proceso de firma se completó correctamente
  useEffect(() => {
    const firmaStatus = searchParams.get('firma');
    if (firmaStatus === 'success') {
      showNotification({
        title: 'Éxito',
        message: 'El PDF se firmó correctamente',
        color: 'green',
      });
      // Limpiar el parámetro de la URL usando router.push con shallow
      router.push('/dashboard');
    }
  }, [searchParams, router]);

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
    if (isAuthenticated) {
      fetchPdfFiles();
    }
  }, [isAuthenticated]);

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

  // Función para generar un enlace público
  async function handleGeneratePublicLink(fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(fileName, 3600); // URL válida por 1 hora

      if (error) {
        throw new Error(error.message);
      }

      // Redirigir a la vista pública con el nombre del archivo
      router.push(`/view-signed?fileName=${fileName}`);
    } catch (err: any) {
      console.error("Error generating public link:", err);
      showNotification({
        title: "Error",
        message: "No se pudo generar el enlace público.",
        color: "red",
      });
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
      const { error: uploadError } =
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

  // Mostrar carga mientras se verifica la autenticación
  if (!isAuthenticated) {
    return <Text>Cargando...</Text>;
  }

  return (
    <Container fluid style={{ padding: 0, margin: 0, maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
  {/* Navbar */}
  <Group position="apart" mb="md" align="center" style={{ padding: '16px', backgroundColor: '#f0fce8' }}>
    <img
      src="/images/UdeC_2L izq Negro.png"
      alt="Logo UdeC"
      style={{ height: '40px', width: 'auto' }}
    />
    <Title order={1} style={{ fontFamily: 'Futura, sans-serif' }}>
      Firmare
    </Title>
    <Button color="red" onClick={handleLogout}>
      Cerrar Sesión
    </Button>
  </Group>

  {/* Dropzone con línea continua y cambio de color al pasar el mouse */}
  <Dropzone
    onDrop={handleUpload}
    accept={[MIME_TYPES.pdf]}
    styles={(theme) => ({
      root: {
        backgroundColor: 'white',
        border: `2px solid #000`, // Línea continua
        padding: theme.spacing.xl,
        textAlign: 'center',
        color: '#000',
        margin: '0 16px 16px 16px',
        transition: 'background-color 0.3s ease', // Transición suave
        '&:hover': {
          backgroundColor: '#e4f6d7', // Cambio de color al pasar el mouse
        },
      },
    })}
  >
    <Text style={{ textAlign: 'center', color: '#000' }}>
      Arrastra el PDF aquí o haz clic aquí para seleccionar el PDF
    </Text>
  </Dropzone>

  {/* Tabla con contenido centrado */}
  <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
    <Table highlightOnHover withBorder withColumnBorders style={{ tableLayout: 'auto', width: '100%' }}>
      <thead style={{ backgroundColor: '#e4f6d7', color: '#000' }}>
        <tr>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '30%', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Nombre</th>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>Fecha de Creación</th>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>Creado por</th>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>Fecha de Modificación</th>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>Estado de Firma</th>
          <th style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '10%' }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {pdfFiles.map((file) => (
          <tr
            key={file.name}
            style={{ borderColor: '#000', color: '#000' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e4f6d7';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.color = '#000';
            }}
          >
            {/* Columna "Nombre" con tooltip */}
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '30%', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Tooltip label={file.name} position="top" withArrow>
                <div style={{ cursor: 'pointer' }}>
                  {file.name}
                </div>
              </Tooltip>
            </td>
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>
              {new Date(file.uploadedat).toLocaleString('es-MX', {day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit', minute: '2-digit', second: '2-digit',hour12: false})}
            </td>
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>
              {file.uploadedby}
            </td>
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>
              {new Date(file.modifiedat).toLocaleString('es-MX', {day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit', minute: '2-digit', second: '2-digit',hour12: false})}
            </td>
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '15%' }}>
              {file.signaturestatus}
            </td>
            {/* Columna "Acciones" con botones compactos */}
            <td style={{ borderColor: '#000', color: '#000', textAlign: 'center', width: '10%' }}>
              <Group spacing="xs" noWrap>
                <Button size="xs" onClick={() => handleView(file.name)}>
                  Ver
                </Button>
                <Button size="xs" color="red" onClick={() => handleDelete(file.name)}>
                  Borrar
                </Button>
                {file.signaturestatus === 'Firmado' && file.public_url && (
                  <Button
                    size="xs"
                    color="blue"
                    onClick={() => file.public_url && router.push(file.public_url)}
                  >
                    Link Público
                  </Button>
                )}
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
  <Footer />
  {/* Mensajes de carga y error */}
  {loading && <Text style={{ padding: '16px', textAlign: 'center' }}>Cargando...</Text>}
  {error && <Text color="red" style={{ padding: '16px', textAlign: 'center' }}>{error}</Text>}
</Container>

  );
}