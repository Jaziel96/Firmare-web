import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { Navigation, Pagination } from 'swiper/modules';
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
      pagination={{ clickable: true }} // Habilitar la paginación
      navigation // Habilitar las flechas de navegación
      modules={[Navigation, Pagination]} // Agregar los módulos necesarios
      style={{ width: '100%', height: '530px' }} // Ajustar el ancho al 100% de la página y la altura automática
    >
      {images.map((src, index) => (
        <SwiperSlide
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%', // Asegurarse de que cada slide tenga un ancho del 100%
          }}
        >
          <Image
            src={src}
            alt={`Slide ${index}`}
            layout="responsive"
            width={1920}
            height={1080}
            objectFit="cover"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageSlider;