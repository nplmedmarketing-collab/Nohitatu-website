/* Optional jQuery validation stub — keeps legacy script tags from 404ing. */
(function ($) {
  if (!$ || !$.fn) return;
  if (!$.fn.validate) {
    $.fn.validate = function () {
      return this;
    };
  }
})(window.jQuery);
