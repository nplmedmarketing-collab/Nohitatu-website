/* Simple footer phone hover (Sales + HR links) */
document.addEventListener('DOMContentLoaded', () => {
  const phones = document.querySelectorAll('.site-footer .footer-phone');
  if (!phones.length) return;

  phones.forEach((phone) => {
    phone.addEventListener('mouseenter', () => {
      phone.style.color = '#c25e2e';
    });

    phone.addEventListener('mouseleave', () => {
      phone.style.color = '';
    });
  });
});
