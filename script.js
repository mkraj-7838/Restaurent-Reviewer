let restaurants = [];
let userLocation = null;
let currentUser = null; // Store the logged-in username
let currentRestaurantId = null; // Store restaurant ID for review submission

// DOM Elements with null checks
const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const logoutBtn = document.getElementById("logout-btn");
const loadingIndicator = document.getElementById("loading");
const searchInput = document.getElementById("search");
const notReviewedList = document.getElementById("not-reviewed-list");
const reviewedList = document.getElementById("reviewed-list");
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

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  if (!authSection || !mainSection || !logoutBtn || !loadingIndicator || !searchInput ||
      !notReviewedList || !reviewedList || !sortDistanceBtn || !refreshBtn || !modal || !modalBackdrop) {
    console.error("Required DOM elements are missing");
    return;
  }

  // Event listeners
  logoutBtn.addEventListener("click", logout);
  sortDistanceBtn.addEventListener("click", sortRestaurantsByDistance);
  refreshBtn.addEventListener("click", loadRestaurants);
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  modalBackdrop.addEventListener("click", closeModal);
  modal.querySelector("button").addEventListener("click", closeModal);

  // Check if user is already logged in
  if (localStorage.getItem("token")) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    getUserLocation();
  }
});

// Login function
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

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    currentUser = username; // Store the username
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

// Logout function
function logout() {
  localStorage.removeItem("token");
  currentUser = null; // Clear current user
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
  if (searchInput) searchInput.value = "";
}

// Get user location
function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser. Using default location.");
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
      alert("Unable to retrieve your location. Using default view.");
      loadRestaurants();
      loadingIndicator.classList.add("hidden");
    },
    { timeout: 10000 }
  );
}

// Load restaurants from API
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

    const response = await fetch(`http://localhost:5000/api/restaurants?${queryParams.toString()}`, {
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
      Cuisines: restaurant.Cuisines || restaurant.cuisines || "Unknown",
      Address: restaurant.Address || restaurant.address || "Unknown",
      Latitude: parseFloat(restaurant.Latitude || restaurant.latitude) || null,
      Longitude: parseFloat(restaurant.Longitude || restaurant.longitude) || null,
      Del_Rating: parseFloat(restaurant.Del_Rating || restaurant.rating) || null,
      distance: parseFloat(restaurant.distance) || null,
      reviewed: !!restaurant.reviewed,
      reviewedBy: restaurant.reviewedBy || null,
      Mobile: restaurant.Mobile || null,
      Phone: restaurant.Phone || null,
      Opening_Hours: restaurant.Opening_Hours || null,
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

// Display restaurants in tables
function displayRestaurants(data) {
  if (!notReviewedList || !reviewedList) return;

  const notReviewed = data.filter((r) => !r.reviewed);
  const reviewed = data.filter((r) => r.reviewed);

  const notReviewedCountEl = document.querySelector("[data-not-reviewed-count]");
  const reviewedCountEl = document.querySelector("[data-reviewed-count]");
  if (notReviewedCountEl) notReviewedCountEl.textContent = notReviewed.length;
  if (reviewedCountEl) reviewedCountEl.textContent = reviewed.length;

  const createRow = (restaurant) => `
    <tr class="hover:bg-${restaurant.reviewed ? 'green' : 'blue'}-50 transition-colors duration-200" data-id="${restaurant._id}">
      <td class="p-2 sm:p-3 text-gray-800 font-medium text-sm sm:text-base" data-label="Name">${sanitizeHTML(restaurant.Res_Name)}</td>
      <td class="p-2 sm:p-3 text-gray-600 text-sm sm:text-base" data-label="Distance">${restaurant.distance ? restaurant.distance.toFixed(2) + " km" : "N/A"}</td>
      <td class="p-2 sm:p-3 text-gray-600 text-sm sm:text-base" data-label="Map">
        ${restaurant.Latitude && restaurant.Longitude ? 
          `<a href="https://www.google.com/maps?q=${restaurant.Latitude},${restaurant.Longitude}" target="_blank" class="text-blue-500 hover:text-blue-700">Maps link</a>` 
          : "N/A"}
      </td>
      <td class="p-2 sm:p-3 text-sm sm:text-base" data-label="Details">
        <button onclick="showModal('${restaurant._id}')" class="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-lg hover:bg-blue-600 transition duration-200 text-xs sm:text-sm">
          Details
        </button>
      </td>
    </tr>
  `;

  notReviewedList.innerHTML = notReviewed.map(createRow).join("");
  reviewedList.innerHTML = reviewed.map(createRow).join("");
}

// Sanitize HTML input
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
  const query = sanitizeHTML(e.target.value.toLowerCase());
  const filtered = restaurants.filter(
    (r) =>
      (r.Res_Name && r.Res_Name.toLowerCase().includes(query)) ||
      (r.Address && r.Address.toLowerCase().includes(query))
  );
  displayRestaurants(filtered);
}

// Toggle review form visibility
function toggleReviewForm(show) {
  const reviewSection = document.getElementById("review-section");
  const editReviewBtn = document.getElementById("edit-review-btn");
  if (reviewSection && editReviewBtn) {
    reviewSection.classList.toggle("hidden", !show);
    editReviewBtn.classList.toggle("hidden", show);
  }
}

// Show restaurant details modal
function showModal(restaurantId) {
  const restaurant = restaurants.find((r) => r._id === restaurantId);
  if (!modal || !restaurant) return;

  currentRestaurantId = restaurantId; // Store restaurant ID for review submission

  document.getElementById("modal-title").textContent = restaurant.Res_Name || "N/A";
  document.getElementById("modal-mobile").textContent = restaurant.Mobile || "N/A";
  document.getElementById("modal-phone").textContent = restaurant.Phone || "N/A";
  document.getElementById("modal-address").textContent = restaurant.Address || "N/A";
  document.getElementById("modal-opening-hours").textContent = restaurant.Opening_Hours || "N/A";
  document.getElementById("modal-cuisines").textContent = restaurant.Cuisines || "N/A";
  document.getElementById("modal-distance").textContent = restaurant.distance
    ? `${restaurant.distance.toFixed(2)} km`
    : "N/A";
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

  // Show edit button if reviewed, otherwise show review form
  toggleReviewForm(!restaurant.reviewed);
  editReviewBtn.classList.toggle("hidden", !restaurant.reviewed);

  // Add event listeners
  submitReviewBtn.onclick = () => submitReview(restaurantId);
  editReviewBtn.onclick = () => toggleReviewForm(true);

  const googleMapsLink = restaurant.Latitude && restaurant.Longitude
    ? `https://www.google.com/maps?q=${restaurant.Latitude},${restaurant.Longitude}`
    : "#";
  document.getElementById("modal-google-maps").href = googleMapsLink;

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }, 10);
}

// Close modal
function closeModal() {
  if (!modal) return;

  modal.classList.remove("flex");
  document.body.style.overflow = "";
  currentRestaurantId = null; // Clear restaurant ID
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Submit review from modal
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

    const response = await fetch(`http://localhost:5000/api/restaurants/review/${restaurantId}`, {
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
      toggleReviewForm(!reviewed); // Hide form if reviewed
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