// const BASE_API_URL = "http://localhost:5000"; // Change to https://restaurent-reviewer.onrender.com for production
const BASE_API_URL = "https://restaurent-reviewer.onrender.com"; 


let restaurants = [];
let userLocation = null;
let currentUser = null;
let currentRestaurantId = null;
let currentView = 'not reviewed'; // Default view
const ITEMS_PER_PAGE = 25;
let paginationState = {
  'not reviewed': { currentPage: 1, totalPages: 1 },
  'assigned': { currentPage: 1, totalPages: 1 },
  'completed': { currentPage: 1, totalPages: 1 }
};

// DOM Elements
const authSection = document.getElementById("auth");
const mainSection = document.getElementById("main");
const logoutBtn = document.getElementById("logout-btn");
const loadingIndicator = document.getElementById("loading");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clear-search");
const restaurantListNotReviewed = document.getElementById("restaurant-list-not-reviewed");
const restaurantListAssigned = document.getElementById("restaurant-list-assigned");
const restaurantListCompleted = document.getElementById("restaurant-list-completed");
const tableCountNotReviewed = document.getElementById("table-count-not-reviewed");
const tableCountAssigned = document.getElementById("table-count-assigned");
const tableCountCompleted = document.getElementById("table-count-completed");
const toggleNotReviewed = document.getElementById("toggle-not-reviewed");
const toggleAssigned = document.getElementById("toggle-assigned");
const toggleCompleted = document.getElementById("toggle-completed");
const refreshBtn = document.getElementById("refresh-btn");
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modal-backdrop");
const notReviewedTable = document.getElementById("not-reviewed-table");
const assignedTable = document.getElementById("assigned-table");
const completedTable = document.getElementById("completed-table");
const notReviewedPagination = document.getElementById("not-reviewed-pagination");
const assignedPagination = document.getElementById("assigned-pagination");
const completedPagination = document.getElementById("completed-pagination");

// Format distance
function formatDistance(distance) {
  if (!distance) return 'N/A';
  if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
  return `${distance.toFixed(1)}km`;
}

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
  // Event listeners
  logoutBtn.addEventListener("click", logout);
  refreshBtn.addEventListener("click", loadRestaurants);
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    resetPagination();
    displayRestaurants(restaurants);
  });
  searchInput.addEventListener("input", () => {
    clearSearchBtn.classList.toggle("hidden", !searchInput.value);
  });
  modalBackdrop.addEventListener("click", closeModal);
  modal.querySelector("button.close-modal").addEventListener("click", closeModal);
  toggleNotReviewed.addEventListener("click", () => toggleView('not reviewed'));
  toggleAssigned.addEventListener("click", () => toggleView('assigned'));
  toggleCompleted.addEventListener("click", () => toggleView('completed'));

  const togglePasswordBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");
  togglePasswordBtn.addEventListener("click", () => {
    const isPasswordVisible = passwordInput.type === "text";
    passwordInput.type = isPasswordVisible ? "password" : "text";
    togglePasswordBtn.querySelector("i").classList.toggle("fa-eye", !isPasswordVisible);
    togglePasswordBtn.querySelector("i").classList.toggle("fa-eye-slash", isPasswordVisible);
  });

  // Check login status
  if (localStorage.getItem("token")) {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    getUserLocation();
  }
});

// Toggle table view
function toggleView(view) {
  currentView = view;

  // Update button styles
  toggleNotReviewed.classList.toggle("bg-indigo-600", view === 'not reviewed');
  toggleNotReviewed.classList.toggle("bg-slate-200", view !== 'not reviewed');
  toggleNotReviewed.classList.toggle("text-white", view === 'not reviewed');
  toggleNotReviewed.classList.toggle("text-slate-700", view !== 'not reviewed');
  toggleAssigned.classList.toggle("bg-amber-500", view === 'assigned');
  toggleAssigned.classList.toggle("bg-slate-200", view !== 'assigned');
  toggleAssigned.classList.toggle("text-white", view === 'assigned');
  toggleAssigned.classList.toggle("text-slate-700", view !== 'assigned');
  toggleCompleted.classList.toggle("bg-emerald-500", view === 'completed');
  toggleCompleted.classList.toggle("bg-slate-200", view !== 'completed');
  toggleCompleted.classList.toggle("text-white", view === 'completed');
  toggleCompleted.classList.toggle("text-slate-700", view !== 'completed');

  // Show/hide tables
  notReviewedTable.classList.toggle("hidden", view !== 'not reviewed');
  assignedTable.classList.toggle("hidden", view !== 'assigned');
  completedTable.classList.toggle("hidden", view !== 'completed');

  resetPagination();
  displayRestaurants(restaurants);
}

// Reset pagination for all views
function resetPagination() {
  paginationState['not reviewed'].currentPage = 1;
  paginationState['assigned'].currentPage = 1;
  paginationState['completed'].currentPage = 1;
}

// Login
async function login() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const authError = document.getElementById("auth-error");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    authError.textContent = "Please enter both username and password";
    return;
  }

  try {
    authError.textContent = "";
    loadingIndicator.classList.remove("hidden");

    const response = await fetch(`${BASE_API_URL}/api/auth/login`, {
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
  resetPagination();
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

    const response = await fetch(`${BASE_API_URL}/api/restaurants?${queryParams.toString()}`, {
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
      reviewStatus: restaurant.reviewStatus || 'not reviewed',
      reviewedBy: restaurant.reviewedBy || null,
    }));

    // Sort by distance by default
    restaurants.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    resetPagination();
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

// Create pagination controls
function createPaginationControls(totalItems, view, paginationContainer) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  paginationState[view].totalPages = totalPages;
  const currentPage = paginationState[view].currentPage;

  let paginationHTML = `
    <button class="pagination-btn ${currentPage === 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100'} rounded-l-lg px-3 py-1 border border-slate-300 text-sm" 
            onclick="changePage('${view}', ${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-btn ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'} px-3 py-1 border border-slate-300 text-sm" 
              onclick="changePage('${view}', ${i})">
        ${i}
      </button>
    `;
  }

  paginationHTML += `
    <button class="pagination-btn ${currentPage === totalPages ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100'} rounded-r-lg px-3 py-1 border border-slate-300 text-sm" 
            onclick="changePage('${view}', ${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(view, page) {
  if (page < 1 || page > paginationState[view].totalPages) return;
  paginationState[view].currentPage = page;
  displayRestaurants(restaurants);
}

// Display restaurants
function displayRestaurants(data) {
  const notReviewed = data.filter((r) => r.reviewStatus === 'not reviewed');
  const assigned = data.filter((r) => r.reviewStatus === 'assigned');
  const completed = data.filter((r) => r.reviewStatus === 'completed');

  const createRow = (restaurant) => {
    let statusBadge = '';
    if (restaurant.reviewStatus === 'assigned') {
      statusBadge = `<span class="badge badge-warning">Assigned</span>`;
    } else if (restaurant.reviewStatus === 'completed') {
      statusBadge = `<span class="badge badge-success">Completed</span>`;
    }
    
    return `
      <tr class="hover:bg-slate-50 transition-colors duration-200 animate-fadeIn" data-id="${restaurant._id}">
        <td class="font-medium">
          <div class="flex flex-col">
            <span>${restaurant.Res_Name || "N/A"}</span>
            <span class="text-xs text-slate-500 mt-1">${restaurant.Address || ""}</span>
          </div>
        </td>
        ${restaurant.reviewStatus === 'not reviewed' ? `
          <td class="text-center">
            <div class="flex justify-center space-x-2">
              ${restaurant.Latitude && restaurant.Longitude && userLocation ? `
                <button onclick="openMap('${restaurant.Latitude}', '${restaurant.Longitude}')" 
                        class="btn text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" 
                        title="View on map">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
              ` : ''}
              <button onclick="showModal('${restaurant._id}')" 
                      class="btn text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" 
                      title="View details">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </td>
        ` : `
          <td class="text-center text-sm text-slate-600">
            ${restaurant.reviewedBy || "N/A"}
          </td>
          <td class="text-center">
            <div class="flex justify-center space-x-2">
              ${restaurant.Latitude && restaurant.Longitude && userLocation ? `
                <button onclick="openMap('${restaurant.Latitude}', '${restaurant.Longitude}')" 
                        class="btn text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" 
                        title="View on map">
                  <i class="fas fa-map-marker-alt"></i>
                </button>
              ` : ''}
              <button onclick="showModal('${restaurant._id}')" 
                      class="btn text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50" 
                      title="View details">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </td>
        `}
      </tr>
    `;
  };

  // Paginate data
  const paginate = (array, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return array.slice(start, start + ITEMS_PER_PAGE);
  };

  // Display paginated data
  restaurantListNotReviewed.innerHTML = paginate(notReviewed, paginationState['not reviewed'].currentPage).map(createRow).join("");
  restaurantListAssigned.innerHTML = paginate(assigned, paginationState['assigned'].currentPage).map(createRow).join("");
  restaurantListCompleted.innerHTML = paginate(completed, paginationState['completed'].currentPage).map(createRow).join("");

  // Update table counts
  tableCountNotReviewed.textContent = notReviewed.length;
  tableCountAssigned.textContent = assigned.length;
  tableCountCompleted.textContent = completed.length;

  // Update pagination controls
  createPaginationControls(notReviewed.length, 'not reviewed', notReviewedPagination);
  createPaginationControls(assigned.length, 'assigned', assignedPagination);
  createPaginationControls(completed.length, 'completed', completedPagination);
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

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = restaurants.filter(
    (r) =>
      (r.Res_Name && r.Res_Name.toLowerCase().includes(query)) ||
      (r.Address && r.Address.toLowerCase().includes(query))
  );
  resetPagination();
  displayRestaurants(filtered);
}

// Toggle review form
function toggleReviewForm(show, status) {
  const reviewSection = document.getElementById("review-section");
  const reviewTitle = document.getElementById("review-title");
  const reviewerNameInput = document.getElementById("modal-reviewer-name");
  const reviewerNameText = document.getElementById("modal-reviewer-name-text");
  const submitReviewBtn = document.getElementById("modal-submit-review");
  const reviewFormLinkContainer = document.getElementById("review-form-link-container");
  
  reviewSection.classList.toggle("hidden", !show);
  reviewTitle.textContent = status === 'not reviewed' ? 'Assign this review' : 'Complete this review';
  submitReviewBtn.innerHTML = status === 'not reviewed' 
    ? '<i class="fas fa-user-edit mr-2"></i> Assign Reviewer' 
    : '<i class="fas fa-check-circle mr-2"></i> Mark as Completed';
  
  if (status === 'not reviewed') {
    reviewerNameInput.classList.remove("hidden");
    reviewerNameText.classList.add("hidden");
    reviewFormLinkContainer.classList.add("hidden");
  } else {
    reviewerNameInput.classList.add("hidden");
    reviewerNameText.classList.remove("hidden");
    reviewFormLinkContainer.classList.remove("hidden");
  }
}

// Show modal
function showModal(restaurantId) {
  const restaurant = restaurants.find((r) => r._id === restaurantId);
  if (!modal || !restaurant) return;

  currentRestaurantId = restaurantId;

  // Set modal content
  document.getElementById("modal-title").textContent = restaurant.Res_Name || "N/A";
  document.getElementById("modal-address").textContent = restaurant.Address || "N/A";
  document.getElementById("modal-mobile").textContent = restaurant.Mobile || "N/A";
  document.getElementById("modal-reviewed-by").textContent = restaurant.reviewedBy || "N/A";

  // Set status badge
  const statusBadge = document.getElementById("modal-review-status");
  statusBadge.innerHTML = '';
  if (restaurant.reviewStatus === 'not reviewed') {
    statusBadge.innerHTML = '<span class="badge badge-primary">Pending</span>';
  } else if (restaurant.reviewStatus === 'assigned') {
    statusBadge.innerHTML = '<span class="badge badge-warning">Assigned</span>';
  } else if (restaurant.reviewStatus === 'completed') {
    statusBadge.innerHTML = '<span class="badge badge-success">Completed</span>';
  }

  // Set reviewer name
  const reviewerNameInput = document.getElementById("modal-reviewer-name");
  const reviewerNameText = document.getElementById("modal-reviewer-name-text");
  reviewerNameInput.value = restaurant.reviewedBy || currentUser || "";
  reviewerNameText.textContent = restaurant.reviewedBy || "N/A";

  // Clear any previous errors
  document.getElementById("modal-review-error").textContent = "";

  // Set up review form
  toggleReviewForm(restaurant.reviewStatus === 'not reviewed' || restaurant.reviewStatus === 'assigned', restaurant.reviewStatus);
  document.getElementById("modal-submit-review").onclick = () => submitReview(restaurantId, restaurant.reviewStatus);

  // Set up map link
  if (restaurant.Latitude && restaurant.Longitude && userLocation) {
    const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${restaurant.Latitude},${restaurant.Longitude}&travelmode=driving`;
    document.getElementById("modal-google-maps").href = googleMapsLink;
  } else {
    document.getElementById("modal-google-maps").href = "#";
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
  if (!modal) return;

  modal.classList.remove("flex");
  document.body.style.overflow = "";
  currentRestaurantId = null;
  
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// Submit review
async function submitReview(restaurantId, currentStatus) {
  const reviewerNameInput = document.getElementById("modal-reviewer-name");
  const reviewError = document.getElementById("modal-review-error");

  const reviewedBy = reviewerNameInput.value.trim();

  if (currentStatus === 'not reviewed' && !reviewedBy) {
    reviewError.textContent = "Please enter reviewer name";
    return;
  }

  if (!confirm(`Are you sure you want to ${currentStatus === 'not reviewed' ? 'assign this review' : 'mark this review as completed'}?`)) {
    return;
  }

  try {
    loadingIndicator.classList.remove("hidden");
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    const endpoint = currentStatus === 'not reviewed' 
      ? `${BASE_API_URL}/api/restaurants/review/assign/${restaurantId}`
      : `${BASE_API_URL}/api/restaurants/review/complete/${restaurantId}`;

    const body = currentStatus === 'not reviewed' ? { reviewedBy } : {};

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update review status");
    }

    const data = await response.json();
    const restaurant = restaurants.find((r) => r._id === restaurantId);
    if (restaurant) {
      restaurant.reviewStatus = data.review.reviewStatus;
      restaurant.reviewedBy = data.review.reviewedBy;
      
      // Update modal content
      document.getElementById("modal-reviewed-by").textContent = data.review.reviewedBy || "N/A";
      document.getElementById("modal-reviewer-name-text").textContent = data.review.reviewedBy || "N/A";
      
      // Update status badge
      const statusBadge = document.getElementById("modal-review-status");
      statusBadge.innerHTML = '';
      if (data.review.reviewStatus === 'not reviewed') {
        statusBadge.innerHTML = '<span class="badge badge-primary">Pending</span>';
      } else if (data.review.reviewStatus === 'assigned') {
        statusBadge.innerHTML = '<span class="badge badge-warning">Assigned</span>';
      } else if (data.review.reviewStatus === 'completed') {
        statusBadge.innerHTML = '<span class="badge badge-success">Completed</span>';
      }
      
      reviewError.textContent = "";
      toggleReviewForm(data.review.reviewStatus === 'not reviewed' || data.review.reviewStatus === 'assigned', data.review.reviewStatus);
    }
    
    // Refresh restaurant list
    restaurants.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    resetPagination();
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