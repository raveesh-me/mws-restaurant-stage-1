let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  //Need to reset it to HTML to handle multiple runs of this command
  select.innerHTML = '<option value="all">All Neighborhoods</option>';
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  //Need to reset it to HTML to handle multiple runs of this command
  select.innerHTML = '<option value="all">All Cuisines</option>';
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
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

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  const imageBaseURL = DBHelper.imageUrlForRestaurant(restaurant);
  const imgParts = imageBaseURL.split('.');
  const smallImageUrl = imgParts[0]+ '-small.' + imgParts[1];
  const mediumImageUrl = imgParts[0]+ '-medium.' + imgParts[1];
  const largeImageUrl = imgParts[0]+ '-large.' + imgParts[1];
  image.alt = `Photo of ${restaurant.name}`;
  image.src = imageBaseURL;
  image.srcset = `${smallImageUrl} 260w, ${mediumImageUrl} 420w, ${largeImageUrl} 800w`;
  image.sizes = "(max-width: 480px) calc(100vw - 30px), 260px";
  li.append(image);

  const favorite = document.createElement('div');
  favorite.id = `favorite-heart-${restaurant.id}`;
  favorite.setAttribute("role", "chekcbox");
  favorite.setAttribute("tabindex", "0");
  favorite.setAttribute("aria-label", `Toggle ${restaurant.name} as your favorite`);
  favorite.setAttribute("aria-checked", restaurant.is_favorite);
  if(restaurant.is_favorite === "true"){
    favorite.innerHTML = '<i class="fas fa-heart"></i>';
  }else{
    favorite.innerHTML = '<i class="far fa-heart"></i>';
  }

  favorite.onclick = function(){
    console.log(`Heart touched`);
    DBHelper.toggleHTMLFavorite(restaurant, ()=>{
      //successcallback
      changeHeart(favorite);
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
          console.log(response);
          if(response.ok){
            changeHeart(favorite);
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

  li.append(favorite);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View ${restaurant.name} details`);
  li.append(more);
  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
