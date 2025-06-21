let restaurants = [];
let userLocation = null;
let currentUser = null;
let currentRestaurantId = null;
let showReviewed = false;

// DOM Elements
const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const logoutBtn = document.getElementById("logout-btn");
const loadingIndicator = document.getElementById("loading");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clear-search");
const restaurantList = document.getElementById("restaurant-list");
const tableTitle = document.getElementById("table-title");
const tableCount = document.getElementById("table-count");
const toggleNotReviewed = document.getElementById("toggle-not-reviewed");
const toggleReviewed = document.getElementById("toggle-reviewed");
const sortDistanceBtn = document.getElementById("sort-distance-btn");
const refreshBtn = document.getElementById("refresh-btn");
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modal-backdrop");

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (!authSection || !mainSection || !logoutBtn || !loadingIndicator || !searchInput ||
      !clearSearchBtn || !restaurantList || !tableTitle || !tableCount || !toggleNotReviewed ||
      !toggleReviewed || !sortDistanceBtn || !refreshBtn || !modal || !modalBackdrop) {
    console.error("Required DOM elements are missing");
    return;
  }

  // Event listeners
  logoutBtn.addEventListener("click", logout);
  sortDistanceBtn.addEventListener("click", sortRestaurantsByDistance);
  refreshBtn.addEventListener("click", loadRestaurants);
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    displayRestaurants(restaurants);
  });
  searchInput.addEventListener("input", () => {
    clearSearchBtn.classList.toggle("hidden", !searchInput.value);
  });
  modalBackdrop.addEventListener("click", closeModal);
  modal.querySelector("button").addEventListener("click", closeModal);
  toggleNotReviewed.addEventListener("click", () => toggleView(false));
  toggleReviewed.addEventListener("click", () => toggleView(true));

  // Check login status
  if (localStorage.getItem("token")) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    getUserLocation();
  }
});

// Toggle table view
function toggleView(showReviewedNew) {
  showReviewed = showReviewedNew;
  toggleNotReviewed.classList.toggle("bg-blue-600", !showReviewed);
  toggleNotReviewed.classList.toggle("bg-gray-300", showReviewed);
  toggleNotReviewed.classList.toggle("text-white", !showReviewed);
  toggleNotReviewed.classList.toggle("text-gray-800", showReviewed);
  toggleReviewed.classList.toggle("bg-blue-600", showReviewed);
  toggleReviewed.classList.toggle("bg-gray-300", !showReviewed);
  toggleReviewed.classList.toggle("text-white", showReviewed);
  toggleReviewed.classList.toggle("text-gray-800", !showReviewed);
  displayRestaurants(restaurants);
}

// Login
async function login() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const authError = document.getElementById("auth-error");

  if (!usernameInput || !passwordInput || !authError) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    currentUser = username;
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    getUserLocation();
  } catch (error) {
    authError.textContent = error.message || "Error logging in. Please try again.";
    console.error("Login error:", error);
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  currentUser = null;
  authSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const authError = document.getElementById("auth-error");
  
  if (usernameInput) usernameInput.value = "";
  if (passwordInput) passwordInput.value = "";
  if (authError) authError.textContent = "";

  restaurants = [];
  if (searchInput) {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
  }
}

// Get user location
function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    loadRestaurants();
    return;
  }

  loadingIndicator.classList.remove("hidden");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      loadRestaurants();
      loadingIndicator.classList.add("hidden");
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location.");
      loadRestaurants();
      loadingIndicator.classList.add("hidden");
    },
    { timeout: 10000 }
  );
}

// Load restaurants
async function loadRestaurants() {
  try {
    loadingIndicator.classList.remove("hidden");
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    const queryParams = new URLSearchParams();
    if (userLocation) {
      queryParams.append("userLat", userLocation[0]);
      queryParams.append("userLng", userLocation[1]);
    }

    const response = await fetch(`https://restaurent-reviewer.onrender.com/api/restaurants?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received from server");
    }

    restaurants = data.map((restaurant) => ({
      _id: restaurant._id || restaurant.id || crypto.randomUUID(),
      Res_Name: restaurant.Res_Name || restaurant.name || "Unknown",
      Address: restaurant.Address || restaurant.address || "Unknown",
      Latitude: parseFloat(restaurant.Latitude || restaurant.latitude) || null,
      Longitude: parseFloat(restaurant.Longitude || restaurant.longitude) || null,
      distance: parseFloat(restaurant.distance) || null,
      Mobile: restaurant.Mobile || null,
      reviewed: !!restaurant.reviewed,
      reviewedBy: restaurant.reviewedBy || null,
    }));

    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error loading restaurants:", error);
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

// Display restaurants
function displayRestaurants(data) {
  if (!restaurantList || !tableTitle || !tableCount) return;

  const filtered = showReviewed ? data.filter((r) => r.reviewed) : data.filter((r) => !r.reviewed);
  tableTitle.innerHTML = `
    <span id="table-count" class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">${filtered.length}</span>
    ${showReviewed ? "Reviewed Restaurants" : "Restaurants to Review"}
  `;
  
  const createRow = (restaurant) => `
    <tr class="hover:bg-${restaurant.reviewed ? 'green' : 'blue'}-50 transition-colors duration-200" data-id="${restaurant._id}">
      <td class="font-medium">${sanitizeHTML(restaurant.Res_Name)}</td>
      <td>${restaurant.distance ? restaurant.distance.toFixed(2) + " km" : "N/A"}</td>
      <td>
        ${restaurant.Latitude && restaurant.Longitude && userLocation ? 
          `<button onclick="openMap('${restaurant.Latitude}', '${restaurant.Longitude}')" class="icon-btn text-blue-600 hover:text-blue-800">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
             </svg>
           </button>` 
          : "N/A"}
      </td>
      <td>
        <button onclick="showModal('${restaurant._id}')" class="icon-btn text-blue-600 hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </td>
    </tr>
  `;

  restaurantList.innerHTML = filtered.map(createRow).join("");
}

// Open Google Maps directions
function openMap(destLat, destLng) {
  if (!userLocation) {
    alert("User location not available. Please allow location access.");
    return;
  }
  const origin = `${userLocation[0]},${userLocation[1]}`;
  const destination = `${destLat},${destLng}`;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  window.open(url, "_blank");
}

// Sanitize HTML
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Sort by distance
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

// Handle search
function handleSearch(e) {
  const query = sanitizeHTML(e.target.value.toLowerCase());
  const filtered = restaurants.filter(
    (r) =>
      (r.Res_Name && r.Res_Name.toLowerCase().includes(query)) ||
      (r.Address && r.Address.toLowerCase().includes(query))
  );
  displayRestaurants(filtered);
}

// Toggle review form
function toggleReviewForm(show) {
  const reviewSection = document.getElementById("review-section");
  const editReviewBtn = document.getElementById("edit-review-btn");
  if (reviewSection && editReviewBtn) {
    reviewSection.classList.toggle("hidden", !show);
    editReviewBtn.classList.toggle("hidden", show);
  }
}

// Show modal
function showModal(restaurantId) {
  const restaurant = restaurants.find((r) => r._id === restaurantId);
  if (!modal || !restaurant) return;

  currentRestaurantId = restaurantId;

  document.getElementById("modal-title").textContent = restaurant.Res_Name || "N/A";
  document.getElementById("modal-address").textContent = restaurant.Address || "N/A";
  document.getElementById("modal-mobile").textContent = restaurant.Mobile || "N/A";
  document.getElementById("modal-review-status").textContent = restaurant.reviewed ? "Reviewed" : "Not Reviewed";
  document.getElementById("modal-reviewed-by").textContent = restaurant.reviewedBy || "N/A";

  const reviewCheckbox = document.getElementById("modal-review-checkbox");
  const reviewerNameInput = document.getElementById("modal-reviewer-name");
  const submitReviewBtn = document.getElementById("modal-submit-review");
  const reviewError = document.getElementById("modal-review-error");
  const editReviewBtn = document.getElementById("edit-review-btn");

  reviewCheckbox.checked = restaurant.reviewed;
  reviewerNameInput.value = restaurant.reviewedBy || currentUser || "";
  reviewError.textContent = "";

  toggleReviewForm(!restaurant.reviewed);
  editReviewBtn.classList.toggle("hidden", !restaurant.reviewed);

  submitReviewBtn.onclick = () => submitReview(restaurantId);
  editReviewBtn.onclick = () => toggleReviewForm(true);

  if (restaurant.Latitude && restaurant.Longitude && userLocation) {
    const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${restaurant.Latitude},${restaurant.Longitude}&travelmode=driving`;
    document.getElementById("modal-google-maps").href = googleMapsLink;
  } else {
    document.getElementById("modal-google-maps").href = "#";
  }

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    modal.querySelector(".popup-enter").classList.remove("popup-exit");
  }, 10);
}

// Close modal
function closeModal() {
  if (!modal) return;

  modal.querySelector(".popup-enter").classList.add("popup-exit");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  currentRestaurantId = null;
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.querySelector(".popup-enter").classList.remove("popup-exit");
  }, 300);
}

// Submit review
async function submitReview(restaurantId) {
  const reviewCheckbox = document.getElementById("modal-review-checkbox");
  const reviewerNameInput = document.getElementById("modal-reviewer-name");
  const reviewError = document.getElementById("modal-review-error");

  if (!reviewCheckbox || !reviewerNameInput || !reviewError) return;

  const reviewed = reviewCheckbox.checked;
  const reviewedBy = reviewerNameInput.value.trim();

  if (reviewed && !reviewedBy) {
    reviewError.textContent = "Please enter reviewer name";
    return;
  }

  if (!confirm(`Are you sure you want to ${reviewed ? "mark as reviewed" : "remove review for"} this restaurant?`)) {
    return;
  }

  try {
    loadingIndicator.classList.remove("hidden");
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    const response = await fetch(`https://restaurent-reviewer.onrender.com/api/restaurants/review/${restaurantId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reviewed, reviewedBy: reviewed ? reviewedBy : null }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update review status");
    }

    const restaurant = restaurants.find((r) => r._id === restaurantId);
    if (restaurant) {
      restaurant.reviewed = reviewed;
      restaurant.reviewedBy = reviewed ? reviewedBy : null;
      document.getElementById("modal-review-status").textContent = reviewed ? "Reviewed" : "Not Reviewed";
      document.getElementById("modal-reviewed-by").textContent = reviewedBy || "N/A";
      reviewError.textContent = "";
      toggleReviewForm(!reviewed);
    }
    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error updating review:", error);
    reviewError.textContent = error.message || "Failed to update review";
    if (error.message.includes("401")) {
      alert("Session expired. Please login again.");
      logout();
    }
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}