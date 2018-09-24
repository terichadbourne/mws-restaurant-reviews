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
} else {
  // console log lack of support for service worker as cleverly
  // suggested in SitePoint's tutorial at:
  // https://www.sitepoint.com/getting-started-with-service-workers/
  console.log("Service worker isn't supported by this browser.")
}
