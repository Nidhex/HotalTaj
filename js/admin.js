/* ==========================================================================
   RajMahal - Premium Administrative Dashboard JS Integration
   ========================================================================== */

const API_BASE_URL = (window.location.hostname && window.location.hostname !== 'localhost')
  ? `http://${window.location.hostname}:5000/api`
  : 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  // Core Elements
  const preloader = document.getElementById('admin-preloader');
  const loginGate = document.getElementById('admin-login-gate');
  const mainConsole = document.getElementById('admin-main-console');
  
  const gateForm = document.getElementById('admin-gate-form');
  const gateError = document.getElementById('admin-gate-error');
  const signoutBtn = document.getElementById('admin-signout-btn');
  
  const courtierName = document.getElementById('courtier-name');
  const courtierRole = document.getElementById('courtier-role');
  
  // Viewport elements
  const sidebarLinks = document.querySelectorAll('.sidebar-menu-link');
  const viewports = document.querySelectorAll('.viewport-section');
  const currentViewportTitle = document.getElementById('current-viewport-title');

  // Shared Data Cache
  let roomsCache = [];
  let bookingsCache = [];

  // Active Session Entry Gate check
  checkSessionState();

  /**
   * 1. Validate Admin Login Sessions
   */
  function checkSessionState() {
    const token = localStorage.getItem('rajmahal_admin_token');
    const userStr = localStorage.getItem('rajmahal_admin_user');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      // Validate token with backend
      showPreloader(true);
      fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && (data.data.role === 'admin' || data.data.role === 'concierge')) {
          // Token is healthy and user is authorized
          showPreloader(false);
          loginGate.style.display = 'none';
          mainConsole.style.display = 'grid';
          
          courtierName.textContent = data.data.name;
          courtierRole.textContent = data.data.role;

          // Hydrate dashboard modules
          syncAllDashboardData(token);
        } else {
          // Unhealthy token or invalid permissions
          showPreloader(false);
          logoutSession();
        }
      })
      .catch(err => {
        console.error(err);
        showPreloader(false);
        // Offline / server error, fallback to offline cached access for development convenience
        loginGate.style.display = 'none';
        mainConsole.style.display = 'grid';
        courtierName.textContent = user.name;
        courtierRole.textContent = user.role;
        syncAllDashboardData(token);
      });
    } else {
      // Show login form
      loginGate.style.display = 'flex';
      mainConsole.style.display = 'none';
    }
  }

  /**
   * Session Termination
   */
  function logoutSession() {
    localStorage.removeItem('rajmahal_admin_token');
    localStorage.removeItem('rajmahal_admin_user');
    loginGate.style.display = 'flex';
    mainConsole.style.display = 'none';
    gateError.style.display = 'none';
    gateForm.reset();
  }

  signoutBtn.addEventListener('click', () => {
    if (confirm("Are you sure you wish to leave the Royal Court console?")) {
      logoutSession();
    }
  });

  /**
   * Login Form Submission Handler
   */
  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = gateForm.querySelector('.btn-gold');

    gateError.style.display = 'none';
    submitBtn.textContent = 'Verifying Court Authorization...';
    submitBtn.disabled = true;

    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const user = data.data;
        if (user.role === 'admin' || user.role === 'concierge') {
          // Store sessions
          localStorage.setItem('rajmahal_admin_token', user.token);
          localStorage.setItem('rajmahal_admin_user', JSON.stringify(user));
          
          // Clear form & transition
          gateForm.reset();
          loginGate.style.opacity = '0';
          setTimeout(() => {
            loginGate.style.display = 'none';
            mainConsole.style.display = 'grid';
            courtierName.textContent = user.name;
            courtierRole.textContent = user.role;
            syncAllDashboardData(user.token);
          }, 400);
        } else {
          showLoginError('Role Authorization Failed. Only members of the Royal Court (Admin or Concierge) can enter.');
        }
      } else {
        showLoginError(data.message || 'Invalid Courtier credentials. Please check your passcode.');
      }
    })
    .catch(err => {
      console.error(err);
      showLoginError('Could not establish connection with the RajMahal servers. Please verify backend state.');
    })
    .finally(() => {
      submitBtn.textContent = 'Unlock Palace Gates';
      submitBtn.disabled = false;
    });
  });

  function showLoginError(msg) {
    gateError.textContent = msg;
    gateError.style.display = 'block';
  }

  /**
   * Preloader Helpers
   */
  function showPreloader(show) {
    preloader.style.display = show ? 'flex' : 'none';
  }

  /**
   * 2. Sidebar Navigation Router Viewports switcher
   */
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const title = link.querySelector('span').textContent;

      // Swap Active navigation states
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Swap Active viewport panels
      viewports.forEach(vp => vp.classList.remove('active'));
      const activeVp = document.getElementById(targetId);
      if (activeVp) activeVp.classList.add('active');

      // Update breadcrumbs
      currentViewportTitle.textContent = title;
    });
  });


  /**
   * 3. Sync and Calculate Court Analytics, Chronicles, and Inventories
   */
  function syncAllDashboardData(token) {
    showPreloader(true);
    
    // Concurrent requests for rooms and bookings
    Promise.all([
      fetch(`${API_BASE_URL}/rooms`).then(res => res.json()),
      fetch(`${API_BASE_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ])
    .then(([roomsRes, bookingsRes]) => {
      showPreloader(false);
      
      if (roomsRes.success) {
        roomsCache = roomsRes.data;
        renderRoomInventory();
      }
      
      if (bookingsRes.success) {
        bookingsCache = bookingsRes.data;
        renderStayChronicles(token);
      }

      calculateAndRenderAnalytics();
    })
    .catch(err => {
      console.error(err);
      showPreloader(false);
      alert("Synchronizing failed. Check server connections.");
    });
  }

  // Refresh bookings trigger binding
  document.getElementById('refresh-bookings-btn').addEventListener('click', () => {
    const token = localStorage.getItem('rajmahal_admin_token');
    if (token) syncAllDashboardData(token);
  });

  /**
   * Calculate Analytics metrics cards
   */
  function calculateAndRenderAnalytics() {
    const totalBookingsEl = document.getElementById('stat-total-bookings');
    const activeBookingsEl = document.getElementById('stat-active-bookings');
    const revenueEl = document.getElementById('stat-revenue');
    const occupancyEl = document.getElementById('stat-occupancy');

    // Counts
    const totalBookings = bookingsCache.length;
    const activeBookings = bookingsCache.filter(b => b.status === 'confirmed').length;

    // Revenue calculations: Gross non-cancelled sum
    const totalRevenue = bookingsCache
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Chamber Occupancy calculation
    const totalRooms = roomsCache.length;
    const occupancyRatio = totalRooms > 0 
      ? Math.min(100, Math.round((activeBookings / totalRooms) * 100))
      : 0;

    // Update markup
    totalBookingsEl.textContent = totalBookings;
    activeBookingsEl.textContent = activeBookings;
    revenueEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    occupancyEl.textContent = `${occupancyRatio}%`;

    // Populate Recent Bookings Table
    const recentTableBody = document.querySelector('#recent-bookings-table tbody');
    recentTableBody.innerHTML = '';
    
    const recentBookings = [...bookingsCache]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    recentBookings.forEach(booking => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div style="font-weight: 600;">${booking.user ? booking.user.name : 'Unknown Guest'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${booking.user ? booking.user.email : ''}</div>
        </td>
        <td>
          <div style="font-family: var(--font-serif);">${booking.room ? booking.room.name : 'Deleted Room'}</div>
          <div style="font-size: 0.75rem; color: var(--gold-primary);">No. ${booking.room ? booking.room.roomNumber : 'N/A'}</div>
        </td>
        <td style="font-size: 0.8rem;">
          ${new Date(booking.checkIn).toLocaleDateString()}
        </td>
        <td>
          <span class="history-status ${booking.status}" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;">${booking.status}</span>
        </td>
      `;
      recentTableBody.appendChild(row);
    });

    // Populate Chamber occupancy progress-bars
    const breakdownContainer = document.getElementById('chamber-breakdown-list');
    breakdownContainer.innerHTML = '';

    // Group bookings by room type
    const roomsByType = {
      suite: { count: 0, active: 0, label: 'Master Suites' },
      villa: { count: 0, active: 0, label: 'Imperial Villas' },
      room: { count: 0, active: 0, label: 'Heritage Chambers' }
    };

    roomsCache.forEach(room => {
      if (roomsByType[room.type]) {
        roomsByType[room.type].count++;
      }
    });

    bookingsCache.forEach(booking => {
      if (booking.status === 'confirmed' && booking.room) {
        const type = booking.room.type;
        if (roomsByType[type]) {
          roomsByType[type].active++;
        }
      }
    });

    Object.keys(roomsByType).forEach(key => {
      const data = roomsByType[key];
      const occupancy = data.count > 0 
        ? Math.min(100, Math.round((data.active / data.count) * 100))
        : 0;

      const item = document.createElement('div');
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
          <span style="font-weight: 500;">${data.label} (${data.active}/${data.count})</span>
          <span style="color: var(--gold-primary); font-family: var(--font-royal); font-weight: 600;">${occupancy}% Occupied</span>
        </div>
        <div class="progress-container">
          <div class="progress-fill" style="width: ${occupancy}%;"></div>
        </div>
      `;
      breakdownContainer.appendChild(item);
    });
  }

  /**
   * 4. Render All Bookings Stay Chronicles Table
   */
  function renderStayChronicles(token) {
    const tableBody = document.querySelector('#all-bookings-table tbody');
    tableBody.innerHTML = '';

    if (bookingsCache.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">No stays registered in database.</td></tr>`;
      return;
    }

    // Sort chronologically newest first
    const sortedBookings = [...bookingsCache].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedBookings.forEach(booking => {
      const row = document.createElement('tr');
      const checkin = new Date(booking.checkIn).toLocaleDateString();
      const checkout = new Date(booking.checkOut).toLocaleDateString();

      row.innerHTML = `
        <td style="font-family: monospace; font-size: 0.75rem; color: var(--gold-primary);">${booking._id.substring(0, 8)}...</td>
        <td>
          <div style="font-weight: 600;">${booking.user ? booking.user.name : 'Deleted Resident'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${booking.user ? booking.user.email : ''}</div>
        </td>
        <td>
          <div style="font-family: var(--font-serif); font-weight: 500;">${booking.room ? booking.room.name : 'Deleted Room'}</div>
          <div style="font-size: 0.75rem; color: var(--gold-primary);">Chamber Code: ${booking.room ? booking.room.roomNumber : 'N/A'}</div>
        </td>
        <td>
          <div>${checkin} &mdash; ${checkout}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Stay Period Dates</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--gold-light);">₹${booking.totalPrice.toLocaleString('en-IN')}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Payment: Bypassed</div>
        </td>
        <td>
          <span class="history-status ${booking.status}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">${booking.status}</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <select class="table-status-select" data-booking-id="${booking._id}" ${booking.status === 'cancelled' ? 'disabled' : ''}>
              <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Handle inline status selection dropdowns change
    tableBody.querySelectorAll('.table-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const bookingId = select.dataset.bookingId;
        const newStatus = select.value;
        
        if (newStatus === 'cancelled') {
          // Trigger Cancellation API
          if (confirm("Are you sure you want to cancel this booking? This will release stay dates immediately.")) {
            triggerBookingCancellation(bookingId, token);
          } else {
            // Reset selection to cache status
            const original = bookingsCache.find(b => b._id === bookingId).status;
            select.value = original;
          }
        } else {
          // Trigger Status Update API
          triggerStatusOverride(bookingId, newStatus, token);
        }
      });
    });
  }

  function triggerBookingCancellation(bookingId, token) {
    showPreloader(true);
    fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Booking cancelled and dates released back into live inventory.");
        syncAllDashboardData(token);
      } else {
        alert(`Failed to cancel booking: ${data.message}`);
        showPreloader(false);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error contacting cancellation service.");
      showPreloader(false);
    });
  }

  function triggerStatusOverride(bookingId, status, token) {
    showPreloader(true);
    fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Booking status overridden to "${status}" successfully.`);
        syncAllDashboardData(token);
      } else {
        alert(`Failed to update status: ${data.message}`);
        showPreloader(false);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Network exception occurred during status update.");
      showPreloader(false);
    });
  }


  /**
   * 5. Render All Chambers (Room configurations Grid)
   */
  const roomsGrid = document.getElementById('admin-rooms-grid');
  const roomDrawer = document.getElementById('room-form-overlay');
  const addRoomBtn = document.getElementById('add-room-trigger-btn');
  const closeDrawerBtn = document.getElementById('close-room-drawer');
  const roomForm = document.getElementById('admin-room-form');
  const formRoomId = document.getElementById('form-room-id');
  const drawerTitle = document.getElementById('room-drawer-title');
  const roomFormError = document.getElementById('room-form-error');

  function renderRoomInventory() {
    roomsGrid.innerHTML = '';

    if (roomsCache.length === 0) {
      roomsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 5rem 0;">No chambers registered. Click "Unveil New Chamber" to add.</div>`;
      return;
    }

    roomsCache.forEach(room => {
      const card = document.createElement('div');
      card.className = 'room-card glass-card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';
      
      card.innerHTML = `
        <div class="room-img-wrap">
          <img src="${room.images[0]}" class="room-img" alt="${room.name}">
          <span class="room-tag" style="text-transform: uppercase;">No. ${room.roomNumber}</span>
        </div>
        <div class="room-details" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="room-price">₹${room.pricePerNight.toLocaleString('en-IN')} <span>/ night</span></div>
            <h3 class="room-title" style="font-size: 1.1rem; margin-bottom: 0.5rem; text-align: left;">${room.name}</h3>
            <p style="font-size: 0.75rem; text-align: left; line-height: 1.4; color: var(--text-muted); margin-bottom: 1rem;">${room.description.substring(0, 100)}...</p>
            <div style="font-size: 0.75rem; color: var(--gold-primary); text-align: left; margin-bottom: 0.4rem;">
              <strong style="color: var(--white);">Class:</strong> ${room.type.toUpperCase()} &bull; <strong style="color: var(--white);">Capacity:</strong> Up to ${room.maxGuests} guests
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-align: left;">
              <strong style="color: var(--white);">Amenities:</strong> ${room.amenities.slice(0, 3).join(', ')}${room.amenities.length > 3 ? '...' : ''}
            </div>
          </div>
          <div class="chamber-action-wrap">
            <button class="btn-outline-white edit-room-btn" data-id="${room._id}" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; border-color: rgba(212,175,55,0.25);">Edit features</button>
            <button class="btn-outline-white delete-room-btn" data-id="${room._id}" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; color: #e74c3c; border-color: rgba(231,76,60,0.25);">Delete chamber</button>
          </div>
        </div>
      `;

      roomsGrid.appendChild(card);
    });

    // Handle Edit buttons clicks
    roomsGrid.querySelectorAll('.edit-room-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.dataset.id;
        const room = roomsCache.find(r => r._id === roomId);
        
        if (room) {
          formRoomId.value = room._id;
          document.getElementById('room-number').value = room.roomNumber;
          document.getElementById('room-name').value = room.name;
          document.getElementById('room-class-select').value = room.type;
          document.getElementById('room-capacity').value = room.maxGuests;
          document.getElementById('room-price').value = room.pricePerNight;
          document.getElementById('room-image').value = room.images[0];
          document.getElementById('room-amenities').value = room.amenities.join(', ');
          document.getElementById('room-desc').value = room.description;

          drawerTitle.textContent = "Edit Chamber Specifications";
          roomFormError.style.display = 'none';
          roomDrawer.style.display = 'flex';
        }
      });
    });

    // Handle Delete buttons clicks
    roomsGrid.querySelectorAll('.delete-room-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = btn.dataset.id;
        const roomName = btn.dataset.roomName;
        const token = localStorage.getItem('rajmahal_admin_token');

        if (confirm(`Are you absolutely sure you wish to permanently demolish the "${btn.closest('.room-details').querySelector('.room-title').textContent}" from the palace inventory?`)) {
          showPreloader(true);
          fetch(`${API_BASE_URL}/rooms/${roomId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              alert("Chamber removed from palace inventory successfully.");
              syncAllDashboardData(token);
            } else {
              alert(`Refused to delete room: ${data.message || 'The chamber is linked to active stay chronicles.'}`);
              showPreloader(false);
            }
          })
          .catch(err => {
            console.error(err);
            alert("Error trying to process delete query.");
            showPreloader(false);
          });
        }
      });
    });
  }

  // Toggling Drawer forms overlays
  addRoomBtn.addEventListener('click', () => {
    roomForm.reset();
    formRoomId.value = '';
    drawerTitle.textContent = "Unveil New Luxury Chamber";
    roomFormError.style.display = 'none';
    roomDrawer.style.display = 'flex';
  });

  closeDrawerBtn.addEventListener('click', () => {
    roomDrawer.style.display = 'none';
  });

  // Drawer overlay clicking backdrop to close
  roomDrawer.addEventListener('click', (e) => {
    if (e.target === roomDrawer) {
      roomDrawer.style.display = 'none';
    }
  });

  /**
   * Submit Add / Edit Room forms drawer
   */
  roomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('rajmahal_admin_token');
    
    const roomId = formRoomId.value;
    const roomNumber = document.getElementById('room-number').value;
    const name = document.getElementById('room-name').value;
    const type = document.getElementById('room-class-select').value;
    const maxGuests = Number(document.getElementById('room-capacity').value);
    const pricePerNight = Number(document.getElementById('room-price').value);
    const primaryImage = document.getElementById('room-image').value;
    const amenitiesString = document.getElementById('room-amenities').value;
    const description = document.getElementById('room-desc').value;

    const amenities = amenitiesString.split(',').map(a => a.trim()).filter(a => a.length > 0);
    const images = [primaryImage];

    const bodyData = { roomNumber, name, type, maxGuests, pricePerNight, images, amenities, description };

    const isEdit = roomId && roomId.length > 0;
    const targetUrl = isEdit ? `${API_BASE_URL}/rooms/${roomId}` : `${API_BASE_URL}/rooms`;
    const targetMethod = isEdit ? 'PUT' : 'POST';

    roomFormError.style.display = 'none';
    const submitBtn = roomForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Enscribing in registers...';
    submitBtn.disabled = true;

    fetch(targetUrl, {
      method: targetMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(isEdit ? "Chamber details overwritten successfully!" : "New chamber successfully launched in registers.");
        roomDrawer.style.display = 'none';
        syncAllDashboardData(token);
      } else {
        roomFormError.textContent = data.message || "Failed to commit changes. Verify room inputs.";
        roomFormError.style.display = 'block';
      }
    })
    .catch(err => {
      console.error(err);
      roomFormError.textContent = "Offline. Could not write details to backend server.";
      roomFormError.style.display = 'block';
    })
    .finally(() => {
      submitBtn.textContent = 'Enscribe Chamber details';
      submitBtn.disabled = false;
    });
  });

});
