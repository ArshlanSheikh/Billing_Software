import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  FileText,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const { user, business, logout } = useAuth();
  const location = useLocation();

  // Specifically collapse the sidebar on the New Bill screen
  const isCompact = location.pathname.startsWith("/billing/new");

  const navLinks = [
    { to: "/billing/new", label: "New Bill", icon: ReceiptText, isSpecial: true },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/invoices", label: "Invoice History", icon: FileText },
    { to: "/products", label: "Products", icon: Package },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/payments", label: "Payments", icon: CreditCard },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCompact ? styles.sidebarCompact : ""}`}>
      <div className={styles.brand} title={isCompact ? business?.name || "Billing Software" : undefined}>
        <div className={styles.brandIcon}>
          <Building2 size={20} />
        </div>
        {!isCompact && (
          <div className={styles.brandInfo}>
            <div className={styles.brandTitle} title={business?.name || "Billing Pro"}>
              {business?.name || "Billing Software"}
            </div>
            <div className={styles.brandType}>{business?.type || "Retail POS"}</div>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""} ${
                  link.isSpecial ? styles.newBillHighlight : ""
                }`
              }
            >
              <Icon size={18} />
              {!isCompact && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {!isCompact ? (
          <div className={styles.userSummary}>
            <div className={styles.userAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className={styles.userName} title={user?.name}>
                {user?.name}
              </div>
              <div className={styles.userRole}>{user?.role || "Staff"}</div>
            </div>
          </div>
        ) : (
          <div
            className={styles.userAvatar}
            title={`${user?.name || "User"} (${user?.role || "Staff"})`}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        <button className={styles.logoutBtn} onClick={logout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
