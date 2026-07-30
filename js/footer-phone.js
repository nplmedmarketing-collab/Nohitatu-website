/* Simple footer phone hover */
document.addEventListener('DOMContentLoaded', () => {
  const phone = document.getElementById('footer-phone-cta');
  if (!phone) return;

  phone.addEventListener('mouseenter', () => {
    phone.style.color = '#019add';
  });

  phone.addEventListener('mouseleave', () => {
    phone.style.color = '';
  });
});
