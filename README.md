# FoodPrint — AI Food Waste Reduction Platform

AI Food Waste Reduction Platform — 24CIE554 Full Stack Development

This is the **Phase 2** deliverable: the complete backend (all APIs, CRUD, authentication &
authorization, database fully connected) with the frontend integrated against it.

## What's included

**Frontend (React)**
- All pages designed: Landing, Login, Register, Dashboard, Log Surplus Food, Browse Surplus,
  Analytics, Admin
- Navigation via React Router, role-aware nav bar
- Forms with client-side validation (login, register, log-surplus-food)
- Connected to the real backend via Axios (not mock data)

**Backend (Node.js + Express + MongoDB)**
- Project set up with Express, dotenv, CORS
- MongoDB connected via Mongoose (`config/db.js`)
- Authentication: Register + Login with hashed passwords and JWT (`/api/auth`)
- One full CRUD module: surplus food listings, including claim logic and filters (`/api/food`)
- JWT-protected routes and role-based authorization middleware

## Folder structure

```
FoodPrint/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/          -> axios instance
    │   ├── context/       -> auth state
    │   ├── components/    -> Navbar, ProtectedRoute
    │   ├── pages/          -> all pages
    │   └── styles/
    └── package.json
```


## API reference

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Log in, receive JWT |
| GET | /api/auth/me | Private | Current user's profile |
| PATCH | /api/auth/me | Private | Update own name / organization / location |
| GET | /api/food | Private | List listings (filters: category, status, from, to, search) |
| POST | /api/food | Provider, Admin | Publish a listing |
| GET | /api/food/mine | Provider, Admin | Listings the logged-in provider published |
| GET | /api/food/claims/mine | NGO, Student, Admin | Listings the logged-in user claimed |
| GET | /api/food/stats | Private | Aggregated KPIs, by-category and over-time data (filters: category, from, to) |
| GET | /api/food/:id | Private | Single listing |
| PUT | /api/food/:id | Owner, Admin | Edit an available listing |
| PATCH | /api/food/:id/claim | NGO, Student, Admin | Claim an available listing |
| DELETE | /api/food/:id | Owner, Admin | Remove a listing |
| GET | /api/users | Admin | List users (filter: role) |
| GET | /api/users/:id | Admin | Single user |
| PATCH | /api/users/:id | Admin | Change role / activate / deactivate / edit details |
| DELETE | /api/users/:id | Admin | Delete a user |

Notes:
- Listings past their pickup window are automatically marked `expired` whenever listings or stats are read.
- Deactivated users cannot log in, and their existing tokens are rejected.
- Analytics are computed on the server with MongoDB aggregation pipelines.

## AI assistant

Two layers, both using the app's own data (a user only ever sees data their role allows):

1. **Rule-based predictions** (`backend/services/insights.js`): from each provider's listing history it
   computes the unclaimed ("waste") rate per category, average surplus, busiest weekday, and a suggested
   cut in preparation quantity. Works with no API key.
2. **LLM chat** (`backend/controllers/aiController.js`): the user's data is sent as context to the Google
   Gemini API, which answers questions in plain language. If no key is set or the call fails, the
   assistant falls back to the rule-based answers automatically.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/insights | Predictions + recommendations for the logged-in user |
| POST | /api/ai/chat | Ask the assistant a question |
| POST | /api/ai/analyze | Explain the analytics for the chosen filters (category, date range) |

To enable Gemini, get a free key at https://aistudio.google.com/apikey and add to `backend/.env`:
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```
Never commit `.env` (it is already in `.gitignore`).

## Seeding demo data

```bash
cd backend
npm run seed
```

Creates demo accounts (all passwords are in the seed output) and sample listings:
`admin@foodprint.com`, `greenleaf@foodprint.com` (provider), `ngo@foodprint.com`, `student@foodprint.com`.

## How to run it

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your local MongoDB or a MongoDB Atlas connection string,
# and set JWT_SECRET to any long random string
npm run dev
```

The API runs at `http://localhost:5000`. You should see `MongoDB connected: ...` and
`FoodPrint backend listening on port 5000` in the terminal.

If you don't have MongoDB installed locally, the fastest option is a free
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster — create one, grab the connection
string, and paste it into `MONGO_URI`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

This opens `http://localhost:3000`. Register an account (choose "Restaurant / Canteen" to log
surplus food, or "NGO"/"Student" to browse and claim it), then try the flow end to end.

## Future enhancements

- Real-time notifications to nearby NGOs/students when a listing is published
- Location-based matching (distance between provider and recipient)
- Time-series demand forecasting with more history
- Deployment (Render for the API, Netlify/Vercel for the React app)
- Automated tests
