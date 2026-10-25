let SERVER_URL: string
let API_URL: string

if (import.meta.env.MODE === 'localhost') {
  SERVER_URL = 'http://localhost:8000/api/v1'
  API_URL = 'http://localhost:8000/client/v1'
} else {
  SERVER_URL = 'https://optikiapi.tuliime.com/api/v1'
  API_URL = 'https://optikiapi.tuliime.com/client/v1'
}

// The API's own origin, which also serves the Gym fixture pages.
const API_ORIGIN = new URL(SERVER_URL).origin

export { API_ORIGIN, API_URL, SERVER_URL }
