# AutoLog — System Architecture

## Overview

AutoLog is a full-stack vehicle management application built with React, Vite, and Supabase.

The application follows a modular architecture where the frontend handles the user interface, service modules handle database operations, and Supabase provides authentication and persistent data storage.

## Architecture Flow

```text
User
 │
 ▼
React UI
 │
 ├── Pages
 │   ├── Dashboard
 │   ├── Vehicles
 │   ├── Vehicle Details
 │   ├── Fuel
 │   ├── Maintenance
 │   ├── Expenses
 │   └── Profile
 │
 ▼
Service Layer
 │
 ├── authService
 ├── vehicleService
 ├── fuelService
 ├── maintenanceService
 └── expenseService
 │
 ▼
Supabase Client
 │
 ├── Authentication
 │
 └── PostgreSQL Database
       │
       ├── profiles
       ├── vehicles
       ├── fuel_logs
       ├── maintenance_records
       └── expenses