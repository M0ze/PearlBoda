/* Dashboard JS for real-time tracking */
(function() {
    'use strict';

    const socket = io();

    socket.on('connect', () => {
        console.log('Connected to dashboard server');
    });

    // In a real app, we'd listen for nearby rider locations
    // socket.on('nearby_riders', (data) => {
    //     console.log('Nearby riders:', data);
    // });
})();
