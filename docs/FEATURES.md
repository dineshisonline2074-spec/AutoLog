# AutoLog — Features

## Overview

AutoLog is designed as a centralized vehicle management system that allows users to manage vehicles, monitor spending, record fuel usage, and maintain service history.

---

## Authentication

### User Registration

Users can create an AutoLog account using:

- Full name
- Email address
- Password

Account authentication is handled by Supabase Authentication.

### User Login

Registered users can securely sign in using their email and password.

### Protected Application

Application pages are protected from unauthenticated access.

Users who are not signed in are redirected to the login page.

### Logout

Users can securely sign out from the application.

---

# Dashboard

The dashboard provides a centralized overview of vehicle activity.

### Dashboard Statistics

Users can view:

- Total vehicles
- Total spending
- Fuel spending
- Maintenance spending

### Recent Activity

The dashboard displays recent vehicle-related activity from:

- Fuel records
- Maintenance records
- Expenses

### Spending Overview

Users can see how their vehicle-related spending is distributed across different categories.

### Maintenance Status

The dashboard highlights:

- Upcoming maintenance
- Overdue maintenance
- Next service information

### Vehicle Overview

Users can quickly access their registered vehicles and their current odometer readings.

---

# Vehicle Management

AutoLog supports multiple vehicles under a single user account.

## Add Vehicle

Users can create a vehicle profile containing:

- Vehicle name
- Brand
- Model
- Year
- Registration number
- Fuel type
- Current odometer
- Purchase date

## Edit Vehicle

Existing vehicle information can be updated whenever required.

## Delete Vehicle

Users can remove vehicles they no longer manage.

Associated fuel, maintenance, and expense records are removed through database relationships with cascading deletion.

## Vehicle Details

Each vehicle has a dedicated details page containing:

- Vehicle information
- Current odometer
- Fuel summary
- Maintenance summary
- Expense summary
- Maintenance status

---

# Fuel Tracking

The Fuel module allows users to maintain a history of fuel purchases.

Users can record:

- Fuel date
- Odometer reading
- Fuel quantity
- Price per liter
- Total cost
- Fuel station
- Notes

## Automatic Cost Calculation

Total fuel cost can be calculated from:

```text
Liters × Price per liter