if ('serviceWorker' in navigator){
// Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(function(){
        console.log('SERVICE_WORKER_REGISTRATION: Passed!');
      })
      .catch(function(error){
        console.log(`SERVICE_WORKER_REGISTRATION: failed with ${error}`);
      });
  });
}
