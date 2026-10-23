# Billing Software — General-Purpose POS & Billing Web Application

A modern, high-speed, general-purpose billing and Point of Sale (POS) web application built using the **MERN** stack (MongoDB, Express.js, React, Node.js). 

Engineered for diverse seller types — including retail stores, supermarkets, grocery & kirana stores, clothing boutiques, electronics retailers, wholesalers, and service providers — to manage product catalogs with Cloudinary image hosting, generate instant GST-compliant bills, download PDF invoices, record multi-mode payments, track customer credit ledgers, and view real-time sales reports.

---

## Key Features Breakdown

### 1. High-Speed Point of Sale (POS) Billing Engine (`/billing/new`)
The New Bill interface is the core module of the application, designed with a focus on speed, ergonomic keyboard navigation, and fast checkout workflows:
- **Compact Square-Tile Catalog Grid (Version 2):**
  - **Square Aspect Ratio (`1:1`):** Redesigned product catalog cards into compact, modern square image tiles with full-cover background imagery.
  - **Dynamic 5–6 Columns per Row:** Responsive CSS Grid dynamically scales to fit 5–6 products per row on desktop screens, displaying **20–30+ products simultaneously** without vertical stretching.
  - **High-Legibility Gradient Overlay:** Smooth dark gradient overlay (`rgba(15, 23, 42, 0.95)` at base) ensures product titles, SKUs, and prices remain 100% readable over any product image.
  - **Neutral Dark Slate Tile Fallback:** Elegant dark slate gradient background with centered iconography for items without product images.
  - **Live In-Cart Quantity Badges:** Displays active cart quantities (`x1`, `x2`, ...) overlaid on the top-right corner of each card.
  - **One-Click Cart Addition:** The entire square card is interactive; clicking adds or increments the item instantly.
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
- **Post-Sale Actions & Document Export:**
  - **Download PDF Invoice:** Instantly generates and downloads clean, vector-rendered A4 tax invoice PDFs using `html2pdf.js`.
  - **Print Invoice:** Opens browser print preview optimized for standard desktop A4 or thermal receipt printers.
  - **Reset / Start New Bill:** Clears the form, fetches the next sequential invoice number, and resets inputs in one click.

---

### 2. Product Catalog Management & Cloudinary Image Storage (`/products`)
Centralized inventory and goods/service catalog management:
- **Cloudinary Image Hosting:**
  - Direct image uploads processed in-memory via `multer` and streamed directly to **Cloudinary** (`v2`).
  - Automated format conversion (`webp`/`auto`) and compression optimization (`quality: auto`).
  - Automatic cleanup and deletion of old images from Cloudinary when updating or deleting products.
- **Item Details:** Product name, SKU/item code, detailed description, category classification, selling price, internal purchase price (strictly hidden on customer invoices), unit of measure, and applicable GST rate.
- **Flexible Units of Measurement:** Support for physical and service units including `piece`, `kg`, `gram`, `litre`, `meter`, `hour`, `service`, `box`, and `packet`.
- **Dynamic Categories:** Create, edit, and organize categories (e.g., Beverages, Electronics, Apparel, Groceries) on the fly.
- **Live Search & Category Filters:** Instant search by name or SKU, combined with category pill filters.
- **Soft Deactivation & Deletion:** Safely mark products as inactive or delete unneeded items without breaking past invoice line items.

---

### 3. Zero-Trust Backend Calculation & Financial Integrity Engine
To protect business owners from tampering, client-side rounding bugs, or inaccurate totals:
- **Zero-Trust Validation:** The backend never trusts financial totals or tax amounts submitted by the browser. It extracts the raw line items and recalculates every single subtotal, item discount, invoice-level discount, tax bracket, and grand total on the server.
- **Epsilon Financial Rounding:** All money arithmetic uses standard currency rounding (`Math.round((num + Number.EPSILON) * 100) / 100`) to eliminate JavaScript floating-point errors.
- **Historical Snapshot Preservation:**
  - **Product Snapshots:** Invoices store embedded snapshots of product names, SKUs, unit rates, units of measurement, applied discounts, and tax rates at the exact time of billing. Subsequent catalog price updates or product deletions will **never** alter historical invoices.
  - **Customer Snapshots:** Customer name, phone, address, and GSTIN are snapshotted onto the invoice document, ensuring tax invoices remain immutable for legal accounting.
- **Duplicate Prevention:** Safe sequential generation and database uniqueness constraints prevent double-billing from accidental repeated clicks.

---

### 4. Business Profile, GST & Document Personalization (`/settings`)
Enables each business to customize its branding, legal identity, and receipt styling:
- **Store & Contact Details:** Store name, business category (Retail, Grocery, Electronics, Clothing, Wholesale, Services), owner name, contact phone, email, and full physical address.
- **Tax & Legal Setup:** GSTIN (Goods and Services Tax Identification Number) configuration and default tax bracket selection.
- **Invoice Numbering Formatting:**
  - Configurable invoice prefix (e.g., `INV-`, `ROYAL-`, `BILL-`).
  - Customizable starting sequence number (e.g., start billing from `1001`).
- **Receipt Customization:** Multi-line Terms and Conditions and customizable footer notes (e.g., "Thank you for shopping with us!") printed at the bottom of all customer bills.
- **Currency Preferences:** Configurable currency code and symbol (defaults to Indian Rupee `₹ INR`).

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
- **Interactive Document Modal & PDF Export:** View the complete, itemized tax invoice receipt on screen with one-click PDF download or printing.
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

### 10. Multi-Tenant Data Isolation & Security Architecture
- **Strict Data Scoping:** Every document in the database (`Business`, `User`, `Category`, `Product`, `Customer`, `Invoice`, `Payment`) is strictly associated with a `businessId`.
- **Backend Authorization:** Authentication middleware automatically derives the `businessId` from the verified JWT token; queries and mutations are isolated to the caller's business.
- **Security Protections:** Passwords hashed with salt via `bcryptjs`; private routes protected by JWT tokens with 7-day expiration.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 8, React Router DOM 7 |
| **Styling & Icons** | CSS Modules, Custom Design System Tokens, Lucide React |
| **Document Generation** | `html2pdf.js` (Client-side A4 PDF generation), `@media print` CSS |
| **Backend Runtime** | Node.js (ES Modules), Express.js 4.x |
| **Database & ODM** | MongoDB, Mongoose 8.x |
| **Cloud Storage** | Cloudinary v2 SDK (`cloudinary`), Multer (memory storage) |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv` |

---

## Project Structure

```text
Billing_Software/
├── backend/
│   ├── app.js                   # Express configuration, CORS, and central routing
│   ├── server.js                # Server startup, dotenv/config, and database connection
│   ├── config/
│   │   ├── db.js                # Mongoose connection setup
│   │   └── cloudinary.js        # Cloudinary SDK initialization & image upload/delete handlers
│   └── modules/
│       ├── index.js             # Central router mounted at /api/v1
│       ├── auth/                # User authentication, registration & middleware
│       ├── business/            # Business profile & invoice preferences
│       ├── categories/          # Product categories
│       ├── products/            # Product catalog, upload middleware & Cloudinary storage
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
│       ├── utils/
│       │   └── pdfGenerator.js  # html2pdf.js invoice PDF generator
│       ├── context/
│       │   ├── AuthContext.jsx  # User & business session state
│       │   └── ToastContext.jsx # Toast notifications
│       ├── components/
│       │   ├── common/          # Header, Sidebar, Modal, ConfirmDialog, Loader
│       │   └── invoices/        # Printable & PDF-ready tax invoice template
│       ├── pages/
│       │   ├── Auth/            # Sign In & Business Registration
│       │   ├── Dashboard/       # Live sales KPIs & recent invoices
│       │   ├── Billing/         # POS New Bill screen (Square tile catalog & cart)
│       │   ├── Invoices/        # Invoice history, cancellation & payment settlement
│       │   ├── Products/        # Product catalog & Cloudinary image management
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
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally on port 27017 or a MongoDB Atlas connection string)
- [Cloudinary](https://cloudinary.com/) free account (for product image hosting)

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
   JWT_SECRET=super_secret_billing_jwt_token_key_2026_secure
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173

   # Cloudinary Storage Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000 with auto-reload (node --watch)
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

3. Configure environment variables in `frontend/.env` (optional, defaults to `http://localhost:5000/api/v1`):
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

## API Endpoints Reference

All endpoints are prefixed with `/api/v1` and protected with JWT Bearer authentication (except Auth endpoints):

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | Register new business owner & company account |
| **Auth** | `POST` | `/auth/login` | Authenticate user & return JWT token |
| **Auth** | `GET` | `/auth/me` | Fetch authenticated user profile & business data |
| **Business** | `GET` | `/business/profile` | Retrieve business details & invoice settings |
| **Business** | `PUT` | `/business/profile` | Update store info, GSTIN, invoice prefix & terms |
| **Categories** | `GET` | `/categories` | List all product categories |
| **Categories** | `POST` | `/categories` | Create a new category |
| **Products** | `GET` | `/products` | List products with search & category filters |
| **Products** | `POST` | `/products` | Create a new product |
| **Products** | `POST` | `/products/upload-image`| Upload product image to Cloudinary |
| **Products** | `PUT` | `/products/:id` | Update product details & image |
| **Products** | `DELETE` | `/products/:id` | Soft delete/deactivate a product |
| **Products** | `GET` | `/products/search` | Fast autocomplete search by name/SKU/barcode |
| **Customers** | `GET` | `/customers` | List customers with credit balance counters |
| **Customers** | `POST` | `/customers` | Register a new customer |
| **Customers** | `GET` | `/customers/:id/ledger`| Chronological invoice & balance ledger |
| **Invoices** | `GET` | `/invoices` | List invoices with status & date filtering |
| **Invoices** | `POST` | `/invoices` | Create invoice with zero-trust server recalculation |
| **Invoices** | `GET` | `/invoices/next-number`| Get the next sequential invoice number |
| **Invoices** | `POST` | `/invoices/:id/cancel` | Cancel invoice with reason & balance reversal |
| **Payments** | `GET` | `/payments` | List payment transaction logs |
| **Payments** | `POST` | `/payments` | Record payment settlement against existing invoice |
| **Reports** | `GET` | `/reports/dashboard` | Real-time sales, collections & dues KPIs |
| **Reports** | `GET` | `/reports/sales` | Itemized sales, GST breakdown & product demand |

---

## Verification & Production Build

To test and compile the frontend production bundle:

```bash
cd frontend
npm run build
```

Production output will be generated cleanly in `frontend/dist/`.
