/* Optional jQuery bar-rating stub — keeps legacy script tags from 404ing. */
(function ($) {
  if (!$ || !$.fn) return;
  if (!$.fn.barrating) {
    $.fn.barrating = function () {
      return this;
    };
  }
})(window.jQuery);
