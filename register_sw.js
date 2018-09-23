// if browser supports service worker, register the `sw.js` file
// console log success or failure
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(success => {
      console.log("Successfully registered service worker: " + success.scope)
    })
    .catch(error => {
      console.log("Error registering service worker: " + error)
    })
}
