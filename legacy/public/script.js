document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rideForm');
    const messageDiv = document.getElementById('formMessage');
    const pickupCitySelect = document.getElementById('pickupCity');
    const dropoffCitySelect = document.getElementById('dropoffCity');
    const statusDiv = document.createElement('div');
    statusDiv.id = 'ride-status';
    form.parentNode.insertBefore(statusDiv, form.nextSibling);

    // Fetch cities and populate selects
    fetch('/api/cities')
        .then(response => response.json())
        .then(cities => {
            cities.forEach(city => {
                const option1 = document.createElement('option');
                option1.value = city;
                option1.textContent = city;
                pickupCitySelect.appendChild(option1.cloneNode(true));

                const option2 = document.createElement('option');
                option2.value = city;
                option2.textContent = city;
                dropoffCitySelect.appendChild(option2);
            });
        })
        .catch(err => {
            console.error('Failed to fetch cities:', err);
            showMessage('Could not load cities. Please try again later.', 'error');
        });

    // Socket.IO connection
    const socket = io();
    let currentRideId = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Collect form data
        const formData = {
            passenger_name: document.getElementById('passengerName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            pickup_city: pickupCitySelect.value,
            dropoff_city: dropoffCitySelect.value,
            pickup_location: document.getElementById('pickupLocation').value.trim() || null,
            dropoff_location: document.getElementById('dropoffLocation').value.trim() || null,
            ride_time: document.getElementById('rideTime').value
        };

        // Basic validation
        if (!formData.passenger_name || !formData.phone || !formData.pickup_city || !formData.dropoff_city || !formData.ride_time) {
            showMessage('Please fill in all required fields.', 'error');
            return;
        }

        // Submit to API
        fetch('/api/rides', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(data.message, 'success');
                form.reset();
                currentRideId = data.id;
                // Join the ride room to receive updates
                socket.emit('join_ride', { rideId: currentRideId, role: 'customer' });
                // Update status div
                statusDiv.innerHTML = `<p>Ride ordered! Waiting for a driver to accept...</p>`;
                statusDiv.className = 'message info';
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showMessage('Something went wrong. Please try again.', 'error');
        });
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        // Optionally clear after a few seconds
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }

    // Socket.IO event listeners for the customer
    socket.on('ride_accepted', (data) => {
        if (data.rideId === currentRideId) {
            statusDiv.innerHTML = `<p>Ride accepted by driver ${data.driver_name}! They are on their way.</p>`;
            statusDiv.className = 'message success';
        }
    });

    socket.on('location_update', (data) => {
        if (data.rideId === currentRideId) {
            statusDiv.innerHTML += `<p>Driver location update: ${data.location}</p>`;
            // Scroll to bottom
            statusDiv.scrollTop = statusDiv.scrollHeight;
        }
    });

    socket.on('ride_completed', (data) => {
        if (data.rideId === currentRideId) {
            statusDiv.innerHTML += `<p>Ride completed! Thank you for using PearlBoda.</p>`;
            statusDiv.className = 'message success';
        }
    });

    // Optional: add a class for info messages
    const style = document.createElement('style');
    style.textContent = `
        .message.info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
    `;
    document.head.appendChild(style);
});
