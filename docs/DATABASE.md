# AutoLog — Database Documentation

## Overview

AutoLog uses Supabase PostgreSQL as its primary database.

The database stores user profiles, vehicles, fuel records, maintenance records, and other vehicle-related expenses.

## Database Tables

```text
profiles
   │
   │ 1
   │
   └───────────────┐
                   │
vehicles ──────────┤
   │               │
   ├── fuel_logs   │
   ├── maintenance_records
   └── expenses