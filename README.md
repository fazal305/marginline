# Nexsoft Expense Tracker

A full-stack expense tracker application built with HTML, CSS, JavaScript, Node.js, Express, MongoDB, and Mongoose.

## Live Links

- GitHub Repository: https://github.com/fazal305/nexsoft-expense-tracker
- Backend / Live App: https://nexsoft-expense-tracker.onrender.com
- GitHub Pages Demo: https://fazal305.github.io/nexsoft-expense-tracker/

## Overview

Nexsoft Expense Tracker helps users record income and expense transactions, view total balance, calculate total income and expenses, and delete transaction records.

The project was built for the Nexsoft Solutions internship and polished under the Fazal Labs portfolio ecosystem.

## Features

- Add income transactions
- Add expense transactions
- Store transactions in MongoDB
- View transaction history
- Delete transactions
- Calculate total balance dynamically
- Calculate total income
- Calculate total expenses
- Backend health endpoint
- Frontend loading and error messages
- Safer DOM rendering for transaction titles
- Responsive dark dashboard UI

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- GitHub Pages

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- CORS
- dotenv
- Render
  Folder Structure
  nexsoft-expense-tracker/
  public/
  index.html
  style.css
  script.js
  index.html
  style.css
  script.js
  server.js
  package.json
  package-lock.json
  .env.example
  .gitignore
  LICENSE
  README.md
  Getting Started

Clone the repository:

git clone https://github.com/fazal305/nexsoft-expense-tracker.git

Open the project:

cd nexsoft-expense-tracker

Install backend dependencies:

npm install

Create a .env file:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=\*

Start the backend:

npm start

Open the app:

http://localhost:5000
API Endpoints
GET /api/health
GET /api/transactions
POST /api/transactions
DELETE /api/transactions/:id
Deployment Notes

The backend can be deployed on Render.

Required environment variable:

MONGODB_URI

Optional environment variables:

PORT
CLIENT_ORIGIN

If you update root frontend files, copy them into public/ before pushing:

Copy-Item index.html public\index.html -Force
Copy-Item style.css public\style.css -Force
Copy-Item script.js public\script.js -Force
Architecture Notes

The project uses a simple full-stack architecture.

server.js defines the Express server, MongoDB connection, transaction schema, API routes, and static file hosting.
public/ contains the files served by the deployed backend.
Root index.html, style.css, and script.js are kept for GitHub Pages compatibility.
The frontend uses Fetch API to communicate with the backend API.
Accessibility

Accessibility support includes:

Semantic main, header, section, and article structure
Form labels
Button type attributes
aria-live message area
Clear visual focus states
Responsive layout for mobile screens
Performance

Performance notes:

Lightweight frontend
No frontend framework
Static files served by Express
Small API responses
MongoDB sorting by newest transaction first
Testing Checklist

Before final submission:

Add an income transaction
Add an expense transaction
Test empty form validation
Test negative amount validation
Delete a transaction
Refresh and confirm transactions persist
Test mobile responsiveness
Test backend health route:
/api/health

Run syntax checks:

node --check script.js
node --check server.js
npm run check
Lessons Learned
Building a full-stack CRUD app
Connecting Express with MongoDB Atlas
Creating REST API routes
Using Fetch API from frontend to backend
Handling form validation
Rendering dynamic transaction data safely
Preparing a full-stack internship project for portfolio use
Future Improvements
Add user authentication
Add categories
Add monthly filters
Add charts
Add edit transaction feature
Add CSV export
Add dashboard analytics
Add protected personal accounts
