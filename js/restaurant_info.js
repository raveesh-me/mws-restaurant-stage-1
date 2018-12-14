let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

window.addEventListener("DOMContentLoaded", () => {
  let form = document.getElementById('review-form');
  let formRestaurantId = document.getElementById('restaurant-id');
  let formRating = document.getElementById('form-rating');
  let formName = document.getElementById('form-name');
  let formComments = document.getElementById('form-comments');

  form.addEventListener("submit", event => {
    event.preventDefault();
    const message = {
      "restaurant_id": formRestaurantId.value,
      "name": formName.value,
      "rating": formRating.value,
      "comments": formComments.value
    }
    DBHelper.submitReview(message, ()=>{
      let restaurant = self.restaurant;
      //cleanFormCallback
      formRating.value = '1';
      formName.value = '';
      formComments.value = '';
      message.createdAt = new Date();
      restaurant.reviews.push(message);
      fillReviewsHTML();
    }, ()=>{
      //submit form callback
      //For when sync wont work / is unavailable
      fetch(`${DBHelper.DATABASE_URL}/reviews`, {
        //runs the fetch method
        method: 'post',
        body: message,
      }).then(response => {
        //checks if response returned something
        if(response.statusText === 'Created'){
          return response.json();
        }else{
          console.log(`can not post review`);
          return;
        }
      }).then(data => {
        //gets data and displays it on the dom
        if(!data) return;
        restaurant.reviews.push(data);
        fillReviewsHTML();
      }).catch(error => {
        console.log(error);
      })
    });
  });
});
/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = new L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicmF2ZWVzaCIsImEiOiJjam1nMjEzeW42dDZzM2tsaTZxZnh5YnI4In0.PFrlTLrSURsL2xj7rpN4rw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

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

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
// image
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  const imageBaseURL = DBHelper.imageUrlForRestaurant(restaurant);
  const imgParts = imageBaseURL.split('.');
  const smallImageUrl = imgParts[0]+ '-banner-small.' + imgParts[1];
  const mediumImageUrl = imgParts[0]+ '-banner-medium.' + imgParts[1];
  const largeImageUrl = imgParts[0]+ '-banner-large.' + imgParts[1];
  image.alt = `Photo of ${restaurant.name}`;
  image.src = imageBaseURL;
  image.srcset = `${smallImageUrl} 260w, ${mediumImageUrl} 420w, ${largeImageUrl} 800w`;
  image.sizes = "100vw";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  //fill restaurant-id for form
  const restaurantID = document.getElementById('restaurant-id');
  restaurantID.value = restaurant.id;
  //Restaurant favorite heart
  const heart = document.getElementById("favorite-heart");
  heart.setAttribute("aria-label", `Toggle ${restaurant.name} as your favorite`);
  heart.setAttribute("aria-checked", restaurant.is_favorite);
  if(restaurant.is_favorite === "true"){
    heart.innerHTML = '<i class="fas fa-heart"></i>';
  }else{
    heart.innerHTML = '<i class="far fa-heart"></i>';
  }

  heart.onclick = function(){
    DBHelper.toggleHTMLFavorite(restaurant, ()=>{
      //successcallback
      changeHeart(heart);
    }, ()=>{
      //failure callback
      let newIsFavorite;
      if(restaurant.is_favorite === "true"){
        newIsFavorite = false;
      }else{
        newIsFavorite = true;
      }
      fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${newIsFavorite}`,
        {method: "PUT"}).then(response => {
          if(response.ok){
            changeHeart(heart);
          }else{
            console.log(`Something went wong`);
          }
        });
    });
  }

  const changeHeart = (heart)=>{
    let isChecked = heart.getAttribute("aria-checked");
    if(isChecked === "true"){
      heart.innerHTML = '<i class="far fa-heart"></i>';
      heart.setAttribute("aria-checked", false);
      restaurant.is_favorite = false;
    }else{
      heart.innerHTML = '<i class="fas fa-heart"></i>';
      heart.setAttribute("aria-checked", true);
      restaurant.is_favorite = true;
    }
  }

  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.innerHTML = '';
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
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  // const container = document.getElementById('reviews-container');
  const noReviews = document.getElementById('no-reviews');
  if (!reviews) {
    // const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    // container.appendChild(noReviews);
    return;
  }
  noReviews.innerHTML = '';
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  // container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const dateTime = new Date(review.createdAt);
  date.innerHTML = dateTime.toDateString();
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
