document.addEventListener('DOMContentLoaded', async () => {
    const statsContainer = document.getElementById('stats-container');
    const recentBookingsTableBody = document.querySelector('#recent-bookings-table tbody');
    const messageArea = document.getElementById('message-area-admin-dash');
    // No CSRF needed for GET requests

    const showMessage = (msg, type = 'error') => {
        if (messageArea) messageArea.innerHTML = `<p class="${type}">${msg}</p>`;
    };

    try {
        const response = await fetch('/api/admin/dashboard/stats');
        const result = await response.json();

        if (result.status === 'success' && result.data.stats) {
            const stats = result.data.stats;
            statsContainer.innerHTML = ''; // Clear any placeholders

            // Users Stats
            statsContainer.insertAdjacentHTML('beforeend', `
                <div class="stat-card">
                    <h3>Users</h3>
                    <p>Total Users (non-admin): ${stats.users.total}</p>
                    <p>Total Admins: ${stats.users.admins}</p>
                </div>
            `);

            // Cars Stats
            statsContainer.insertAdjacentHTML('beforeend', `
                <div class="stat-card">
                    <h3>Cars</h3>
                    <p>Total Cars: ${stats.cars.total}</p>
                    <p>Available: ${stats.cars.available}</p>
                    <p>Booked (simple status): ${stats.cars.booked}</p>
                    <p>Maintenance: ${stats.cars.maintenance}</p>
                </div>
            `);

            // Bookings Stats
            statsContainer.insertAdjacentHTML('beforeend', `
                <div class="stat-card">
                    <h3>Bookings</h3>
                    <p>Total Bookings: ${stats.bookings.total}</p>
                    <p>Pending: ${stats.bookings.pending}</p>
                    <p>Confirmed: ${stats.bookings.confirmed}</p>
                    <p>Completed: ${stats.bookings.completed}</p>
                    <p>Cancelled: ${stats.bookings.cancelled}</p>
                </div>
            `);
            
            // Revenue Stats
             statsContainer.insertAdjacentHTML('beforeend', `
                <div class="stat-card">
                    <h3>Revenue</h3>
                    <p>Total from Completed Bookings: $${stats.revenue.totalCompletedRevenue.toFixed(2)}</p>
                </div>
            `);

            // Recent Bookings
            if (recentBookingsTableBody && stats.recentBookings) {
                recentBookingsTableBody.innerHTML = '';
                if (stats.recentBookings.length === 0) {
                    recentBookingsTableBody.innerHTML = '<tr><td colspan="5">No recent bookings.</td></tr>';
                }
                stats.recentBookings.forEach(booking => {
                    const carInfo = booking.car ? `${booking.car.make} ${booking.car.model}` : 'N/A';
                    const userInfo = booking.user ? booking.user.username : 'N/A';
                    const row = `
                        <tr>
                            <td>${booking._id}</td>
                            <td>${userInfo}</td>
                            <td>${carInfo}</td>
                            <td>${booking.status}</td>
                            <td>$${booking.totalPrice.toFixed(2)}</td>
                        </tr>
                    `;
                    recentBookingsTableBody.insertAdjacentHTML('beforeend', row);
                });
            }

        } else {
            showMessage(result.message || 'Could not load dashboard statistics.');
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showMessage('Error loading dashboard data from server.');
    }
    
    // For main nav elements
    // The main-app.js script should handle populating #user-info-admin-dash
    // This script focuses on the dashboard content itself.
    // If specific updates to #user-info-admin-dash were needed beyond what main-app.js does,
    // they would go here, but typically main-app.js handles shared nav elements.
});
