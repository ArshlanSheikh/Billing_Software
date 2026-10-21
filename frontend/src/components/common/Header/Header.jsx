import React from "react";
import { Link } from "react-router-dom";
import { Plus, AlertCircle, Store } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Header.module.css";

const Header = () => {
  const { business } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.businessPill}>
          <Store size={15} />
          <span>{business?.name || "Business"}</span>
          <span className={styles.currencyBadge}>{business?.currency?.code || "INR"} ({business?.currency?.symbol || "₹"})</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        {!business?.isConfigured && (
          <Link to="/settings" className={styles.setupWarning} title="Configure GSTIN, address & invoice format">
            <AlertCircle size={15} />
            <span>Complete Business Setup</span>
          </Link>
        )}

        <Link to="/billing/new" className={styles.newBillBtn}>
          <Plus size={16} />
          <span>New Bill</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
