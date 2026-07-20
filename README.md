# 📚 AI eBook Creator

An AI-powered full-stack MERN application that enables users to create, edit, manage, and export eBooks with the help of Generative AI. Users can generate chapter outlines, create AI-generated chapter content, edit books manually, and export them as PDF or DOCX files.

---

## 🚀 Live Demo

### Frontend
https://ebook-creator-kappa.vercel.app/

### Backend API
https://ebook-creator-backend-takn.onrender.com

---

# ✨ Features

- 🔐 User Authentication (JWT)
- 👤 User Registration & Login
- 📖 Create and Manage eBooks
- 🤖 AI-powered Outline Generation
- 📝 AI Chapter Content Generation
- ✏️ Rich Book Editing
- 💾 Auto Save Book Changes
- 📚 Dashboard for Book Management
- 📄 Export Book as PDF
- 📝 Export Book as DOCX
- ☁️ Cloud Database using MongoDB Atlas
- 🌐 Fully Responsive UI

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- React Router
- Axios
- CSS

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Gemini API

## Deployment

- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

# 📂 Project Structure

```
AI-eBook-Creator
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── uploads
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Anushka7237/Ebook-creator.git

```

---

## Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the backend folder.

```env
PORT=5000

MONGO_URL=your_mongodb_connection_string

JWT_SECRET=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
```

Run Backend

```bash
npm start
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create a `.env` file.

```env
VITE_API_URL=http://localhost:5000
```

Run Frontend

```bash
npm run dev
```

---

# 🌐 API Endpoints

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |
| GET | /api/auth/profile |
| PUT | /api/auth/profile |

---

## Books

| Method | Endpoint |
|---------|----------|
| POST | /api/books |
| GET | /api/books |
| GET | /api/books/:id |
| PUT | /api/books/:id |
| DELETE | /api/books/:id |

---

## AI

| Method | Endpoint |
|---------|----------|
| POST | /api/ai/generate-outline |
| POST | /api/ai/generate-chapter-content |

---

## Export

| Method | Endpoint |
|---------|----------|
| GET | /api/export/pdf/:id |
| GET | /api/export/docx/:id |

---

# 🔒 Authentication

- JWT Authentication
- Protected Routes
- Password Hashing
- Authorization Middleware

---

# 📦 Deployment

Frontend

- Vercel

Backend

- Render

Database

- MongoDB Atlas

---

# 📋 Future Improvements

- AI Image Generation
- Book Cover Generator
- Multi-language Support
- Collaborative Editing
- Dark/Light Theme
- Rich Text Editor
- AI Grammar Checker
- Cloud File Storage

---

# 🧪 Testing

The application has been tested for:

- User Registration
- User Login
- Authentication
- Book CRUD Operations
- AI Outline Generation
- AI Chapter Generation
- Book Editing
- PDF Export
- DOCX Export
- Deployment

---

## 🌐 Connect here <p align="left">

<a href="https://linkedin.com/in/anushka-gupta18" target="blank"> <img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/linked-in-alt.svg" alt="anushka-gupta18" height="30" width="40" /> </a> </p>
