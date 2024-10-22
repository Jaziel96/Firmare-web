import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';

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
      style={{ width: '100vw', height: '100vh' }}
    >
      {images.map((src, index) => (
        <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={src} alt={`Slide ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageSlider;