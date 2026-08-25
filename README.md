# PearlBoda

A simple web application for ordering boda boda rides in Hioma, Kampala, and Fortportal cities in Uganda.

## Features

- View available cities (Hioma, Kampala, Fortportal)
- Submit ride order with passenger name, phone, pickup/drop-off locations, and desired time
- Stores ride requests in a SQLite database
- Responsive mobile-friendly UI
- **Real-time Dashboard**: View nearby riders and manage orders via a dedicated dashboard.
- **Enhanced UI**: Improved theme with better readability and dark mode support.

## Tech Stack

- **Backend**: Node.js, Express, SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Dev**: Nodemon (for development), MM (Developer)

## Setup

1. Clone the repository (or copy the files).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

- `GET /api/cities` – Returns list of supported cities.
- `POST /api/rides` – Create a new ride order.
- `GET /api/rides` – Retrieve all ride orders (useful for admin/demo).

## Database

The application uses a SQLite database file `db/rides.db`. The `rides` table is created automatically on first run.

## License

ISC