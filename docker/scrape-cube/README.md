# Scrape Cube

A cool web scrape application. The React frontend sends a search word to a Flask backend, which scrapes DuckDuckGo and returns the results as a spinning 3D cube. The response also includes the configured volume path and backend URL.

> Note: Google blocks plain HTTP scraping and returns a JS/CAPTCHA page, so this demo uses the DuckDuckGo HTML search endpoint, which is reliable and requires no API key.

## Project structure

```
scrape-cube/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── package.json
│   ├── .env
│   ├── Dockerfile
│   ├── public/
│   └── src/
│       ├── index.js
│       ├── App.js
│       └── App.css
└── docker-compose.yml
```

## Run with Docker Compose

```bash
cd scrape-cube
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: `curl http://localhost:5000/api/health`
- Search endpoint: `curl "http://localhost:5000/api/search?q=devops"`

## Run locally (development)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The backend runs on http://localhost:5000.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend runs on http://localhost:3001 (React defaults to 3000, but it will pick 3001 if 3000 is in use). Set `REACT_APP_BACKEND_URL` in `.env` to point at the backend.

## Configuration

- **Volume**: The backend uses `/data` inside the container. It is mounted as the named Docker volume `scrape_data`.
- **Backend URL**: Change `REACT_APP_BACKEND_URL` in `frontend/.env` or the `docker-compose.yml` `args` section to point at the backend.

## Notes

- Google search scraping can be blocked or return CAPTCHA pages depending on the request environment.
- This is intended for educational/demo use.
