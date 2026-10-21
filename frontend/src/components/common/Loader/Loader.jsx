import React from "react";
import styles from "./Loader.module.css";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner} />
      <span className={styles.loadingText}>{message}</span>
    </div>
  );
};

export default Loader;
