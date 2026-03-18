# 🛍️ ShopU

ShopU is a full-stack e-commerce platform that enables users to browse products, connect with friends, and perform secure online transactions. The platform is designed with scalability, real-time communication, and modern web technologies in mind.

---

## 🚀 Features

* 🔐 User Authentication (Auth0 / custom login system)
* 🛒 Product browsing and purchasing
* 💳 Secure payments (PayPal integration)
* 👥 Social features (friends system, messaging)
* 💬 Real-time communication (WebSocket-based chat)
* ❤️ Favorites and personalized feeds
* 🔍 Search and filtering system
* 🧾 Seller and buyer interaction system

---

## 🏗️ Tech Stack

### Frontend

* React.js
* JavaScript / TypeScript
* HTML / CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### DevOps / Tools

* Docker & Docker Compose
* Git & GitHub
* CI/CD (planned or implemented)

---

## 📁 Project Structure

```
ShopU/
├── frontend/        # React frontend
├── backend/         # Node.js backend API
├── docker/          # Docker configuration
├── scripts/         # Utility scripts
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```
git clone https://github.com/YujieHeMarioho/ShopU.git
cd ShopU
```

### 2. Setup environment variables

Create `.env` files:

```
backend/.env
frontend/.env
```

Example:

```
# backend/.env
PORT=5000
DATABASE_URL=your_database_url
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

⚠️ **Important:** Never commit `.env` files to GitHub.

---

### 3. Run with Docker (Recommended)

```
docker-compose up --build
```

---

### 4. Run manually (Optional)

#### Backend

```
cd backend
npm install
npm run dev
```

#### Frontend

```
cd frontend
npm install
npm start
```

---

## 🌐 Usage

* Frontend: http://localhost:3000
* Backend API: http://localhost:5000

---

## 🧪 Future Improvements

* Improve recommendation system
* Add AI-based product suggestions
* Enhance CI/CD pipeline
* Optimize database performance
* Add mobile support

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

This project is for educational and development purposes.

---

## 👨‍💻 Author

**Yujie He**

* GitHub: https://github.com/YujieHeMarioho

---
