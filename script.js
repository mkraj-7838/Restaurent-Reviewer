let restaurants = [];
let map;
let userLocation = null;
let mapVisible = false;
let markersCluster = null;

// DOM Elements
const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const logoutBtn = document.getElementById("logout-btn");
const loadingIndicator = document.getElementById("loading");
const searchInput = document.getElementById("search");
const notReviewedList = document.getElementById("not-reviewed-list");
const reviewedList = document.getElementById("reviewed-list");
const mapContainer = document.getElementById("map-container");
const toggleMapBtn = document.getElementById("toggle-map-btn");
const sortDistanceBtn = document.getElementById("sort-distance-btn");
const refreshBtn = document.getElementById("refresh-btn");
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modal-backdrop");

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Event listeners
  logoutBtn.addEventListener("click", logout);
  toggleMapBtn.addEventListener("click", toggleMap);
  sortDistanceBtn.addEventListener("click", sortRestaurantsByDistance);
  refreshBtn.addEventListener("click", loadRestaurants);
  searchInput.addEventListener("input", handleSearch);
  modalBackdrop.addEventListener("click", closeModal);
  modal.querySelector("button").addEventListener("click", closeModal);

  // Check if user is already logged in
  if (localStorage.getItem("token")) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    initMap();
    getUserLocation();
  }
});

// Login function
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const authError = document.getElementById("auth-error");

  if (!username || !password) {
    authError.textContent = "Please enter both username and password";
    return;
  }

  try {
    authError.textContent = "";
    loadingIndicator.classList.remove("hidden");

    const response = await fetch("https://restaurent-reviewer.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    initMap();
    getUserLocation();
  } catch (error) {
    authError.textContent =
      error.message || "Error logging in. Please try again.";
    console.error("Login error:", error);
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  authSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("auth-error").textContent = "";

  // Clean up map
  if (map) {
    map.remove();
    map = null;
  }
}

// Initialize map
function initMap() {
  if (map) return;

  map = L.map("map").setView([28.6, 77.2], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Initialize marker cluster group
  markersCluster = L.markerClusterGroup();
  map.addLayer(markersCluster);
}

// Toggle map visibility
function toggleMap() {
  mapVisible = !mapVisible;

  if (mapVisible) {
    mapContainer.classList.remove("hidden");
    toggleMapBtn.textContent = "Hide Map";
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  } else {
    mapContainer.classList.add("hidden");
    toggleMapBtn.textContent = "Show Map";
  }
}

// Get user location
function getUserLocation() {
  if (!navigator.geolocation) {
    alert(
      "Geolocation is not supported by your browser. Using default location."
    );
    loadRestaurants();
    return;
  }

  loadingIndicator.classList.remove("hidden");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      if (map) {
        map.setView(userLocation, 13);
      }
      loadRestaurants();
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location. Using default view.");
      loadRestaurants();
    }
  );
}

// Load restaurants from API
async function loadRestaurants() {
  try {
    loadingIndicator.classList.remove("hidden");

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    // Build query string
    const queryParams = new URLSearchParams();
    if (userLocation) {
      queryParams.append("userLat", userLocation[0]);
      queryParams.append("userLng", userLocation[1]);
    }

    const url = `https://restaurent-reviewer.onrender.com/api/restaurants?${queryParams.toString()}`;
    console.log("Fetching restaurants from:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("API response data:", data);

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received from server");
    }

    // Process restaurant data
    restaurants = data.map((restaurant) => ({
      ...restaurant,
      // Ensure all required fields exist
      _id: restaurant._id || restaurant.id || "",
      Res_Name: restaurant.Res_Name || restaurant.name || "N/A",
      Cuisines: restaurant.Cuisines || restaurant.cuisines || "N/A",
      Address: restaurant.Address || restaurant.address || "N/A",
      Latitude: restaurant.Latitude || restaurant.latitude || null,
      Longitude: restaurant.Longitude || restaurant.longitude || null,
      Del_Rating: restaurant.Del_Rating || restaurant.rating || null,
      distance: restaurant.distance || null,
      reviewed: restaurant.reviewed || false,
    }));

    console.log("Processed restaurants:", restaurants);
    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error loading restaurants:", error);

    // Handle specific error cases
    if (error.message.includes("401")) {
      alert("Session expired. Please login again.");
      logout();
    } else {
      alert(`Error loading restaurants: ${error.message}`);
    }
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Display restaurants in tables and on map
function displayRestaurants(data) {
  // Clear existing markers
  if (markersCluster) {
    markersCluster.clearLayers();
  }

  // Filter restaurants
  const notReviewed = data.filter((r) => !r.reviewed);
  const reviewed = data.filter((r) => r.reviewed);

  // Safely update counts in headers
  const notReviewedCountEl = document.querySelector(
    "[data-not-reviewed-count]"
  );
  const reviewedCountEl = document.querySelector("[data-reviewed-count]");

  if (notReviewedCountEl) {
    notReviewedCountEl.textContent = notReviewed.length;
  }

  if (reviewedCountEl) {
    reviewedCountEl.textContent = reviewed.length;
  }
  // Render not reviewed restaurants
  notReviewedList.innerHTML = notReviewed
    .map(
      (restaurant) => `
    <tr class="hover:bg-blue-50 transition-colors" data-id="${restaurant._id}">
      <td class="p-3 text-gray-800 font-medium">${
        restaurant.Res_Name || "N/A"
      }</td>
      <td class="p-3 text-gray-600">${restaurant.Cuisines || "N/A"}</td>
      <td class="p-3 text-gray-600">${
        restaurant.Del_Rating ? restaurant.Del_Rating.toFixed(1) : "N/A"
      }</td>
      <td class="p-3 text-gray-600">${
        restaurant.distance ? restaurant.distance.toFixed(2) + " km" : "N/A"
      }</td>
      <td class="p-3">
        <label class="inline-flex items-center cursor-pointer">
          <input type="checkbox" onchange="updateReview('${
            restaurant._id
          }', this.checked)" 
                 class="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-5 w-5">
        </label>
      </td>
    </tr>
  `
    )
    .join("");

  // Render reviewed restaurants
  reviewedList.innerHTML = reviewed
    .map(
      (restaurant) => `
    <tr class="hover:bg-green-50 transition-colors" data-id="${restaurant._id}">
      <td class="p-3 text-gray-800 font-medium">${
        restaurant.Res_Name || "N/A"
      }</td>
      <td class="p-3 text-gray-600">${restaurant.Cuisines || "N/A"}</td>
      <td class="p-3 text-gray-600">${
        restaurant.Del_Rating ? restaurant.Del_Rating.toFixed(1) : "N/A"
      }</td>
      <td class="p-3 text-gray-600">${
        restaurant.distance ? restaurant.distance.toFixed(2) + " km" : "N/A"
      }</td>
      <td class="p-3">
        <label class="inline-flex items-center cursor-pointer">
          <input type="checkbox" checked onchange="updateReview('${
            restaurant._id
          }', this.checked)" 
                 class="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-5 w-5">
        </label>
      </td>
    </tr>
  `
    )
    .join("");

  // Add click handlers to rows
  document
    .querySelectorAll("#not-reviewed-list tr, #reviewed-list tr")
    .forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          const restaurantId = row.getAttribute("data-id");
          const restaurant = data.find((r) => r._id === restaurantId);
          if (restaurant) showModal(restaurant);
        }
      });
    });

  // Update map markers
  updateMapMarkers(data);
}

// Update map markers
function updateMapMarkers(data) {
  if (!map || !markersCluster) return;

  // Clear existing markers
  markersCluster.clearLayers();

  // Add user location marker if available
  if (userLocation) {
    const userMarker = L.marker(userLocation, {
      icon: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).bindPopup("<b>Your Location</b>");
    markersCluster.addLayer(userMarker);
  }

  // Add restaurant markers
  data.forEach((restaurant) => {
    if (restaurant.Latitude && restaurant.Longitude) {
      const iconUrl = restaurant.reviewed
        ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
        : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";

      const marker = L.marker([restaurant.Latitude, restaurant.Longitude], {
        icon: L.icon({
          iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
      }).bindPopup(`
        <b>${restaurant.Res_Name || "N/A"}</b><br>
        ${restaurant.Address || ""}<br>
        <b>Rating:</b> ${
          restaurant.Del_Rating ? restaurant.Del_Rating.toFixed(1) : "N/A"
        }<br>
        <b>Status:</b> ${restaurant.reviewed ? "Reviewed" : "Not Reviewed"}
      `);

      markersCluster.addLayer(marker);
    }
  });

  // Fit bounds to show all markers
  if (data.length > 0 && markersCluster.getLayers().length > 0) {
    map.fitBounds(markersCluster.getBounds(), { padding: [50, 50] });
  }
}

// Sort restaurants by distance
function sortRestaurantsByDistance() {
  if (!userLocation) {
    alert("Please allow location access to sort by distance");
    return;
  }

  const sorted = [...restaurants].sort((a, b) => {
    if (a.reviewed === b.reviewed) {
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    return a.reviewed ? 1 : -1;
  });

  displayRestaurants(sorted);
}

// Handle search input
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = restaurants.filter(
    (r) =>
      (r.Res_Name && r.Res_Name.toLowerCase().includes(query)) ||
      (r.Cuisines && r.Cuisines.toLowerCase().includes(query)) ||
      (r.Address && r.Address.toLowerCase().includes(query))
  );
  displayRestaurants(filtered);
}

// Show restaurant details modal
function showModal(restaurant) {
  // Set modal content
  document.getElementById("modal-title").textContent =
    restaurant.Res_Name || "N/A";
  document.getElementById("modal-mobile").textContent =
    restaurant.Mobile || "N/A";
  document.getElementById("modal-phone").textContent =
    restaurant.Phone || "N/A";
  document.getElementById("modal-address").textContent =
    restaurant.Address || "N/A";
  document.getElementById("modal-opening-hours").textContent =
    restaurant.Opening_Hours || "N/A";
  document.getElementById("modal-cuisines").textContent =
    restaurant.Cuisines || "N/A";
  document.getElementById("modal-distance").textContent = restaurant.distance
    ? `${restaurant.distance.toFixed(2)} km`
    : "N/A";

  // Set Google Maps link
  const googleMapsLink =
    restaurant.Latitude && restaurant.Longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          restaurant.Res_Name + ", " + restaurant.Address
        )}`
      : "#";
  document.getElementById("modal-google-maps").href = googleMapsLink;

  // Set image if available
  const imageContainer = document.getElementById("modal-image-container");
  const image = document.getElementById("modal-image");
  if (restaurant.Rest_Image && restaurant.Rest_Image !== "N/A") {
    image.src = restaurant.Rest_Image;
    imageContainer.classList.remove("hidden");
  } else {
    imageContainer.classList.add("hidden");
  }

  // Show modal with animation
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }, 10);
}

// Close modal
function closeModal() {
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Update review status
async function updateReview(restaurantId, reviewed) {
  try {
    loadingIndicator.classList.remove("hidden");

    const response = await fetch(
      `https://restaurent-reviewer.onrender.com/api/restaurants/review/${restaurantId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reviewed }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update review status");
    }

    // Update local data and refresh display
    const restaurant = restaurants.find((r) => r._id === restaurantId);
    if (restaurant) {
      restaurant.reviewed = reviewed;
    }
    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error updating review:", error);
    alert("Error updating review status. Please try again.");
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}
