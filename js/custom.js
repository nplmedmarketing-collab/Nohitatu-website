// Load the shared CTA and fixed-footer reveal before legacy page scripts run.
(function () {
  var currentScript = document.currentScript;
  if (!currentScript || !currentScript.src) return;

  ['footer-reveal.js', 'mobile-nav.js'].forEach(function (name) {
    var script = document.createElement('script');
    var url = new URL(name, currentScript.src);
    // Soft-bump when custom.js itself is versioned (?v=…) so CTA/footer fixes land.
    if (currentScript.src.indexOf('?') !== -1) {
      url.search = currentScript.src.split('?')[1];
    }
    script.src = url.href;
    script.defer = true;
    document.head.appendChild(script);
  });
})();

$(document).ready(function() {
// header jquery
  var header = $("header");
  var owl = $('.testimonial-slider');
  owl.owlCarousel({
    margin: 10,
	autoplay: true,
    nav: false,
    loop: true,
    pagination:true,     
	items: 1
  });
  
  var owl = $('.bottom-banner');
  owl.owlCarousel({
    margin: 8,
	autoplay: false,
    nav: false,
    loop: true,
    nav: true,
    pagination:false,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:true
        },
        600:{
            items:3,
            nav:false
        },
        1000:{
            items:4,
            nav:true
        }
    }
  });
      
  $(function() {   
    $(window).scroll(function() {    
        var scroll = $(window).scrollTop();    
        if (scroll >= 80) {
			if (header.hasClass("open-menu"))
			{
				header.removeClass("white-header");
			}		
			else if (header.hasClass("show-menu"))
			{
				header.removeClass("white-header").addClass("blnk-header");
			}
			else
			{
				header.removeClass('blnk-header').addClass("white-header");
			}
			
        } else {
            header.removeClass("white-header").addClass('blnk-header');
        }
    });
});

// sidemenu open
    $(".nav-menu").click(function(){
        $(".nav-menu").toggleClass("open");
        $("header").toggleClass("open-menu");
        $(".full-screen-menu").toggleClass("show");      
        $(this).attr("aria-expanded", $(this).hasClass("open") ? "true" : "false");
        var scroll = $(window).scrollTop();
        if (scroll >= 80) {
			if (header.hasClass("open-menu"))
			{
				header.removeClass("white-header").addClass("blnk-header");
			}
			else
			{
				header.removeClass('blnk-header').addClass("white-header");
			}
        } 
    });  

    
//open contact-form

    // $(".contact-number").click(function(){
        // $(".contact-form-popup").toggleClass("show"); 
        // $("header").toggleClass("show-menu"); 
        // $("body").toggleClass("fixed");
        // updateHeader(); 
    // });
    
    // $(".open-form").click(function(){
        // $(".contact-form-popup").toggleClass("show"); 
        // $("header").toggleClass("show-menu"); 
        // $("body").toggleClass("fixed");
        // updateHeader(); 
    // });
            
    $(".nav-menu-close").click(function(){
        $(".contact-form-popup").toggleClass("show"); 
        $("body").toggleClass("fixed"); 
        $("header").toggleClass("show-menu");
       	updateHeader();
    });
    
    function updateHeader(){
    	var scroll = $(window).scrollTop();
        if (scroll >= 80) {
			if (header.hasClass("show-menu"))
			{
				header.removeClass("white-header").addClass("blnk-header");
			}
			else
			{
				header.removeClass('blnk-header').addClass("white-header");
			}
        } 
    }
    
    
//accept privacy
    $(document).ready(function(){
	  $(".btn-aceptar").click(function(){
	    $("body").addClass("cached");
	  });
	});
});

$(document).ready(function() { 
	var scroll = $(window).scrollTop();
	var header = $("header");
	if (scroll >= 80) {			
		header.removeClass("blnk-header").addClass("white-header");
	}
	else
	{
		header.removeClass('white-header').addClass("blnk-header");
	}	 
});


$(document).ready(function(){
 
  $(".blue-btn").click(function(){
    $(".chat-box").toggleClass("show");
  });
  $(".cross-chat").click(function(){
    $(".chat-box").toggleClass("show");
  });
});


$(document).ready(function(){
  var date = new Date();
  document.getElementById('copyRight').innerText = "Copyright © " + date.getFullYear() + " Nohitatu";

});


// $(function() {
  // $('#slides').slidesjs({
    // width: 864,
    // height: 459,
	 // play: {
      // auto: true,
	  // interval: 3000,
    // },
// 	
    // navigation: false
  // });
// });

// Hide the fixed navigation while scrolling down and reveal it on upward scroll.
document.addEventListener('DOMContentLoaded', function () {
  var navigationHeader = document.querySelector('header.logo-navbar');
  if (!navigationHeader) return;

  var lastScrollY = window.scrollY;
  var ticking = false;

  function updateNavigationVisibility() {
    var currentScrollY = Math.max(window.scrollY, 0);
    var menuOpen = navigationHeader.classList.contains('open-menu') ||
      navigationHeader.classList.contains('show-menu') ||
      document.body.classList.contains('fixed');

    if (menuOpen || currentScrollY < 80 || currentScrollY < lastScrollY) {
      navigationHeader.classList.remove('nav-panel-hidden');
    } else if (currentScrollY > lastScrollY + 5) {
      navigationHeader.classList.add('nav-panel-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateNavigationVisibility);
      ticking = true;
    }
  }, { passive: true });
});
