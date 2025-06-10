# Clarify – Know Where Your Money Goes

**Clarify** is a sleek, full-stack web app for managing your personal finances. It helps you keep track of income and expenses, automatically categorizes your transactions, and gives you monthly and yearly summaries—all in one clean dashboard.

Built with **Next.js**, **PostgreSQL**, and **Material-UI**, Clarify aims to create clarity and control over your money.

---

## 🔑 Features

### 💸 Smart Finance Tracking
- **Bank account scraping** - Automatically import transactions from Israeli banks
- **Unified transaction model** - All financial movements (income and expenses) stored in one table
- **Secure credential management** with end-to-end encryption
- **Category-based tracking** for all expenses  
- **Income management** with manual entry support
- **Monthly & yearly summaries** to see your financial health at a glance  
- **Saved accounts with nicknames** for quick access to your credentials
- **Transaction management** with edit and delete capabilities

### 📊 Analytics & Insights
- Visual breakdown of your income and expenses  
- Spending trends over time  
- Overview of cash flow and category-wise distribution  
- Total Income and Total Expenses widgets for quick overview

### 🔒 Security Features
- End-to-end encryption for sensitive credentials
- Secure credential storage and management
- Bank account credentials stored securely

### 📸 Screenshots

#### Dashboard Overview
![Dashboard](app/public/screenshots/dashboard.png)

#### Expenses
![Transactions](app/public/screenshots/expenses.png)

#### Income
![Analytics](app/public/screenshots/income.png)

---

## 🧰 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Material-UI  
- **Backend**: Next.js API Routes  
- **Database**: PostgreSQL  
- **Deployment**: Docker & Docker Compose  
- **Bank Integration**: [`israeli-bank-scrapers`](https://github.com/eshaham/israeli-bank-scrapers)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)  
- PostgreSQL (v16 or higher)  
- Docker & Docker Compose (optional, for container deployment)

---

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/clarify/clarify-expenses.git  
   cd clarify-expenses
   ```

2. **Install dependencies**
   ```bash
   cd app  
   npm install
   ```

3. **Create a `.env` file** in the main directory:
   ```env
   CLARIFY_DB_USER=myuser  
   CLARIFY_DB_HOST=localhost  
   CLARIFY_DB_NAME=mydb  
   CLARIFY_DB_PASSWORD=mypassword  
   CLARIFY_DB_PORT=5432
   CLARIFY_ENCRYPTION_KEY=your_encryption_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

### 🐳 Docker Deployment

1. Build and run the app using Docker:
   ```bash
   docker-compose up -d
   ```

2. Open your browser at:  
   http://localhost:3000

---

## 🗂 Project Structure

```
clarify-expenses/  
├── app/                    # Next.js application  
│   ├── components/         # Reusable UI components  
│   │   ├── CategoryDashboard/  # Category management components  
│   │   ├── AccountsModal/      # Account management modal  
│   │   └── ScrapeModal/        # Transaction scraping modal  
│   ├── pages/              # App pages and API routes  
│   ├── public/             # Static files  
│   └── styles/             # Global CSS and theme  
├── db-init/                # PostgreSQL initialization scripts  
├── docker-compose.yaml     # Docker config for services  
└── README.md               # You're reading it
```

---

## 📦 Environment Variables

| Variable      | Description               |  
|---------------|---------------------------|  
| CLARIFY_DB_USER       | PostgreSQL username       |  
| CLARIFY_DB_HOST       | PostgreSQL host           |  
| CLARIFY_DB_NAME       | Database name             |  
| CLARIFY_DB_PASSWORD   | PostgreSQL password       |  
| CLARIFY_DB_PORT       | Database port (default: 5432) |
| CLARIFY_ENCRYPTION_KEY| Key for credential encryption (required) |

---

## 🔄 Recent Updates

### Bank Account Scraping Support
- **Unified Transaction Model**: All financial data (income and expenses) now stored in a single `transactions` table
- **Bank Account Integration**: Support for scraping transactions directly from Israeli bank accounts
- **Simplified Dashboard**: Streamlined to show Total Income and Total Expenses with category breakdown
- **Removed Legacy Components**: Eliminated separate income table and complex transaction categorization
- **Clean Architecture**: Simplified database schema and API structure for better maintainability

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions, bug reports, or feature requests, open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

## 💬 Support

For support, open an issue in this repository.

---

## 🙌 Credits

- Bank scraping integration powered by [`israeli-bank-scrapers`](https://github.com/eshaham/israeli-bank-scrapers)
