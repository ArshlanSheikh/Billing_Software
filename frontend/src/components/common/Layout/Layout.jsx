import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import styles from "./Layout.module.css";

const Layout = () => {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.contentArea}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
