# Billing Software — General-Purpose POS & Billing Web Application

A modern, responsive, general-purpose billing and Point of Sale (POS) web application built using the **MERN** stack (MongoDB, Express.js, React, Node.js). 

Designed for diverse seller types — including retail stores, clothing boutiques, grocery & kirana shops, electronics retailers, wholesalers, and service providers — to manage products, create bills, record payments, track customer ledgers, and view real-time sales reports.

---

## Key Features

### 1. Dedicated POS Billing Engine (New Bill)
- **Fast Product Search:** Real-time search by product name, SKU, or barcode with instant keyboard-friendly selection.
- **Dynamic Line Items:** Support for multiple line items, quantity toggles, price overrides for individual sales, item-level discounts, and auto-populated GST tax brackets.
- **Custom Line Items:** One-time custom items/services can be added on the fly without adding them to the inventory catalog.
- **Customer Selection:** Seamless walk-in customer support by default, or select registered customers with a compact **"+ Quick Add Customer"** modal right inside the billing screen.
- **Zero-Trust Backend Recalculations:** Subtotals, item discounts, invoice-level discounts (flat ₹ or %), taxes, and grand totals are strictly calculated and validated on the backend.
- **Payment Settlement:** Accept Cash, UPI, Card, Net Banking, Cheque, or record partial / credit sales with instant change calculation.
- **Print & PDF:** Generate print-friendly tax receipts on A4 or thermal paper immediately after sale completion.

### 2. Business Setup & Customization
- Store name, business type, owner name, contact phone, email, and full address.
- GSTIN configuration and tax defaults (0%, 5%, 12%, 18%, 28%).
- Customizable invoice numbering (prefixes like `INV-`, starting sequence numbers).
- Configurable terms and conditions and invoice footer notes printed on receipts.
- Multi-currency support (defaults to INR `₹`).

### 3. Product & Service Catalog
- Add, edit, search, and deactivate products.
- Categorization with dynamic category management.
- Units of measure: piece, kg, gram, litre, meter, hour, service, box, packet.
- Internal purchase price tracking (hidden on customer receipts).

### 4. Customer Directory & Account Ledger
- Maintain customer contact details, addresses, and GSTINs.
- Automatic ledger tracking: `Total Billed`, `Total Paid`, and `Outstanding Balance`.
- Detailed invoice history modal per customer.

### 5. Invoice History & Controlled Cancellation
- Filterable history table (search by invoice #, customer name, phone, date range, and payment status).
- Status badges: `PAID`, `PARTIALLY PAID`, `UNPAID`, `DRAFT`, `CANCELLED`.
- Full invoice detail view and print preview.
- Controlled invoice cancellation workflow that reverses customer balances without corrupting financial audit history.

### 6. Payment Collection Management
- Settle outstanding credit invoices directly without creating duplicate bills.
- Filter payments by method (Cash, UPI, Card, etc.) and date range.
- Tracks transaction reference numbers and internal notes.

### 7. Real-Time Dashboard & Reports
- **Dashboard:** Today's sales, invoices count, payments collected, and total outstanding dues calculated dynamically from database records.
- **Sales Reports:** Date-range summaries, tax liability breakdowns, revenue by payment mode, and top-selling product demand.

### 8. Security & Multi-Tenant Data Isolation
- JWT-based authentication with secure password hashing via `bcryptjs`.
- Strict multi-tenant data isolation: all data records are scoped to `businessId`. One business cannot access another business's products, customers, invoices, or payments.

---

## Tech Stack

- **Frontend:** React (Vite), CSS Modules & Global Design System, Lucide React icons, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

---

## Project Structure

```text
Billing_Software/
├── backend/
│   ├── app.js                   # Express configuration, CORS, and central routing
│   ├── server.js                # Server startup and database connection
│   ├── config/
│   │   └── db.js                # Mongoose connection setup
│   └── modules/
│       ├── index.js             # Central router mounted at /api/v1
│       ├── auth/                # User authentication, registration & middleware
│       ├── business/            # Business profile & invoice preferences
│       ├── categories/          # Product categories
│       ├── products/            # Product & service catalog
│       ├── customers/           # Customer management & ledger history
│       ├── invoices/            # Invoices, zero-trust calculation & PDF print
│       ├── payments/            # Payment settlement ledger
│       └── reports/             # Real-time dashboard & sales reports
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css            # Global typography, color tokens, and print rules
│       ├── services/
│       │   └── api.js           # Central Axios client with auth interceptors
│       ├── context/
│       │   ├── AuthContext.jsx  # User & business session state
│       │   └── ToastContext.jsx # Toast notifications
│       ├── components/
│       │   ├── common/          # Header, Sidebar, Modal, ConfirmDialog, Loader
│       │   └── invoices/        # Printable tax invoice template
│       ├── pages/
│       │   ├── Auth/            # Sign In & Business Registration
│       │   ├── Dashboard/       # Live sales KPIs & recent invoices
│       │   ├── Billing/         # POS New Bill screen
│       │   ├── Invoices/        # Invoice history & payment settlement
│       │   ├── Products/        # Product catalog & categories
│       │   ├── Customers/       # Customer directory & ledger
│       │   ├── Payments/        # Payment records ledger
│       │   ├── Reports/         # Sales & GST reports
│       │   └── Settings/        # Business preferences & invoice formats
│       └── routes/
│           ├── AppRoutes.jsx
│           └── ProtectedRoute.jsx
│
├── README.md
└── .gitignore
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

---

### Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/billing_software
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

---

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## Standardized API Response Convention

All backend endpoints mounted at `/api/v1` adhere strictly to the uniform response structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "error": null
}
```

On validation or server failure:

```json
{
  "success": false,
  "message": "Required fields are missing",
  "data": null,
  "error": ["name", "sellingPrice"]
}
```

---

## Verification & Production Build

To test the frontend production bundle:

```bash
cd frontend
npm run build
```

Production output will be generated cleanly in `frontend/dist/`.
