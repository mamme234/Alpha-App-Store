// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Start with home page
  navigateTo('home');
});

// ===== EXPOSE FUNCTIONS TO GLOBAL =====
window.navigateTo = navigateTo;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleDownload = handleDownload;
window.handleFavorite = handleFavorite;
window.Auth = Auth;
window.showNotification = showNotification;

// ===== SERVICE WORKER REGISTRATION (PWA) =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('SW registered'))
    .catch(() => console.log('SW registration failed'));
}
