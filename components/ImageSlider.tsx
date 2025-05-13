// C:\Users\jazco\Firmare-web\components\ImageSlider.tsx
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { Navigation, Pagination, Autoplay } from 'swiper/modules'; // Añadir Autoplay
import Image from 'next/image';

const images = [
  '/images/documentos.jpg',
  '/images/firma-electronica.png',
  '/images/logo udc.jpg',
];

const ImageSlider = () => {
  return (
    <Swiper
      spaceBetween={0}
      slidesPerView={1}
      loop
      pagination={{ clickable: true }}
      navigation
      autoplay={{ // Configuración de autoplay
        delay: 3000, // Tiempo en milisegundos entre cada slide
        disableOnInteraction: false, // No detener el autoplay si el usuario interactúa
      }}
      modules={[Navigation, Pagination, Autoplay]} // Agregar Autoplay al array de módulos
      style={{
        width: '100%',
        
        height: '50vh', // 50% de la altura de la ventana gráfica
      }}
    >
      {images.map((src, index) => (
        <SwiperSlide
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%', // Asegurar que el slide ocupe toda la altura del Swiper
          }}
        >
          <Image
            src={src}
            alt={`Slide ${index + 1}`} // Mejorar el alt text
            layout="fill" // Usar 'fill' para que la imagen llene el contenedor del slide
            objectFit="cover" // 'cover' para mantener la relación de aspecto y llenar
            priority={index === 0} // Cargar la primera imagen con prioridad
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageSlider;