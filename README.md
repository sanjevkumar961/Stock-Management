# 📦 Stock Management System

A modern, responsive inventory management application built with React. Track materials across multiple warehouses, manage stock transactions, and generate professional delivery challans with offline support.

**Version:** 0.1.0 | **Status:** Production-Ready MVP | **Last Updated:** January 2026

---

## ✨ Features

### Core Functionality
- 📚 **Materials Inventory** - Track materials across multiple warehouses with real-time stock levels
- ➕ **Stock Transactions** - Record stock-in, stock-out, and stock adjustments
- 🔄 **Warehouse Transfers** - Transfer materials between warehouses with automatic DC generation
- 📄 **Delivery Challan** - Professional, printable delivery documents with GST calculations
- 💳 **Transaction Logs** - Complete audit trail of all inventory movements
- 🔑 **Role-Based Access** - User and Manager roles with different permissions

### Technical Highlights
- 📱 **Fully Responsive** - Desktop, tablet, and mobile-optimized interface
- 🌐 **Offline Support** - Queue transactions when offline, auto-sync when connection returns
- 🎨 **Modern UI** - Professional design with smooth animations and emoji icons
- ⚡ **Fast & Lightweight** - ~2500 lines of code, minimal dependencies
- 🔒 **Secure** - Session management with automatic logout on expiry

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API URL (Google Apps Script endpoint)

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/stock-management.git
   cd stock-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (`.env.local`)
   ```bash
   # Add this to .env.local
   REACT_APP_BACKEND_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Usage Guide

### Authentication
1. Login with email and password
2. Session persists in browser (tokens stored in localStorage)
3. Auto-logout on session expiry or invalid token

### Materials Page (📚 Home)
- View all materials across warehouses
- See current stock levels and status (OK/LOW)
- Desktop: Table view | Mobile: Card view

### New Transaction (➕ New)
- **Stock In:** Add materials to warehouse
- **Stock Out:** Remove materials from warehouse
- **Adjust Stock:** Modify quantity (Manager only)
- Remarks field for documentation
- Offline queuing if network fails

### Warehouse Transfer (🔄 Transfer)
- Select source and destination warehouses
- Add multiple materials in one transaction
- Automatic Delivery Challan (DC) generation
- Print or download DC after transfer

### Transaction Logs (💳 Transactions) - Manager Only
- View complete transaction history
- Filter by date, material, warehouse
- See user, quantity, and remarks
- Export functionality coming soon

### Reprint DC (📄 Reprint) - Manager Only
- Search existing DCs by number
- Verify DC (mark as official)
- Reprint anytime
- Shows verification timestamp

---

## 🏗️ Project Structure

```
src/
├── api/
│   └── api.js                 # API calls (GET/POST)
├── auth/
│   └── AuthContext.jsx        # Authentication state & logic
├── component/
│   ├── ToastContext.jsx       # Notifications
│   └── offlineQueue.js        # Offline transaction queue
├── pages/
│   ├── login.jsx              # Login form
│   ├── Materials.jsx          # Materials inventory
│   ├── Transactions.jsx       # Transaction logs (manager)
│   ├── NewTransaction.jsx     # Create transaction
│   ├── TransferStock.jsx      # Warehouse transfers
│   ├── ReprintDC.jsx          # Reprint delivery challan
│   └── DeliveryChallan.jsx    # DC print component
├── App.js                     # Main layout & routing
├── App.css                    # Responsive styles
├── index.css                  # Global styles
└── index.js                   # Entry point
```

---

## 📱 Responsive Design

### Breakpoints
| Device | Width | Layout |
|--------|-------|--------|
| Desktop | ≥901px | Full table, full nav |
| Tablet | 641-900px | Hamburger menu, cards |
| Mobile | ≤640px | Full-screen cards, compact UI |

### Features by Device
- **Desktop:** Sticky header, full navigation, table layouts
- **Tablet:** Hamburger menu, optimized spacing
- **Mobile:** Card-based layouts, touch-friendly buttons, hidden email

---

## 🔐 Security & Auth

### Authentication Flow
```
Login Page → Email/Password → Backend → Success → Home
                                    ↓ Fail
                              Error Message
```

### Session Management
- ID token stored in localStorage
- Auto-logout on token expiry
- Redirect to login on unauthorized access
- Role-based route protection

### Offline Transactions
- Queued in localStorage when offline
- Auto-synced when network returns
- User notified on sync completion

---

## 🛠️ Available Scripts

### Development
```bash
npm start              # Start dev server (http://localhost:3000)
npm test              # Run tests in watch mode
```

### Production
```bash
npm run build         # Create optimized production build
npm run eject        # Eject from CRA (one-way, not recommended)
```

---

## 🎨 UI/UX Highlights

### Color Scheme
- **Primary:** Dark blue gradient (#2c3e50 → #34495e)
- **Accent:** Warm red (#e74c3c) for actions
- **Success:** Green (#27ae60) for positive actions
- **Info:** Blue (#3498db) for informational items
- **Background:** Light gray (#f5f7fa)

### Typography
- **Titles:** 28-32px, bold, dark gray
- **Body:** 14px, regular, dark gray
- **Labels:** 14px, semi-bold
- **System Font Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

### Icons
- Emoji icons for quick visual recognition
- 📦 Materials, ➕ New, 🔄 Transfer, 💳 Transactions, 📄 Reprint, 🚪 Logout

---

## 📊 Data Flow

```
API Backend (Google Apps Script)
    ↓↑
API Client (api.js)
    ↓↑
Context (AuthContext, ToastContext)
    ↓↑
Pages (Materials, Transactions, NewTransaction, etc.)
    ↓
User Interface
```

### Offline Queue Flow
```
New Transaction
    ↓
Network Check
    ├─ Online → Send to Backend
    └─ Offline → Queue in localStorage
            ↓
    Network Returns → Auto-sync queue
            ↓
    Success → Clear queue, show notification
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
- No search/filter in transaction lists
- No pagination (all materials loaded at once)
- No bulk operations
- No dashboard/analytics
- Limited to single backend instance

### Performance Notes
- Consider implementing pagination for 1000+ materials
- Search/filter recommended for large transaction lists
- Code splitting recommended if adding many new pages

---

## 📝 API Integration

### Backend Requirements
Backend should handle these operations:

```
Operations:
- login              → User authentication
- warehouses         → Fetch all warehouses
- materials          → Fetch all materials with stock levels
- transactions       → Fetch transaction history
- stock_in          → Create stock-in transaction
- stock_out         → Create stock-out transaction
- adjust_stock      → Adjust material quantity (manager)
- transfer_stock_bulk → Warehouse transfer + DC creation
- get_dc_by_no      → Fetch delivery challan by number
- verify_dc         → Mark DC as verified
```

### Authentication
All requests include:
```javascript
user_email: user.email
id_token: user.token
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Creates optimized build in `build/` folder (~50KB gzipped)

### Deployment Options
- **Firebase Hosting:** Quick setup, free tier available
- **Netlify:** Drag & drop deployment, free tier
- **Vercel:** Optimized for React, free tier
- **Traditional Server:** Copy `build/` folder contents

### Environment Setup
Set `REACT_APP_BACKEND_BASE_URL` in your hosting platform's environment variables.

---

## 📋 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Full support |
| Firefox | Latest | ✅ Full support |
| Safari | Latest | ✅ Full support |
| Edge | Latest | ✅ Full support |
| IE 11 | - | ❌ Not supported |

---

## 🤝 Contributing

### Before Committing
1. Test on multiple screen sizes (desktop, tablet, mobile)
2. Test form validation
3. Test offline scenarios
4. Check console for errors

### Code Standards
- Use functional components with hooks
- Follow naming conventions (camelCase for JS, kebab-case for CSS)
- Add comments for complex logic
- Keep components under 300 lines

---

## 📚 Additional Resources

### Documentation
- [CODE_REVIEW.md](CODE_REVIEW.md) - Comprehensive code analysis
- [Create React App Docs](https://facebook.github.io/create-react-app/docs)
- [React Docs](https://react.dev)
- [React Router Docs](https://reactrouter.com)

### Technologies Used
- React 19.2.3
- React Router DOM 7.12.0
- react-select 5.10.2
- Create React App 5.0.1

---

## 📧 Support & Feedback

- Report bugs or request features via GitHub Issues
- Check [CODE_REVIEW.md](CODE_REVIEW.md) for recommendations

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ | Last Updated: January 27, 2026**
