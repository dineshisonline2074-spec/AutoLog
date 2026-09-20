# AutoLog 🚗

> A modern vehicle management web application to track vehicles, fuel, maintenance, and expenses in one place.

## 🌐 Live Demo

**Live Application:**  
https://autolog-eta.vercel.app/

## 📌 About

AutoLog is a full-stack vehicle management application designed to help vehicle owners keep track of their vehicle-related information and spending.

Instead of maintaining separate notes or spreadsheets, AutoLog brings vehicle details, fuel records, maintenance history, and expenses into one organized dashboard.

## ✨ Features

- 🔐 Secure user authentication
- 🚗 Multiple vehicle management
- ⛽ Fuel log tracking
- 🔧 Maintenance record tracking
- 💰 Vehicle expense tracking
- 📊 Dashboard spending overview
- 📅 Maintenance reminders and status
- 📈 Fuel and expense summaries
- 👤 User profile management
- 📱 Responsive design for desktop and mobile
- 🔒 Supabase Row Level Security for user data

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Lucide React
- CSS

### Backend & Database
- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)

### Deployment
- Vercel
- GitHub

## 🗂️ Main Modules

### Dashboard
Provides an overview of vehicles, spending, fuel expenses, maintenance costs, recent activity, and upcoming maintenance.

### Vehicles
Users can:

- Add vehicles
- Edit vehicle information
- Delete vehicles
- View vehicle details
- Track current odometer readings

### Fuel Logs
Users can record:

- Fuel date
- Odometer reading
- Fuel quantity
- Price per liter
- Total fuel cost
- Fuel station
- Notes

### Maintenance
Users can manage:

- Service type
- Service date
- Odometer reading
- Service cost
- Service center
- Next service date
- Next service odometer
- Notes

### Expenses
Users can track expenses such as:

- Fuel
- Maintenance
- Insurance
- Parking
- Toll
- Accessories
- Cleaning
- Repairs
- Registration
- Fines
- Other expenses

## 🔐 Security

AutoLog uses Supabase Authentication and PostgreSQL Row Level Security.

Each user's vehicle and financial records are protected so that users can access only their own data.

Environment variables are used for Supabase configuration and sensitive credentials are not committed to the repository.

## 📁 Project Structure

```text
AutoLog/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Vehicles.jsx
│   │   ├── VehicleDetails.jsx
│   │   ├── Fuel.jsx
│   │   ├── Maintenance.jsx
│   │   ├── Expenses.jsx
│   │   ├── Profile.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── vehicleService.js
│   │   ├── fuelService.js
│   │   ├── maintenanceService.js
│   │   └── expenseService.js
│   ├── styles/
│   ├── App.jsx
│   └── index.css
├── .gitignore
├── package.json
└── README.md