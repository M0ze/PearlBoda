document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const pendingRidesDiv = document.getElementById('rides-list');
    const acceptedRideSection = document.getElementById('accepted-ride');
    const rideDetailsDiv = document.getElementById('ride-details');
    const startRideBtn = document.getElementById('start-ride-btn');
    const completeRideBtn = document.getElementById('complete-ride-btn');
    const locationInput = document.getElementById('location-input');
    const updateLocationBtn = document.getElementById('update-location-btn');

    let currentRideId = null;
    let driverName = '';

    // Ask for driver name
    driverName = prompt('Enter your name:');
    if (!driverName) {
        driverName = 'Anonymous Driver';
    }

    // Join the driver role room
    socket.emit('join_ride', { role: 'driver' });

    // Fetch pending rides initially and set up listener for new rides
    function fetchPendingRides() {
        fetch('/api/rides')
            .then(response => response.json())
            .then(rides => {
                const pending = rides.filter(ride => ride.status === 'pending');
                renderPendingRides(pending);
            })
            .catch(err => {
                console.error('Error fetching rides:', err);
            });
    }

    function renderPendingRides(rides) {
        if (rides.length === 0) {
            pendingRidesDiv.innerHTML = '<p>No pending rides.</p>';
            return;
        }
        pendingRidesDiv.innerHTML = '';
        rides.forEach(ride => {
            const rideEl = document.createElement('div');
            rideEl.className = 'ride-item';
            rideEl.innerHTML = `
                <p><strong>Passenger:</strong> ${ride.passenger_name}</p>
                <p><strong>Phone:</strong> ${ride.phone}</p>
                <p><strong>From:</strong> ${ride.pickup_city} ${ride.pickup_location ? `(${ride.pickup_location})` : ''}</p>
                <p><strong>To:</strong> ${ride.dropoff_city} ${ride.dropoff_location ? `(${ride.dropoff_location})` : ''}</p>
                <p><strong>Time:</strong> ${ride.ride_time}</p>
                <button data-ride-id="${ride.id}" data-passenger-name="${ride.passenger_name}" class="accept-btn">Accept Ride</button>
            `;
            pendingRidesDiv.appendChild(rideEl);
        });

        // Add event listeners to accept buttons
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rideId = e.target.dataset.rideId;
                const passengerName = e.target.dataset.passengerName;
                acceptRide(rideId, passengerName);
            });
        });
    }

    function acceptRide(rideId, passengerName) {
        fetch(`/api/rides/${rideId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ driver_name: driverName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                currentRideId = rideId;
                // Show accepted ride section
                pendingRidesDiv.style.display = 'none';
                acceptedRideSection.style.display = 'block';
                // Join the specific ride room
                socket.emit('join_ride', { rideId: currentRideId, role: 'driver' });
                // Fetch ride details to display
                fetch(`/api/rides/${rideId}`)
                    .then(res => res.json())
                    .then(ride => {
                        rideDetailsDiv.innerHTML = `
                            <p><strong>Passenger:</strong> ${ride.passenger_name}</p>
                            <p><strong>Phone:</strong> ${ride.phone}</p>
                            <p><strong>From:</strong> ${ride.pickup_city} ${ride.pickup_location ? `(${ride.pickup_location})` : ''}</p>
                            <p><strong>To:</strong> ${ride.dropoff_city} ${ride.dropoff_location ? `(${ride.dropoff_location})` : ''}</p>
                            <p><strong>Time:</strong> ${ride.ride_time}</p>
                            <p><strong>Driver:</strong> ${ride.driver_name}</p>
                        `;
                    });
            }
        })
        .catch(err => {
            console.error('Error accepting ride:', err);
            alert('Failed to accept ride. Please try again.');
        });
    }

    // Listen for new rides from socket.io
    socket.on('new_ride', (ride) => {
        // If we don't have an accepted ride, we can add this to the pending list
        if (!currentRideId) {
            // We'll refetch pending rides to keep it simple
            fetchPendingRides();
        }
    });

    // Start ride button
    startRideBtn.addEventListener('click', () => {
        if (!currentRideId) return;
        // We don't have a specific endpoint for starting, but we can consider accepted as started.
        // For simplicity, we'll just change the status in the UI and let the driver update location.
        // We'll emit an event to the customer that the ride has started.
        socket.emit('ride_started', { rideId: currentRideId });
        alert('Ride started. You can now update your location.');
    });

    // Complete ride button
    completeRideBtn.addEventListener('click', () => {
        if (!currentRideId) return;
        fetch(`/api/rides/${currentRideId}/complete`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Ride completed!');
                // Reset
                currentRideId = null;
                acceptedRideSection.style.display = 'none';
                pendingRidesDiv.style.display = 'block';
                fetchPendingRides();
            }
        })
        .catch(err => {
            console.error('Error completing ride:', err);
            alert('Failed to complete ride.');
        });
    });

    // Update location button
    updateLocationBtn.addEventListener('click', () => {
        const location = locationInput.value.trim();
        if (!location) {
            alert('Please enter a location');
            return;
        }
        // Emit via socket.io to the ride room
        socket.emit('driver_location_update', {
            rideId: currentRideId,
            location: location
        });
        // Also update via API (optional, but we have the endpoint)
        fetch(`/api/rides/${currentRideId}/update_location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Location updated via API');
            locationInput.value = '';
        })
        .catch(err => {
            console.error('Error updating location via API:', err);
        });
    });

    // Initial fetch
    fetchPendingRides();
});
