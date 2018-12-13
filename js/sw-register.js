document.addEventListener('DOMContentLoaded', event => {
  if ('serviceWorker' in navigator){
  // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
          if('sync' in reg){
          }
        }).catch(error=> {
          console.log(error);
        });
    });
  }
});
