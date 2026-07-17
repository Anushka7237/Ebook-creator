import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  BookOpen,
  Plus,
  Book,
  FileText,
  User,
  LogOut,
  Edit2,
  Trash2,
  Settings,
  X,
  FileCode,
  Award
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", password: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [deletingId, setDeletingId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await API.get("/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
    setLoading(false);
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      try {
        await API.delete(`/books/${id}`);
        setBooks((prev) => prev.filter((book) => book._id !== id));
      } catch (err) {
        console.error("Error deleting book:", err);
        alert("Failed to delete book. Please try again.");
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    
    if (!profileForm.name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }

    const res = await updateProfile(profileForm.name, profileForm.password);
    if (res.success) {
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setProfileForm((prev) => ({ ...prev, password: "" }));
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileMsg({ type: "", text: "" });
      }, 1500);
    } else {
      setProfileMsg({ type: "error", text: res.message });
    }
  };

  const getStats = () => {
    const total = books.length;
    const published = books.filter((b) => b.status === "published").length;
    const drafts = books.filter((b) => b.status === "draft").length;
    return { total, published, drafts };
  };

  const stats = getStats();

  return (
    <div className="dashboard-container">
      {/* Header / Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="nav-brand-icon">
            <BookOpen size={20} />
          </div>
          <span>eBook Generator AI</span>
        </div>
        
        <div className="nav-user">
          <button
            className="nav-profile-trigger"
            onClick={() => {
              setProfileForm({ name: user?.name || "", password: "" });
              setShowProfileModal(true);
            }}
          >
            <div className="avatar-circle">
              {user?.name ? user.name[0].toUpperCase() : <User size={14} />}
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }}>
              {user?.name}
            </span>
            <Settings size={14} style={{ color: "var(--text-muted)", marginLeft: "4px" }} />
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={logout}
            style={{ padding: "6px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-header">
          <div className="welcome-text">
            <h1>Welcome back, {user?.name || "Author"}</h1>
            <p>Develop, outline, write, and export your masterpieces with AI.</p>
          </div>
          <button onClick={() => navigate("/wizard")} className="btn btn-primary">
            <Plus size={18} />
            <span>Create New eBook</span>
          </button>
        </div>

        {/* Stats Section */}
        <section className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon purple">
              <Book size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total eBooks</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon emerald">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.published}</h3>
              <p>Published</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-icon blue">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.drafts}</h3>
              <p>Drafts</p>
            </div>
          </div>
        </section>

        {/* Ebooks List */}
        <section className="books-section">
          <div className="section-title">
            <h2>Your eBooks</h2>
            {books.length > 0 && (
              <button
                onClick={() => navigate("/wizard")}
                className="btn btn-secondary"
                style={{ padding: "8px 14px", fontSize: "0.85rem" }}
              >
                <Plus size={14} />
                <span>New Book</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner" style={{ width: "40px", height: "40px" }}></div>
              <p>Fetching your books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <BookOpen size={32} />
              </div>
              <h3>No eBooks Created Yet</h3>
              <p>Generate a professional book outline or start writing manually.</p>
              <button onClick={() => navigate("/wizard")} className="btn btn-primary">
                <Plus size={18} />
                <span>Create Your First eBook</span>
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((book) => {
                const coverUrl = book.coverImage
                  ? `http://localhost:8000/backend/uploads/${book.coverImage}`
                  : null;

                return (
                  <div key={book._id} className="book-card glass-panel">
                    <div className="book-cover-container">
                      <span className={`book-status-badge badge-${book.status}`}>
                        {book.status}
                      </span>
                      
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="book-cover-image"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}

                      {/* Fallback CSS cover sheet */}
                      <div
                        className="book-cover-placeholder"
                        style={{ display: coverUrl ? "none" : "flex" }}
                      >
                        <div className="placeholder-spine"></div>
                        <div className="placeholder-title">{book.title}</div>
                        <div>
                          <div className="placeholder-author">by {book.author}</div>
                          <div className="chapter-count">
                            <FileCode size={12} />
                            <span>{book.chapters?.length || 0} Chapters</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="book-details">
                      <div className="book-meta">
                        <h4>{book.title}</h4>
                        <p>{book.subtitle || "No subtitle"}</p>
                      </div>
                      
                      <div className="book-actions">
                        <Link to={`/editor/${book._id}`} className="book-btn-edit">
                          <Edit2 size={16} />
                          <span>Open Studio</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="book-btn-delete"
                          title="Delete eBook"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>Account Settings</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <X size={18} />
              </button>
            </div>

            {profileMsg.text && (
              <div className={`alert alert-${profileMsg.type}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (optional)</label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty to keep current password"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "10px" }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
