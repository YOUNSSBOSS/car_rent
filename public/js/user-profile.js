document.addEventListener('DOMContentLoaded', () => {
    const changePasswordForm = document.getElementById('change-password-form');
    const messageAreaChangePw = document.getElementById('message-area-changepw');
    const profileUsernameEl = document.getElementById('profile-username');
    const profileEmailEl = document.getElementById('profile-email');
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
            showMessage(messageAreaChangePw, 'Failed to initialize security. Please refresh.');
        }
    };
    
    // Populate user details (could also be from main-app.js if it stores user globally)
    const loadUserDetails = () => {
        // Assuming main-app.js makes currentUserSession available or provides a getter
        if (window.currentUserSession && window.currentUserSession.user) {
            if(profileUsernameEl) profileUsernameEl.textContent = window.currentUserSession.user.username;
            if(profileEmailEl) profileEmailEl.textContent = window.currentUserSession.user.email; // Assuming email is in session user
        } else {
            // If no session data, redirect or show error, as this page requires login
            showMessage(messageAreaChangePw, 'User data not found. Please log in.', 'error');
            // setTimeout(() => window.location.href = '/auth/login.html', 2000);
        }
    };


    if (changePasswordForm) {
        initCsrf();
        loadUserDetails(); // Load user details into the profile page

        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!csrfToken) {
                showMessage(messageAreaChangePw, 'Security token not loaded. Please refresh.');
                return;
            }

            const formData = new FormData(changePasswordForm);
            const data = Object.fromEntries(formData.entries());

            if (data.newPassword !== data.confirmNewPassword) {
                showMessage(messageAreaChangePw, 'New passwords do not match.');
                return;
            }
            if (data.newPassword.length < 6) {
                 showMessage(messageAreaChangePw, 'New password must be at least 6 characters.');
                return;
            }


            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage(messageAreaChangePw, result.message || 'Password changed successfully!', 'success');
                    changePasswordForm.reset();
                } else {
                    showMessage(messageAreaChangePw, result.message || 'Failed to change password.');
                }
            } catch (error) {
                console.error('Change password error:', error);
                showMessage(messageAreaChangePw, 'An error occurred while changing your password.');
            }
        });
    }
    
    // For main nav elements, main-app.js should handle populating #auth-links-profile
    // If main-app.js is guaranteed to run first and populate window.currentUserSession,
    // then this script can use it. The nav update for #auth-links-profile itself
    // should be handled by main-app.js to keep concerns separate.
});
