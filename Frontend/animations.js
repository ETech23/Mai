// AI Particle Animation
particlesJS('ai-particle', {
  particles: {
    number: { value: 50 },
    color: { value: '#00ffcc' },
    shape: {
      type: 'circle',
    },
    opacity: {
      value: 0.5,
      random: true,
    },
    size: {
      value: 3,
      random: true,
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#00ffcc',
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
    },
  },
});

// Crypto Particle Animation
particlesJS('crypto-particle', {
  particles: {
    number: { value: 70 },
    color: { value: '#ffd700' },
    shape: {
      type: 'triangle',
    },
    opacity: {
      value: 0.7,
      random: true,
    },
    size: {
      value: 4,
      random: true,
    },
    line_linked: {
      enable: true,
      distance: 100,
      color: '#ffd700',
      opacity: 0.5,
      width: 1,
    },
    move: {
      enable: true,
      speed: 3,
    },
  },
});

// Smooth Scroll Between Sections
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('section').forEach(section => {
    section.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth' });
    });
  });
});

