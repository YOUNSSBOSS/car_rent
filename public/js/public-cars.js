document.addEventListener('DOMContentLoaded', () => {
    const carsListContainer = document.getElementById('cars-list-container');
    const filterSearchForm = document.getElementById('filter-search-form');
    const messageAreaCars = document.getElementById('message-area-cars');
    const paginationControlsContainer = document.getElementById('pagination-controls');

    const carDetailContainer = document.getElementById('car-detail-container');
    const messageAreaCarDetail = document.getElementById('message-area-cardetail');

    // Utility to display messages
    const showMessage = (area, message, type = 'error') => {
        if (area) {
            area.innerHTML = `<p class="${type}">${message}</p>`;
            // setTimeout(() => area.innerHTML = '', 3000); // Optional: auto-clear
        }
    };
    
    // Fetch and display cars on list page
    const fetchAndDisplayCars = async (params = {}) => {
        if (!carsListContainer) return;

        const query = new URLSearchParams(params).toString();
        try {
            const response = await fetch(`/api/cars?${query}`);
            const result = await response.json();

            carsListContainer.innerHTML = ''; // Clear previous results
            if (result.status === 'success' && result.data.cars) {
                if (result.data.cars.length === 0) {
                    carsListContainer.innerHTML = '<p>No cars found matching your criteria.</p>';
                }
                result.data.cars.forEach(car => {
                    const carElement = `
                        <div class="car-item" style="border: 1px solid #ccc; padding: 10px; width: 220px;">
                            <img src="${car.imageURL || '/images/default-car.png'}" alt="${car.make} ${car.model}" style="width: 100%; height: 130px; object-fit: cover;">
                            <h3>${car.make} ${car.model} (${car.year})</h3>
                            <p>Price: $${car.pricePerDay.toFixed(2)}/day</p>
                            <p>Status: ${car.status}</p>
                            <a href="/cars/detail.html?id=${car._id}">View Details</a>
                        </div>
                    `;
                    carsListContainer.insertAdjacentHTML('beforeend', carElement);
                });
                renderPagination(result.data.pagination, params);
            } else {
                showMessage(messageAreaCars, result.message || 'Could not fetch cars.');
            }
        } catch (error) {
            console.error('Fetch cars error:', error);
            showMessage(messageAreaCars, 'Error fetching cars from server.');
        }
    };

    const renderPagination = (paginationData, currentParams) => {
        if (!paginationControlsContainer || !paginationData || paginationData.totalPages <= 1) {
            if (paginationControlsContainer) paginationControlsContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        // Previous Button
        if (paginationData.currentPage > 1) {
            const prevParams = new URLSearchParams({...currentParams, page: paginationData.currentPage - 1});
            paginationHTML += `<button data-page="${paginationData.currentPage - 1}" class="pagination-btn">Previous</button> `;
        }

        // Page Numbers (simplified)
        for (let i = 1; i <= paginationData.totalPages; i++) {
            if (i === paginationData.currentPage) {
                paginationHTML += `<button class="pagination-btn active" disabled>${i}</button> `;
            } else {
                 paginationHTML += `<button data-page="${i}" class="pagination-btn">${i}</button> `;
            }
        }

        // Next Button
        if (paginationData.currentPage < paginationData.totalPages) {
             const nextParams = new URLSearchParams({...currentParams, page: paginationData.currentPage + 1});
            paginationHTML += `<button data-page="${paginationData.currentPage + 1}" class="pagination-btn">Next</button>`;
        }
        paginationControlsContainer.innerHTML = paginationHTML;

        document.querySelectorAll('.pagination-btn').forEach(button => {
            if(button.disabled) return;
            button.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                const currentSearchParams = new URLSearchParams(window.location.search);
                currentSearchParams.set('page', page);
                fetchAndDisplayCars(Object.fromEntries(currentSearchParams.entries()));
            });
        });
    };


    if (filterSearchForm) {
        // Initial load
        const initialParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
        document.getElementById('search-query').value = initialParams.search || '';
        document.getElementById('min-price').value = initialParams.minPrice || '';
        document.getElementById('max-price').value = initialParams.maxPrice || '';
        fetchAndDisplayCars(initialParams);

        filterSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterSearchForm);
            const params = Object.fromEntries(formData.entries());
            // Remove page from params on new search/filter to go to first page
            delete params.page; 
            // Update URL without reloading for bookmarking/sharing (optional)
            const newUrl = new URL(window.location.pathname, window.location.origin);
            for(const key in params) { if(params[key]) newUrl.searchParams.set(key, params[key]); }
            history.pushState({}, '', newUrl);

            fetchAndDisplayCars(params);
        });
        document.getElementById('clear-filters')?.addEventListener('click', () => {
            filterSearchForm.reset();
            history.pushState({}, '', window.location.pathname); // Clear query params from URL
            fetchAndDisplayCars({});
        });
    }

    // Fetch and display single car details
    const fetchCarDetails = async () => {
        if (!carDetailContainer) return;

        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');

        if (!carId) {
            showMessage(messageAreaCarDetail, 'No car ID provided.');
            return;
        }

        try {
            const response = await fetch(`/api/cars/${carId}`);
            const result = await response.json();

            if (result.status === 'success' && result.data.car) {
                const car = result.data.car;
                document.getElementById('car-detail-title').textContent = `${car.make} ${car.model} - Details`;
                document.getElementById('car-make-model').textContent = `${car.make} ${car.model} (${car.year})`;
                const carImageEl = document.getElementById('car-image');
                if (car.imageURL) {
                    carImageEl.src = car.imageURL;
                    carImageEl.alt = `${car.make} ${car.model}`;
                    carImageEl.style.display = 'block';
                } else {
                    carImageEl.style.display = 'none';
                }
                document.getElementById('car-year').textContent = car.year;
                document.getElementById('car-price').textContent = car.pricePerDay.toFixed(2);
                document.getElementById('car-status').textContent = car.status;
                
                const featuresList = document.getElementById('car-features-list');
                const featuresContainer = document.getElementById('car-features-container');
                featuresList.innerHTML = ''; // Clear
                if (car.features && car.features.length > 0) {
                    car.features.forEach(feature => {
                        const li = document.createElement('li');
                        li.textContent = feature;
                        featuresList.appendChild(li);
                    });
                    featuresContainer.style.display = 'block';
                } else {
                     featuresContainer.style.display = 'none';
                }

                const bookingActionArea = document.getElementById('booking-action-area');
                // Check global scope for currentUser (from main-app.js, if loaded and populated)
                // This is a simplified check. A more robust way would be to have main-app.js emit an event or provide a global function.
                if (window.currentUserSession && window.currentUserSession.user) { 
                     bookingActionArea.innerHTML = `<a href="/bookings/form.html?carId=${car._id}" class="button">Book Now</a>`;
                } else {
                     bookingActionArea.innerHTML = `<p><a href="/auth/login.html">Log in</a> to book this car.</p>`;
                }

            } else {
                showMessage(messageAreaCarDetail, result.message || 'Could not fetch car details.');
            }
        } catch (error) {
            console.error('Fetch car detail error:', error);
            showMessage(messageAreaCarDetail, 'Error fetching car details from server.');
        }
    };

    // Initialize based on which page is loaded
    if (carsListContainer) {
        // Handled by filterSearchForm logic above which calls fetchAndDisplayCars
    } else if (carDetailContainer) {
        fetchCarDetails();
    }
});
