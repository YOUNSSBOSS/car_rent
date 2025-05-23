document.addEventListener('DOMContentLoaded', () => {
    const carsTableBody = document.querySelector('#cars-table tbody');
    const carForm = document.getElementById('car-form');
    const messageAreaAdminCars = document.getElementById('message-area-admin-cars');
    const messageAreaAdminForm = document.getElementById('message-area-admin-form');
    
    let csrfToken = null; // Store CSRF token

    // Utility to display messages
    const showMessage = (area, message, type = 'error') => {
        if (area) {
            area.innerHTML = `<p class="${type}">${message}</p>`;
            setTimeout(() => area.innerHTML = '', 5000); // Clear after 5s
        } else if (messageAreaAdminCars) { // Fallback for general messages on list page
             messageAreaAdminCars.innerHTML = `<p class="${type}">${message}</p>`;
             setTimeout(() => messageAreaAdminCars.innerHTML = '', 5000);
        }
    };
    
    // Fetch CSRF token
    const initCsrf = async () => {
        try {
            const response = await fetch('/api/csrf-token');
            if (!response.ok) throw new Error('CSRF token fetch failed');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (error) {
            console.error('CSRF init error:', error);
            showMessage(messageAreaAdminForm || messageAreaAdminCars, 'Failed to initialize security token. Please refresh.', 'error');
        }
    };

    // Load cars for the admin list page
    const loadCars = async () => {
        if (!carsTableBody) return; // Only run on car list page
        if (!csrfToken) await initCsrf(); // Ensure CSRF token is loaded for delete/edit links if needed directly

        try {
            const response = await fetch('/api/admin/cars');
            const result = await response.json();

            if (result.status === 'success' && result.data.cars) {
                carsTableBody.innerHTML = ''; // Clear existing rows
                if (result.data.cars.length === 0) {
                    carsTableBody.innerHTML = '<tr><td colspan="7">No cars found.</td></tr>';
                    return;
                }
                result.data.cars.forEach(car => {
                    const row = `
                        <tr>
                            <td><img src="${car.imageURL || '/images/default-car.png'}" alt="${car.make} ${car.model}" width="100"></td>
                            <td>${car.make}</td>
                            <td>${car.model}</td>
                            <td>${car.year}</td>
                            <td>${car.pricePerDay.toFixed(2)}</td>
                            <td>${car.status}</td>
                            <td>
                                <a href="/admin/cars/form.html?id=${car._id}" class="button-edit">Edit</a>
                                <button class="button-delete" data-id="${car._id}">Delete</button>
                            </td>
                        </tr>
                    `;
                    carsTableBody.insertAdjacentHTML('beforeend', row);
                });
                attachDeleteListeners();
            } else {
                showMessage(messageAreaAdminCars, result.message || 'Could not load cars.');
            }
        } catch (error) {
            console.error('Load cars error:', error);
            showMessage(messageAreaAdminCars, 'Error loading cars from server.');
        }
    };

    const attachDeleteListeners = () => {
        document.querySelectorAll('.button-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                const carId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this car?')) {
                    if (!csrfToken) {
                        showMessage(messageAreaAdminCars,'Security token not available. Please refresh.');
                        return;
                    }
                    try {
                        const response = await fetch(`/api/admin/cars/${carId}`, {
                            method: 'DELETE',
                            headers: { 'CSRF-Token': csrfToken }
                        });
                        const result = await response.json();
                        if (result.status === 'success') {
                            showMessage(messageAreaAdminCars, result.message || 'Car deleted successfully.', 'success');
                            loadCars(); // Reload the list
                        } else {
                            showMessage(messageAreaAdminCars, result.message || 'Failed to delete car.');
                        }
                    } catch (error) {
                        console.error('Delete car error:', error);
                        showMessage(messageAreaAdminCars, 'Error deleting car.');
                    }
                }
            });
        });
    };

    // Handle car form (Add/Edit)
    const initCarForm = async () => {
        if (!carForm) return; // Only run on form page
        await initCsrf(); // Fetch CSRF token first

        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');
        const formTitle = document.getElementById('form-title');
        const formHeading = document.getElementById('form-heading');
        const submitButton = document.getElementById('submit-button');
        const currentImageDisplay = document.getElementById('current-image');
        const noImageText = document.getElementById('no-image-text');

        if (carId) { // Edit mode
            if(formTitle) formTitle.textContent = 'Edit Car';
            if(formHeading) formHeading.textContent = 'Edit Car';
            if(submitButton) submitButton.textContent = 'Update Car';

            try {
                const response = await fetch(`/api/admin/cars/${carId}`);
                const result = await response.json();
                if (result.status === 'success' && result.data.car) {
                    const car = result.data.car;
                    document.getElementById('make').value = car.make || '';
                    document.getElementById('model').value = car.model || '';
                    document.getElementById('year').value = car.year || '';
                    document.getElementById('pricePerDay').value = car.pricePerDay || '';
                    document.getElementById('status').value = car.status || 'available';
                    document.getElementById('features').value = car.features ? car.features.join(', ') : '';
                    if (car.imageURL) {
                        if(currentImageDisplay) {
                            currentImageDisplay.src = car.imageURL;
                            currentImageDisplay.style.display = 'block';
                        }
                        if(noImageText) noImageText.style.display = 'none';
                    } else {
                        if(currentImageDisplay) currentImageDisplay.style.display = 'none';
                        if(noImageText) noImageText.style.display = 'block';
                    }
                } else {
                    showMessage(messageAreaAdminForm, result.message || 'Could not fetch car details.');
                }
            } catch (error) {
                console.error('Fetch car details error:', error);
                showMessage(messageAreaAdminForm, 'Error fetching car details.');
            }
        } else { // Add mode
            if(formTitle) formTitle.textContent = 'Add New Car';
            if(formHeading) formHeading.textContent = 'Add New Car';
            if(submitButton) submitButton.textContent = 'Add Car';
            if(currentImageDisplay) currentImageDisplay.style.display = 'none';
            if(noImageText) noImageText.style.display = 'block';
        }

        carForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!csrfToken) {
                showMessage(messageAreaAdminForm, 'Security token not available. Please refresh.');
                return;
            }

            const formData = new FormData(carForm);
            // Note: 'features' needs to be handled if it's expected as an array by backend,
            // but API controller already splits comma-separated string.

            const url = carId ? `/api/admin/cars/${carId}` : '/api/admin/cars';
            const method = carId ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'CSRF-Token': csrfToken }, // FormData sets Content-Type automatically
                    body: formData
                });
                const result = await response.json();
                if (result.status === 'success') {
                    showMessage(messageAreaAdminForm, result.message || `Car ${carId ? 'updated' : 'added'} successfully!`, 'success');
                    setTimeout(() => window.location.href = '/admin/cars/index.html', 1500);
                } else {
                    // Display validation errors if present
                    let errorsText = result.message || `Failed to ${carId ? 'update' : 'add'} car.`;
                    if (result.errors && Array.isArray(result.errors)) {
                        errorsText += '<ul>';
                        result.errors.forEach(err => {
                            errorsText += `<li>${err.msg} (param: ${err.param})</li>`;
                        });
                        errorsText += '</ul>';
                    }
                    showMessage(messageAreaAdminForm, errorsText, 'error');
                }
            } catch (error) {
                console.error('Car form submit error:', error);
                showMessage(messageAreaAdminForm, `Error submitting car data.`);
            }
        });
    };

    // Initialize based on current page
    if (document.getElementById('cars-table')) {
        loadCars();
    } else if (document.getElementById('car-form')) {
        initCarForm();
    }
     // Initialize CSRF for pages that might not call loadCars or initCarForm immediately
    // but still need it for other actions (e.g. a global admin logout button if not handled by main-app.js)
    if(!csrfToken && (messageAreaAdminCars || messageAreaAdminForm)) { // if on an admin page
        initCsrf();
    }
});
