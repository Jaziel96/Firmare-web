import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import Image from 'next/image';

const images = [
  '/images/documentos.jpg',
  '/images/firma-electronica.png',
  '/images/logo udc.jpg',
];

const ImageSlider = () => (
  <Swiper spaceBetween={0} slidesPerView={1} loop pagination={{ clickable: true }} navigation style={{ width: '100vw', height: '100vh' }}>
    {images.map((src, index) => (
      <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Image src={src} alt={`Slide ${index}`} layout="fill" objectFit="cover" />
      </SwiperSlide>
    ))}
  </Swiper>
);

export default ImageSlider;