document.addEventListener('DOMContentLoaded', () => {
    const bookingsTableBody = document.querySelector('#bookings-table tbody');
    const messageArea = document.getElementById('message-area-admin-bookings');
    const filterBookingsForm = document.getElementById('filter-bookings-form');
    const paginationControlsContainer = document.getElementById('pagination-controls-admin-bookings');
    let csrfToken = null;

    const showMessage = (msg, type = 'error') => {
        if (messageArea) {
            messageArea.innerHTML = `<p class="${type}">${msg}</p>`;
            setTimeout(() => messageArea.innerHTML = '', 5000);
        }
    };

    const initCsrf = async () => {
        try {
            const response = await fetch('/api/csrf-token');
            if (!response.ok) throw new Error('CSRF token fetch failed');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (error) {
            console.error('CSRF init error:', error);
            showMessage('Failed to initialize security. Please refresh.');
        }
    };

    const renderBookings = (bookings) => {
        bookingsTableBody.innerHTML = ''; // Clear existing
        if (bookings.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="7">No bookings found matching criteria.</td></tr>';
            return;
        }
        bookings.forEach(booking => {
            const carInfo = booking.car ? `${booking.car.make} ${booking.car.model} (${booking.car.year})` : 'N/A';
            const userInfo = booking.user ? `${booking.user.username} (${booking.user.email})` : 'N/A';
            const row = `
                <tr>
                    <td>${booking._id}</td>
                    <td>${userInfo}</td>
                    <td>${carInfo}</td>
                    <td>${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</td>
                    <td>$${booking.totalPrice.toFixed(2)}</td>
                    <td>
                        <select class="booking-status-select" data-id="${booking._id}">
                            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="declined" ${booking.status === 'declined' ? 'selected' : ''}>Declined</option>
                            <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td>
                        <button class="update-status-btn" data-id="${booking._id}">Update Status</button>
                    </td>
                </tr>
            `;
            bookingsTableBody.insertAdjacentHTML('beforeend', row);
        });
        attachStatusUpdateListeners();
    };
    
    const renderPaginationAdminBookings = (paginationData, currentParams) => {
        if (!paginationControlsContainer || !paginationData || paginationData.totalPages <= 1) {
            if (paginationControlsContainer) paginationControlsContainer.innerHTML = '';
            return;
        }
        let paginationHTML = '';
        if (paginationData.currentPage > 1) {
            paginationHTML += `<button data-page="${paginationData.currentPage - 1}" class="pagination-btn">Previous</button> `;
        }
        for (let i = 1; i <= paginationData.totalPages; i++) {
            paginationHTML += `<button data-page="${i}" class="pagination-btn ${i === paginationData.currentPage ? 'active' : ''}" ${i === paginationData.currentPage ? 'disabled' : ''}>${i}</button> `;
        }
        if (paginationData.currentPage < paginationData.totalPages) {
            paginationHTML += `<button data-page="${paginationData.currentPage + 1}" class="pagination-btn">Next</button>`;
        }
        paginationControlsContainer.innerHTML = paginationHTML;

        document.querySelectorAll('#pagination-controls-admin-bookings .pagination-btn').forEach(button => {
            if(button.disabled) return;
            button.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                const currentSearchParams = new URLSearchParams(window.location.search);
                currentSearchParams.set('page', page);
                 // Retain existing filters when paginating
                const filterFormData = new FormData(filterBookingsForm);
                filterFormData.forEach((value, key) => {
                    if (value && key !== 'page') currentSearchParams.set(key, value);
                });
                loadAllBookings(Object.fromEntries(currentSearchParams.entries()));
            });
        });
    };


    const loadAllBookings = async (params = {}) => {
        if (!bookingsTableBody) return;
         if (!csrfToken) await initCsrf();


        const query = new URLSearchParams(params).toString();
        try {
            const response = await fetch(`/api/admin/bookings?${query}`);
            const result = await response.json();
            if (result.status === 'success' && result.data.bookings) {
                renderBookings(result.data.bookings);
                renderPaginationAdminBookings(result.data.pagination, params);
            } else {
                showMessage(result.message || 'Could not load bookings.');
            }
        } catch (error) {
            console.error('Load all bookings error:', error);
            showMessage('Error loading bookings from server.');
        }
    };

    const attachStatusUpdateListeners = () => {
        document.querySelectorAll('.update-status-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const bookingId = e.target.dataset.id;
                const statusSelect = document.querySelector(`.booking-status-select[data-id="${bookingId}"]`);
                const newStatus = statusSelect.value;

                if (!csrfToken) {
                    showMessage('Security token not available. Please refresh.');
                    return;
                }
                if (!newStatus) {
                    showMessage('Please select a new status.');
                    return;
                }

                if (confirm(`Are you sure you want to update booking ${bookingId} to status: ${newStatus}?`)) {
                    try {
                        const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'CSRF-Token': csrfToken
                            },
                            body: JSON.stringify({ status: newStatus })
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            showMessage(result.message || 'Booking status updated.', 'success');
                            // Optionally, update only the specific row instead of full reload
                            loadAllBookings(Object.fromEntries(new URLSearchParams(window.location.search).entries()))); 
                        } else {
                            showMessage(result.message || 'Failed to update status.');
                        }
                    } catch (error) {
                        console.error('Update status error:', error);
                        showMessage('Error updating booking status.');
                    }
                }
            });
        });
    };

    if (filterBookingsForm) {
        const initialParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        // Repopulate filter form from URL params
        if(document.getElementById('filter-userId')) document.getElementById('filter-userId').value = initialParams.userId || '';
        if(document.getElementById('filter-carId')) document.getElementById('filter-carId').value = initialParams.carId || '';
        if(document.getElementById('filter-status')) document.getElementById('filter-status').value = initialParams.status || '';

        loadAllBookings(initialParams); // Initial load

        filterBookingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterBookingsForm);
            const params = {};
            formData.forEach((value, key) => {
                if (value) params[key] = value;
            });
            // Update URL for bookmarking/sharing
            const newUrl = new URL(window.location.pathname, window.location.origin);
            for(const key in params) { newUrl.searchParams.set(key, params[key]); }
            history.pushState({}, '', newUrl);

            loadAllBookings(params);
        });

        document.getElementById('clear-booking-filters')?.addEventListener('click', () => {
            filterBookingsForm.reset();
            history.pushState({}, '', window.location.pathname);
            loadAllBookings({});
        });
    }
    
    // For main nav elements managed by main-app.js
    // This is a placeholder to indicate where such integration might go if needed by specific nav elements on this page.
    // main-app.js should independently handle the #user-info-admin-bookings span based on its own logic.
    // if (typeof window.updateAuthNav === 'function') {
    //     const userInfoAdminBookings = document.getElementById('user-info-admin-bookings');
    //     if(userInfoAdminBookings) window.updateAuthNav(userInfoAdminBookings); // This assumes main-app.js defines updateAuthNav globally
    // }
});
