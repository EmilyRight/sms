import Swiper from '../vendor/swiper.min';

const swiper = new Swiper('.swiper', {
  autoplay: {
    delay: 5000,
  },
  slidesPerView: 'auto',
  spaceBetween: 12,
  slidesOffsetAfter: 0,
  breakpoints: {

    600: {
      spaceBetween: 24,
    },
  },
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

export default swiper;
