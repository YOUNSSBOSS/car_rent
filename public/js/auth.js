document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageArea = document.getElementById('message-area');
    let csrfToken = null;

    // Function to display messages
    const showMessage = (message, type = 'error') => {
        if (messageArea) {
            messageArea.innerHTML = `<p class="${type}">${message}</p>`;
        }
    };

    // Fetch CSRF token (could be in a shared utility later)
    const fetchCsrfToken = async () => {
        try {
            const response = await fetch('/api/csrf-token');
            if (!response.ok) throw new Error('Failed to fetch CSRF token');
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error('CSRF Error:', error);
            showMessage('Could not initialize form. Please try refreshing.');
            return null;
        }
    };

    if (loginForm) {
        fetchCsrfToken().then(token => csrfToken = token);
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!csrfToken) {
                showMessage('Form security token not loaded. Please refresh.');
                return;
            }
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken 
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage(result.message || 'Login successful!', 'success');
                    window.location.href = '/'; // Redirect to homepage
                } else {
                    showMessage(result.message || 'Login failed.');
                }
            } catch (error) {
                console.error('Login Error:', error);
                showMessage('An error occurred during login.');
            }
        });
    }

    if (registerForm) {
        fetchCsrfToken().then(token => csrfToken = token);
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!csrfToken) {
                showMessage('Form security token not loaded. Please refresh.');
                return;
            }
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirmPassword) {
                showMessage('Passwords do not match.');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage(result.message || 'Registration successful! Redirecting to home...', 'success');
                    // Or log in directly and redirect to home: window.location.href = '/';
                    setTimeout(() => window.location.href = '/', 1500); // Redirect to home after successful registration and login
                } else {
                    showMessage(result.message || 'Registration failed.');
                }
            } catch (error) {
                console.error('Register Error:', error);
                showMessage('An error occurred during registration.');
            }
        });
    }
});
