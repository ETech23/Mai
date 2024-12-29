document.addEventListener('DOMContentLoaded', () => {
  const exploreButton = document.getElementById('explore-button');
  
  exploreButton.addEventListener('click', () => {
    alert('Welcome to the future of AI and Crypto!');
    window.location.href = 'index.html';
  });
});

// Ice Falling Animation
const iceContainer = document.querySelector('.ice-container');

// Function to create an ice particle
function createIceParticle() {
  const ice = document.createElement('div');
  ice.classList.add('ice');
  
  // Randomize initial position and animation duration
  ice.style.left = `${Math.random() * 100}vw`;
  ice.style.animationDuration = `${Math.random() * 2 + 2}s`; // Between 2s and 5s
  
  iceContainer.appendChild(ice);
  
  // Remove ice particle after animation
  setTimeout(() => {
    ice.remove();
  }, 5000); // Matches max animation duration
}

// Generate ice particles periodically
setInterval(createIceParticle, 100); // Create a new ice particle every 200ms

