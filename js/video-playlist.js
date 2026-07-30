/* ==========================================================================
   Multi-Video Seamless Hero Background & Auto-Fade Sync Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const videoPlayer = document.getElementById('hero-playlist-video');
  if (!videoPlayer) return;

  videoPlayer.muted = true;
  videoPlayer.playsInline = true;
  videoPlayer.autoplay = true;

  const playlist = [
    'videos/1.mp4',
    'videos/3.mp4',
    'videos/4.mp4'
  ];

  let currentIndex = 0;

  function setOverlayVisibility(fadeOut) {
    const elementsToHide = document.querySelectorAll('header.logo-navbar, .banner-content, .hero-video-overlay');
    elementsToHide.forEach(el => {
      if (fadeOut) {
        el.classList.add('hero-fade-out');
      } else {
        el.classList.remove('hero-fade-out');
      }
    });
  }

  function playVideoAt(index) {
    currentIndex = index;
    // Reveal everything when new video starts
    setOverlayVisibility(false);

    videoPlayer.src = playlist[currentIndex];
    videoPlayer.load();
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => console.log('Autoplay info:', err));
    }
  }

  // Timeupdate event: Hide everything ONLY in the last 5 seconds of Video 4 (final video)
  videoPlayer.addEventListener('timeupdate', () => {
    if (!videoPlayer.duration || isNaN(videoPlayer.duration)) return;
    const timeRemaining = videoPlayer.duration - videoPlayer.currentTime;
    const isFinalVideo = (currentIndex === playlist.length - 1);
    
    if (isFinalVideo && timeRemaining <= 5) {
      setOverlayVisibility(true);
    } else {
      setOverlayVisibility(false);
    }
  });

  videoPlayer.addEventListener('play', () => {
    const isFinalVideo = (currentIndex === playlist.length - 1);
    if (!isFinalVideo || videoPlayer.currentTime < 2) {
      setOverlayVisibility(false);
    }
  });

  videoPlayer.addEventListener('ended', () => {
    const nextIdx = (currentIndex + 1) % playlist.length;
    playVideoAt(nextIdx);
  });

  videoPlayer.addEventListener('error', () => {
    const nextIdx = (currentIndex + 1) % playlist.length;
    setTimeout(() => playVideoAt(nextIdx), 1500);
  });

  playVideoAt(0);
});
