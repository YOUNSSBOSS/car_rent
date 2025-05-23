document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('booking-form');
    const myBookingsListContainer = document.getElementById('my-bookings-list');
    const messageAreaBookingForm = document.getElementById('message-area-booking-form');
    const messageAreaMyBookings = document.getElementById('message-area-my-bookings');
    
    let csrfToken = null;

    const showMessage = (area, message, type = 'error') => {
        if (area) area.innerHTML = `<p class="${type}">${message}</p>`;
    };

    const initCsrf = async () => {
        try {
            const response = await fetch('/api/csrf-token');
            if (!response.ok) throw new Error('CSRF token fetch failed');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (error) {
            console.error('CSRF init error:', error);
            const relevantMessageArea = bookingForm ? messageAreaBookingForm : messageAreaMyBookings;
            showMessage(relevantMessageArea, 'Failed to initialize security. Please refresh.');
        }
    };

    // --- Booking Form Logic (on form.html) ---
    if (bookingForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const carIdParam = urlParams.get('carId');
        
        const carMakeEl = document.getElementById('car-make');
        const carModelEl = document.getElementById('car-model');
        const carYearEl = document.getElementById('car-year-summary');
        const carPriceEl = document.getElementById('car-price-summary');
        const carIdInput = document.getElementById('carId');


        if (carIdParam) {
            if(carIdInput) carIdInput.value = carIdParam;
            // Fetch car details to display summary
            fetch(`/api/cars/${carIdParam}`)
                .then(res => res.json())
                .then(result => {
                    if (result.status === 'success' && result.data.car) {
                        const car = result.data.car;
                        if(carMakeEl) carMakeEl.textContent = car.make;
                        if(carModelEl) carModelEl.textContent = car.model;
                        if(carYearEl) carYearEl.textContent = car.year;
                        if(carPriceEl) carPriceEl.textContent = car.pricePerDay.toFixed(2);
                    } else {
                        showMessage(messageAreaBookingForm, result.message || 'Could not load car details for booking.');
                        if(bookingForm.querySelector('button[type="submit"]')) bookingForm.querySelector('button[type="submit"]').disabled = true;
                    }
                })
                .catch(err => {
                     console.error(err);
                     showMessage(messageAreaBookingForm, 'Error loading car details.');
                     if(bookingForm.querySelector('button[type="submit"]')) bookingForm.querySelector('button[type="submit"]').disabled = true;
                });
        } else {
            showMessage(messageAreaBookingForm, 'No car selected for booking. Please select a car from the list.');
            if(bookingForm.querySelector('button[type="submit"]')) bookingForm.querySelector('button[type="submit"]').disabled = true;
        }

        initCsrf(); // Fetch CSRF token

        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!csrfToken) {
                showMessage(messageAreaBookingForm, 'Security token not loaded. Please refresh.');
                return;
            }
            if (!carIdInput || !carIdInput.value) { // Check if carIdInput itself exists
                showMessage(messageAreaBookingForm, 'Car ID is missing. Cannot create booking.');
                return;
            }

            const formData = new FormData(bookingForm);
            const data = {
                carId: carIdInput.value, // Ensure carId is included
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate')
            };

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage(messageAreaBookingForm, result.message || 'Booking request successful!', 'success');
                    setTimeout(() => window.location.href = '/bookings/my-bookings.html', 2000);
                } else {
                    let errorsText = result.message || 'Booking request failed.';
                    if (result.errors && Array.isArray(result.errors)) {
                        errorsText += '<ul>' + result.errors.map(err => `<li>${err.msg}</li>`).join('') + '</ul>';
                    }
                    showMessage(messageAreaBookingForm, errorsText, 'error');
                }
            } catch (error) {
                console.error('Booking submit error:', error);
                showMessage(messageAreaBookingForm, 'An error occurred while submitting your booking.');
            }
        });
    }

    // --- My Bookings List Logic (on my-bookings.html) ---
    if (myBookingsListContainer) {
        initCsrf(); // For cancellation CSRF

        const loadMyBookings = async () => {
            try {
                const response = await fetch('/api/bookings/my-bookings');
                const result = await response.json();
                myBookingsListContainer.innerHTML = ''; // Clear

                if (result.status === 'success' && result.data.bookings) {
                    if (result.data.bookings.length === 0) {
                        myBookingsListContainer.innerHTML = '<p>You have no bookings yet.</p>';
                        return;
                    }
                    result.data.bookings.forEach(booking => {
                        const bookingCard = `
                            <div class="booking-card" style="border:1px solid #ccc; padding:15px; margin-bottom:15px;">
                                <h4>${booking.car.make} ${booking.car.model} (${booking.car.year})</h4>
                                <p><strong>Dates:</strong> ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}</p>
                                <p><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
                                <p><strong>Status:</strong> ${booking.status}</p>
                                ${ (booking.status === 'pending' || booking.status === 'confirmed') ? 
                                    `<button class="cancel-booking-btn" data-id="${booking._id}">Cancel Booking</button>` : '' 
                                }
                                <div id="cancel-message-${booking._id}"></div>
                            </div>
                        `;
                        myBookingsListContainer.insertAdjacentHTML('beforeend', bookingCard);
                    });
                    attachCancelListeners();
                } else {
                    showMessage(messageAreaMyBookings, result.message || 'Could not load your bookings.');
                }
            } catch (error) {
                console.error('Load my bookings error:', error);
                showMessage(messageAreaMyBookings, 'Error loading your bookings.');
            }
        };

        const attachCancelListeners = () => {
            document.querySelectorAll('.cancel-booking-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const bookingId = e.target.dataset.id;
                    const cancelMsgArea = document.getElementById(`cancel-message-${bookingId}`);
                    if (confirm('Are you sure you want to cancel this booking?')) {
                        if (!csrfToken) {
                            showMessage(cancelMsgArea, 'Security token missing. Please refresh.');
                            return;
                        }
                        try {
                            const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                                method: 'POST', // As defined in routes
                                headers: { 'CSRF-Token': csrfToken }
                            });
                            const result = await response.json();
                            if (result.status === 'success') {
                                showMessage(cancelMsgArea, result.message || 'Booking cancelled.', 'success');
                                loadMyBookings(); // Refresh list
                            } else {
                                showMessage(cancelMsgArea, result.message || 'Failed to cancel booking.');
                            }
                        } catch (error) {
                            console.error('Cancel booking error:', error);
                            showMessage(cancelMsgArea, 'Error cancelling booking.');
                        }
                    }
                });
            });
        };
        loadMyBookings();
    }
    
    // This part for updating nav is a bit simplified. 
    // Ideally, main-app.js would expose a function or use events for better modularity.
    // For now, if main-app.js is loaded, it should handle its own nav elements.
    // This script focuses on booking-specific page elements.
    // If main-app.js creates global functions like `window.updateAuthNav`, they can be called here
    // for the specific nav placeholders if necessary.
    // e.g. if (typeof window.updateAuthNav === 'function') {
    //    const authLinksBookingForm = document.getElementById('auth-links-bookingform');
    //    if(authLinksBookingForm) window.updateAuthNav(authLinksBookingForm);
    //    // etc. for other pages
    // }
});
