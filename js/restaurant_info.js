let restaurant;
var newMap;
var mapDiv = document.getElementById("map");

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  if (!navigator.onLine) {
    mapDiv.classList.add("offline")
  } else {
    DBHelper.syncLoop(getParameterByName('id'), fillReviewsHTML)
    mapDiv.classList.remove("offline")
  }
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(`error in initMap -> fetchRestaurantFromURL callback is ${error}`);
      } else {
        //only try to initialize map if browser is online
        if (navigator.onLine) {
          self.newMap = L.map('map', {
            center: [restaurant.latlng.lat, restaurant.latlng.lng],
            zoom: 16,
            scrollWheelZoom: false
          });
          L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            accessToken: topSecretMapboxToken, //be sure to set a value for this in js/.secrets.js
            maxZoom: 18,
            tileSize: 512,
            zoomOffset: -1,
            attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
            id: 'mapbox/streets-v11'
          }).addTo(newMap);
          mapDiv.classList.remove("offline") // set map div class to reflect online status
        } // end if navigator is online
        fillBreadcrumb();
        if (navigator.onLine) {
          mapDiv.classList.remove("offline") // set map div class to reflect online status
          DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
      } //end else
    }); //end fetchRestaurantFromURL
} // end initMap


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementsByClassName('favorite-button')[0]
  favorite.id = "favorite-" + self.restaurant.id
  favorite.setAttribute('data-id', self.restaurant.id)
  // TODO: Check that this works w/ actual JSON from server
  // favorite.setAttribute('data-favorite', (restaurant.is_favorite || "false"));
  if (!restaurant.is_favorite || restaurant.is_favorite === "false") {
    favorite.setAttribute('data-favorite', "false");
    favorite.setAttribute('aria-label', "Add to favorites")
  } else {
    favorite.setAttribute('data-favorite', "true");
    favorite.setAttribute('aria-label', "Remove from favorites")
  }
  favorite.onclick = function () {
    DBHelper.toggleFavorite(favorite.getAttribute("data-id"), favorite.getAttribute("data-favorite"));
  }

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  // get the right image url from the banner directory
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 'banner');
  // give it an alt tag that includes the restaurant name, per
  // instructor's suggestion
  image.alt = image.alt = `Image of ${restaurant.name} restaurant`

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id, fillReviewsHTML);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews
  const container = document.getElementById('reviews-container');
  const noReviews = document.getElementById('no-reviews-message');

  // display form to add new review
  displayReviewForm(self.restaurant.id)

  // display reviews or message about why there aren't any to display
  // if offline with no reviews cached
  if (error) {
    console.log('in fillReviewsHTML and error retrieving restaurant reviews is ', error)
    noReviews.innerHTML = 'You seem to be offline with no cached reviews to display.';
  // if there aren't any reviews
  } else if (!reviews) {
    console.log('in fillReviewsHTML and no reviews found')
    noReviews.innerHTML = 'No reviews yet. Why not be a trendsetter?';
  //if there are reviews (live or cached)
  } else {
    console.log('in fillReviewsHTML and looping through reviews')
    const ul = document.getElementById('reviews-list');
    // reverse array to display newest first
    let sortedReviews = reviews.reverse()
    sortedReviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }
}

displayReviewForm = (restaurantId) => {
  const header = document.createElement('h3')
  header.innerHTML = 'Add a Review'

  const form = document.createElement('form')
  form.id = 'review-form'
  form.dataset.restaurantId = restaurantId

  let p = document.createElement('p')
  let label = document.createElement('label')
  label.setAttribute('for', 'review-name')
  label.innerHTML = 'Your Name:'
  p.append(label)
  const name = document.createElement('input')
  name.id = 'review-name'
  name.setAttribute('type', 'text')
  name.setAttribute('required', true)
  p.appendChild(name)
  form.appendChild(p)

  p = document.createElement('p')
  label = document.createElement('label')
  label.setAttribute('for', 'review-rating')
  label.innerHTML = 'Review (1-5):'
  p.append(label)
  const rating = document.createElement('input')
  rating.id = 'review-rating'
  rating.setAttribute('type', 'number')
  rating.setAttribute('required', true)
  rating.setAttribute('min', '1')
  rating.setAttribute('max', '5')
  p.appendChild(rating)
  form.appendChild(p)

  p = document.createElement('p')
  label = document.createElement('label')
  label.setAttribute('for', 'review-comments')
  label.innerHTML = 'Comments:'
  p.append(label)
  const comments = document.createElement('textarea')
  comments.id = 'review-comments'
  comments.setAttribute('required', true)
  p.appendChild(comments)
  form.appendChild(p)

  p = document.createElement('p')
  const saveButton = document.createElement('button')
  saveButton.id = 'save-review-button'
  saveButton.setAttribute('type', 'submit')
  saveButton.innerHTML = "Save Review"
  p.appendChild(saveButton)
  form.appendChild(p)

  form.onsubmit = e => {
    e.preventDefault()
    const review = validateFormData(restaurantId)
    if (!review) {
      console.log('something was wrong with that data')
    } else
    console.log(review)
    // DBHelper.addReview(review)
    // TODO: create that function to add the review. If it's successful, clear the form.
    DBHelper.saveReview(self.restaurant.id, review, displayNewReview, fillReviewsHTML)

  }

  const formContainer = document.getElementById('review-form-container')
  formContainer.append(header)
  formContainer.append(form)

}

validateFormData = (restaurantId) => {
  const name = document.getElementById('review-name').value
  const rating = parseInt(document.getElementById('review-rating').value)
  const comments = document.getElementById('review-comments').value
  // const createdAt = new Date().toISOString()
  // console.log(`createdAt is `, createdAt)
  if (!name || !rating || !comments) {
    if (!name) {
      alert('Name is required. Please try again.')
    }
    if (!rating) {
      alert('Rating is required. Please try again.')
    }
    if (!comments) {
      alert('Comments are required. Please try again.')
    }
    console.log('something missing')
  } else {
    const review = {
      restaurant_id: restaurantId,
      name: name,
      rating: rating,
      comments: comments,
      createdAt: Date.now(),
      id: Date.now()
    }
    return review
  }
}

/**
 * Create review HTML and add it to the webpage.
 * Called from DBHelper.saveReview() to add restaurant to
 * list without a new fetch.
 */
displayNewReview = (offlineStatus, review) => {
  console.log('offline status of review saved is: ', offlineStatus)
  if (review) {
    // clear the form
    document.getElementById('review-form').reset();
    // create a new li with this new review
    console.log('in displayNewReview and new review is: ', review)
    // put the new review at the top of the list right after the form so it's
    // obvious it was saved
    const reviewForm = document.getElementById('review-form-container')
    reviewForm.after(createReviewHTML(review, offlineStatus))
  } else {
    console.log('no review returned for some reason')
  }
}
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, offlineStatus) => {

  console.log( `offlineStatus is `, offlineStatus)
  // change undefined and string false to false
  if (offlineStatus === undefined || offlineStatus === "false") {
    offlineStatus = false
  }
  console.log( `new offlineStatus is `, offlineStatus)
  const li = document.createElement('li');
  li.classList.toggle('offline', offlineStatus)
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  let reviewDate = new Date(review.createdAt)
  const months = [
      'January', 'February', 'March',
      'April', 'May', 'June',
      'July', 'August', 'September',
      'October', 'November', 'December'
    ]
  const date = document.createElement('p');
  date.innerHTML = `${months[reviewDate.getMonth()]} ${reviewDate.getDate()}, ${reviewDate.getFullYear()}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
