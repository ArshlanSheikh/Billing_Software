import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import styles from "./Layout.module.css";

const Layout = () => {
  const location = useLocation();
  const isCompactRoute = location.pathname.startsWith("/billing/new");

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Header />
        <main
          className={`${styles.contentArea} ${
            isCompactRoute ? styles.compactContentArea : ""
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
