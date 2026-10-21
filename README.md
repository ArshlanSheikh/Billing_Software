# Billing Software — General-Purpose POS & Billing Web Application

A modern, responsive, general-purpose billing and Point of Sale (POS) web application built using the **MERN** stack (MongoDB, Express.js, React, Node.js). 

Engineered for diverse seller types — including retail stores, clothing boutiques, grocery & kirana shops, electronics retailers, wholesalers, and service providers — to manage product catalogs, generate instant GST-compliant bills, record multi-mode payments, track customer credit ledgers, and view real-time sales reports.

---

## Comprehensive Feature Breakdown

### 1. High-Speed Point of Sale (POS) Billing Engine (`/billing/new`)
The New Bill interface is the core module of the application, designed with a focus on speed, ergonomic keyboard navigation, and fast checkout workflows:
- **Instant Product Search & Barcode Support:** Search products in real time by name, SKU, or barcode. Selecting a product or scanning its barcode immediately appends it to the active bill table without reloading.
- **Dynamic Line Item Manipulation:**
  - **Quantity Adjusters:** Increment, decrement, or type arbitrary decimal or integer quantities with immediate recalculation.
  - **On-the-Fly Price Overrides:** Authorized sellers can adjust the unit price for an individual transaction (e.g., promotional discounts or wholesale bargaining) without altering the product's default catalog price.
  - **Item-Level Discounts:** Apply percentage discounts per individual line item.
  - **Auto-Populated Tax Brackets:** Automatically fetches the product's preset GST rate (0%, 5%, 12%, 18%, 28%) and calculates line taxes.
- **On-the-Fly Custom Line Items:** Sellers can add custom charges (e.g., service charges, repair labor, transport/shipping, or uncataloged items) directly from the billing screen with a single click.
- **Walk-in & Registered Customer Handling:**
  - **Default Walk-in Support:** Counter sales do not require customer registration; walk-in sales proceed with 0 extra clicks.
  - **Customer Selection:** Dropdown search across existing customers.
  - **Inline Quick Add Customer Modal:** Register new customer contact details on the fly without navigating away or losing items on the current bill.
- **Multi-Mode Payment Settlement:**
  - Supports **Cash**, **UPI**, **Credit/Debit Card**, **Net Banking / Bank Transfer**, **Cheque**, and **Other**.
  - **Change Return Calculation:** Enter received amounts to instantly calculate change due to the customer.
  - **Credit / Partial Billing:** Supports partial payments and full credit sales (₹0 advance), automatically tagging the invoice as `PARTIALLY_PAID` or `UNPAID`.
  - **Quick Fill Buttons:** One-click shortcuts for "Full Amount", "Round Off", and "Credit (₹0)".
- **Post-Sale Actions:**
  - **Complete Sale & Print:** Finalizes the sale and immediately opens the browser print preview for thermal or A4 receipt printing.
  - **Reset / Start New Bill:** Clears the form, fetches the next sequential invoice number, and resets inputs in one click.

---

### 2. Zero-Trust Backend Calculation & Financial Integrity Engine
To protect business owners from tampering, client-side rounding bugs, or inaccurate totals:
- **Zero-Trust Validation:** The backend never trusts financial totals or tax amounts submitted by the browser. It extracts the raw line items and recalculates every single subtotal, item discount, invoice-level discount, tax bracket, and grand total on the server.
- **Epsilon Financial Rounding:** All money arithmetic uses standard currency rounding (`Math.round((num + Number.EPSILON) * 100) / 100`) to eliminate JavaScript floating-point errors.
- **Historical Snapshot Preservation:**
  - **Product Snapshots:** Invoices store embedded snapshots of product names, SKUs, unit rates, units of measurement, applied discounts, and tax rates at the exact time of billing. Subsequent catalog price updates or product deletions will **never** alter historical invoices.
  - **Customer Snapshots:** Customer name, phone, address, and GSTIN are snapshotted onto the invoice document, ensuring tax invoices remain immutable for legal accounting.
- **Duplicate Prevention:** Safe sequential generation and database uniqueness constraints prevent double-billing from accidental repeated clicks.

---

### 3. Business Profile, GST & Document Personalization (`/settings`)
Enables each business to customize its branding, legal identity, and receipt styling:
- **Store & Contact Details:** Store name, business category (Retail, Grocery, Electronics, Clothing, Wholesale, Services), owner name, contact phone, email, and full physical address.
- **Tax & Legal Setup:** GSTIN (Goods and Services Tax Identification Number) configuration and default tax bracket selection.
- **Invoice Numbering Formatting:**
  - Configurable invoice prefix (e.g., `INV-`, `ROYAL-`, `BILL-`).
  - Customizable starting sequence number (e.g., start billing from `1001`).
- **Receipt Customization:** Multi-line Terms and Conditions and customizable footer notes (e.g., "Thank you for shopping with us!") printed at the bottom of all customer bills.
- **Currency Preferences:** Configurable currency code and symbol (defaults to Indian Rupee `₹ INR`).

---

### 4. Product & Service Catalog Management (`/products`)
A centralized inventory catalog to maintain goods and service offerings:
- **Item Details:** Product name, SKU/item code, detailed description, category classification, selling price, internal purchase price (strictly hidden on customer invoices), unit of measure, and applicable GST rate.
- **Flexible Units of Measurement:** Support for physical and service units including `piece`, `kg`, `gram`, `litre`, `meter`, `hour`, `service`, `box`, and `packet`.
- **Dynamic Categories:** Create, edit, and organize categories (e.g., Beverages, Electronics, Apparel, Groceries) on the fly.
- **Live Search & Category Filters:** Instant search by name or SKU, combined with category pill filters.
- **Soft Deactivation & Deletion:** Safely mark products as inactive or delete unneeded items without breaking past invoice line items.

---

### 5. Customer Management & Automated Account Ledgers (`/customers`)
Comprehensive customer relationship and credit ledger tracking:
- **Customer Directory:** Manage customer names, phone numbers, email addresses, billing addresses, GSTIN numbers, and custom notes.
- **Live Account Balance Tracking:**
  - **Total Billed:** Lifetime gross amount billed to the customer across all completed sales.
  - **Total Paid:** Lifetime total payments received from the customer.
  - **Outstanding Balance:** Current credit dues awaiting settlement, highlighted in red when outstanding.
- **Interactive Customer Invoices Ledger:** Open a customer's profile to view an itemized chronological list of every invoice issued to them, complete with dates, totals, paid amounts, balances, and payment status badges.

---

### 6. Invoice History, Audit & Controlled Cancellation (`/invoices`)
Full lifecycle management of sales records:
- **Multi-Parameter Search & Filtering:**
  - Real-time search by invoice number, customer name, or contact phone.
  - Filter by payment status: `All Payments`, `Fully Paid`, `Partially Paid`, `Unpaid`.
  - Filter by lifecycle status: `All Statuses`, `Completed`, `Cancelled`, `Draft`.
  - Filter by date range (From Date to To Date).
- **Interactive Document Modal:** View the complete, itemized tax invoice receipt on screen with one click.
- **Controlled Invoice Cancellation Flow:**
  - Invoices cannot be silently deleted.
  - Cancelling an invoice requires a mandatory reason (e.g., "Customer returned goods", "Billing entry error").
  - Automatically reverses the customer's account balance (`totalBilled`, `totalPaid`, `outstandingBalance`).
  - Marks the invoice as `CANCELLED` and logs the cancellation timestamp and user ID for audit compliance.

---

### 7. Payment Tracking & Credit Settlement Engine (`/payments`)
Dedicated ledger for recording incoming payments and settling credit accounts:
- **Settle Existing Invoices:** Record payments directly against unpaid or partially paid bills without generating new invoices.
- **Audit Trails:** Tracks payment timestamp, payment mode, transaction reference ID (UPI reference, card approval number, bank transfer UTR), notes, and the user who recorded the transaction.
- **Automatic Rebalancing:** Recording a settlement automatically reduces the invoice's remaining `balanceDue`, updates its status to `PAID`, and decrements the customer's `outstandingBalance`.
- **Payment Ledger Table:** View, search, and filter all incoming payments across date ranges and payment methods.

---

### 8. Real-Time Business Dashboard (`/dashboard`)
An executive command center presenting live store performance metrics calculated directly from database records:
- **Today's Sales:** Gross revenue generated from all completed bills created today.
- **Invoices Today:** Total count of customer invoices processed today.
- **Payments Collected Today:** Total cash and digital payments collected across all payment modes today.
- **Total Outstanding Dues:** Aggregate balance due across all active credit bills.
- **Prominent "New Bill" Action:** Fast launch banner to open the POS billing screen immediately.
- **Catalog & Customer Quick Counters:** Active products in stock and registered customer counts.
- **Recent Invoices Table:** Direct access to the 5 most recent customer transactions with one-click view/print buttons.

---

### 9. Sales, GST & Product Analytics Reports (`/reports`)
Financial reports for tax accounting and inventory demand analysis:
- **Date Range Presets:** Quick filters for "Today", "Last 7 Days", "This Month", "All Time", and custom start/end date selectors.
- **Financial Summary Cards:** Total sales revenue, total GST tax collected, total discounts granted, total payments collected, and outstanding receivables.
- **Product Sales Demand Breakdown:** Itemized table showing every product sold in the selected period, total units sold, and revenue generated per product.
- **Payment Method Distribution:** Breakdown of transaction counts and total amounts collected per payment mode (Cash, UPI, Card, Net Banking).

---

### 10. Print-Ready Tax Invoices & Receipts
Clean, professional invoice templates designed for both standard desktop printing and point-of-sale thermal printers:
- **Tax Invoice Header:** Store name, owner, full address, contact details, and GSTIN.
- **Invoice Metadata:** Invoice number, date, due date, payment mode, and status badge (`PAID` / `PARTIALLY PAID` / `UNPAID`).
- **Bill-To Section:** Customer name, phone, address, and GSTIN.
- **Itemized Breakdown:** Item name, SKU, quantity, unit, unit rate, applied discounts, tax percentage, and line total.
- **Totals & Taxes Breakdown:** Subtotal, item-level discounts, invoice discounts, GST breakdown, grand total, amount paid, and balance due.
- **Receipt Footer:** Business terms and conditions, thank you note, and authorized signatory line.
- **Print Optimization (`@media print`):** Strips navigation sidebars, headers, and buttons automatically during print to ensure clean A4 or receipt paper printing.

---

### 11. Multi-Tenant Data Isolation & Security Architecture
- **Strict Data Scoping:** Every document in the database (`Business`, `User`, `Category`, `Product`, `Customer`, `Invoice`, `Payment`) is strictly associated with a `businessId`.
- **Backend Authorization:** Authentication middleware automatically derives the `businessId` from the verified JWT token; queries and mutations are isolated to the caller's business.
- **Security Protections:** Passwords hashed with salt via `bcryptjs`; private routes protected by JWT tokens with 7-day expiration.

---

## Technology Stack

- **Frontend:** React 19, Vite, CSS Modules & Global Design System, Lucide React icons, Axios
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
