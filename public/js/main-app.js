document.addEventListener('DOMContentLoaded', async () => {
    const authLinksContainer = document.getElementById('auth-links');
    const userInfoContainer = document.getElementById('user-info');
    const messagesContainer = document.getElementById('messages'); // For global messages like logout success
    let csrfToken = null;

    // Function to fetch CSRF token
    const fetchCsrfToken = async () => {
        try {
            const response = await fetch('/api/csrf-token');
            if (!response.ok) { console.error('Failed to fetch CSRF token'); return null; }
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error('CSRF Fetch Error:', error);
            return null;
        }
    };
    
    csrfToken = await fetchCsrfToken(); // Fetch token on load

    // Function to update navigation based on auth state
    window.updateAuthNav = (user) => {
        if (authLinksContainer) authLinksContainer.innerHTML = '';
        
        const existingUserInfoContent = document.getElementById('user-info-content');
        if (existingUserInfoContent) existingUserInfoContent.remove();

        if (user) { // User is logged in
            if (userInfoContainer) {
                const userInfoContent = document.createElement('div');
                userInfoContent.id = 'user-info-content';
                
                userInfoContent.innerHTML = `
                    Welcome, <span id="username-display">${user.username}</span>!
                    <a href="/user/profile.html" class="user-nav-link">My Profile</a> |
                    <a href="/bookings/my-bookings.html" class="user-nav-link">My Bookings</a> |
                    <button id="logout-button">Logout</button>
                `;
                
                userInfoContainer.appendChild(userInfoContent);

                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) { 
                    logoutButton.addEventListener('click', async () => {
                        if (!csrfToken) {
                            if(messagesContainer) messagesContainer.innerHTML = '<p class="error">Security token missing. Cannot logout.</p>';
                            return;
                        }
                        try {
                            const response = await fetch('/api/auth/logout', {
                                method: 'POST',
                                headers: { 'CSRF-Token': csrfToken }
                            });
                            const result = await response.json();
                            if (result.status === 'success') {
                                if(messagesContainer) messagesContainer.innerHTML = '<p class="success">Logged out successfully.</p>';
                                window.currentUserSession = null; 
                                updateAuthNav(null); 
                                csrfToken = await fetchCsrfToken(); 
                                window.location.href = '/auth/login.html'; 
                            } else {
                                 if(messagesContainer) messagesContainer.innerHTML = `<p class="error">${result.message || 'Logout failed.'}</p>`;
                            }
                        } catch (error) {
                            console.error('Logout error:', error);
                            if(messagesContainer) messagesContainer.innerHTML = '<p class="error">Error during logout.</p>';
                        }
                    });
                }
                // Add Admin Links if user is admin
                if (user.role === 'admin') {
                    const dashboardLink = document.createElement('a');
                    dashboardLink.href = '/admin/dashboard.html';
                    dashboardLink.textContent = 'Admin Dashboard';
                    dashboardLink.classList.add('admin-nav-link');

                    const carsLink = document.createElement('a');
                    carsLink.href = '/admin/cars/index.html';
                    carsLink.textContent = 'Manage Cars';
                    carsLink.classList.add('admin-nav-link');
                    
                    const bookingsLink = document.createElement('a');
                    bookingsLink.href = '/admin/bookings/index.html';
                    bookingsLink.textContent = 'Manage Bookings';
                    bookingsLink.classList.add('admin-nav-link');

                    // Create separators
                    const sep0 = document.createElement('span'); sep0.textContent = ' | '; sep0.classList.add('admin-nav-separator');
                    const sep1 = document.createElement('span'); sep1.textContent = ' | '; sep1.classList.add('admin-nav-separator');
                    const sep2 = document.createElement('span'); sep2.textContent = ' | '; sep2.classList.add('admin-nav-separator');
                                        
                    // Insert admin links before the "My Profile" link or logout button if "My Profile" isn't there
                    const profileLink = userInfoContent.querySelector('.user-nav-link[href="/user/profile.html"]');
                    const referenceNodeForAdminLinks = profileLink || logoutButton;

                    userInfoContent.insertBefore(sep0, referenceNodeForAdminLinks);
                    userInfoContent.insertBefore(dashboardLink, referenceNodeForAdminLinks);
                    userInfoContent.insertBefore(sep1, referenceNodeForAdminLinks);
                    userInfoContent.insertBefore(carsLink, referenceNodeForAdminLinks);
                    userInfoContent.insertBefore(sep2, referenceNodeForAdminLinks);
                    userInfoContent.insertBefore(bookingsLink, referenceNodeForAdminLinks);
                }
            }
        } else { // No user (logged out)
            if (userInfoContainer) userInfoContainer.innerHTML = ''; 
            if (authLinksContainer) {
                authLinksContainer.innerHTML = '<a href="/auth/login.html">Login</a> | <a href="/auth/register.html">Register</a>';
            }
        }
    };
    
    window.currentUserSession = null; 

    try {
        const response = await fetch('/api/auth/current-user');
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.user) {
            window.currentUserSession = result.data; 
            updateAuthNav(result.data.user);
        } else {
            updateAuthNav(null);
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
        updateAuthNav(null);
    }
    
    const navPlaceholders = ['auth-links', 'user-info', 'auth-links-cars', 'auth-links-cardetail', 'auth-links-profile', 'auth-links-bookingform', 'auth-links-mybookings', 'user-info-admin', 'user-info-admin-form', 'user-info-admin-bookings', 'user-info-admin-dash'];
    navPlaceholders.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.currentUserSession) { 
            if(id.startsWith('auth-links') && !window.currentUserSession.user) {
                 el.innerHTML = '<a href="/auth/login.html">Login</a> | <a href="/auth/register.html">Register</a>';
            } else if (id.startsWith('auth-links') && window.currentUserSession.user) {
                el.innerHTML = ''; 
            }
            // For user-info spans on different pages, main updateAuthNav handles #user-info.
            // If other pages have specific user-info spans (like user-info-admin-dash),
            // they should also be populated by updateAuthNav if they exist.
            // This simplified loop might not be sufficient for all cases if structures differ greatly.
            // The main #user-info is the primary target for user-specific links.
        } else if (el && id.startsWith('auth-links')) { // No session, ensure login/register shown
             el.innerHTML = '<a href="/auth/login.html">Login</a> | <a href="/auth/register.html">Register</a>';
        }
    });
});
