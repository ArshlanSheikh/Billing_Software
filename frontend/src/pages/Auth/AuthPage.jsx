import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Receipt, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import styles from "./AuthPage.module.css";

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    businessType: "Retail",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { isAuthenticated, login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/billing/new" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isRegister) {
        if (!formData.name || !formData.email || !formData.password || !formData.businessName) {
          setErrorMsg("Please fill in all required fields.");
          setLoading(false);
          return;
        }
        await register(formData);
        showToast("Business account registered successfully!", "success");
      } else {
        if (!formData.email || !formData.password) {
          setErrorMsg("Please provide your email and password.");
          setLoading(false);
          return;
        }
        await login(formData.email, formData.password);
        showToast("Welcome back!", "success");
      }
      navigate("/billing/new");
    } catch (err) {
      console.error("Auth action failed:", err);
      const msg = err.message || (typeof err.error === "string" ? err.error : "Authentication failed.");
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authCard}>
        <div className={styles.headerSection}>
          <div className={styles.logoIcon}>
            <Receipt size={26} />
          </div>
          <h1 className={styles.title}>Billing Software</h1>
          <p className={styles.subtitle}>Fast, modern, multi-vendor billing application</p>

          <div className={styles.tabSwitcher}>
            <button
              type="button"
              className={`${styles.tabBtn} ${!isRegister ? styles.tabBtnActive : ""}`}
              onClick={() => {
                setIsRegister(false);
                setErrorMsg("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${isRegister ? styles.tabBtnActive : ""}`}
              onClick={() => {
                setIsRegister(true);
                setErrorMsg("");
              }}
            >
              Register Business
            </button>
          </div>
        </div>

        <div className={styles.bodySection}>
          {errorMsg && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Business / Store Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    className="form-input"
                    placeholder="e.g. Metro Electronics, Super Mart"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Business Type</label>
                    <select
                      name="businessType"
                      className="form-select"
                      value={formData.businessType}
                      onChange={handleChange}
                    >
                      <option value="Retail">Retail Store</option>
                      <option value="Clothing">Clothing & Apparel</option>
                      <option value="Grocery">Grocery & Kirana</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Wholesale">Wholesaler</option>
                      <option value="Services">Service Provider</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Owner / Manager Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="name@business.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? "Processing..." : isRegister ? "Create Business Account" : "Sign In to Dashboard"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
