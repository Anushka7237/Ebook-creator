import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Eye,
  Edit,
  Upload,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import "./BookEditor.css";

// Simple custom markdown parser for preview mode
const parseMarkdownToHtml = (markdown) => {
  if (!markdown) return "<p><em>No content written yet. Use the editor or let the AI write for you!</em></p>";
  
  let html = markdown;
  
  // Escape HTML entities to prevent XSS in preview
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$2</h2>"); // Fix regex replace issue
  // Wait, let's write simple replacements:
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^&gt;\s*(.*?)$/gm, "<blockquote>$1</blockquote>");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic (*text*)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
  // Wrap list items in <ul>. We do a rough replacement:
  // (In a real app, markdown-it or marked is preferred, but this regex is a great zero-dependency preview)
  
  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Paragraphs (split by double newline)
  const lines = html.split(/\n\n+/);
  const paragraphs = lines.map((line) => {
    // If it's already a block tag (h1, h2, h3, blockquote, pre, li), return as is
    if (
      line.trim().startsWith("<h") ||
      line.trim().startsWith("<blockquote") ||
      line.trim().startsWith("<pre") ||
      line.trim().startsWith("<li>")
    ) {
      return line;
    }
    return `<p>${line.replace(/\n/g, "<br />")}</p>`;
  });
  
  let result = paragraphs.join("\n");
  
  // Group adjacent <li> tags into <ul> tags
  // Look for sequences of <li>...</li> and wrap in <ul>
  result = result.replace(/((?:<li>.*?<\/li>\s*)+)/gs, "<ul>$1</ul>");

  return result;
};

const BookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved', 'saving', 'error'
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [editorMode, setEditorMode] = useState("edit"); // 'edit' or 'preview'
  
  // AI Panel State
  const [aiStyle, setAiStyle] = useState("Professional");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/books/${id}`);
      setBook(res.data);
      if (res.data.chapters && res.data.chapters.length > 0) {
        setActiveChapterIndex(0);
        setAiPrompt(res.data.chapters[0].description || "");
      }
    } catch (err) {
      console.error("Error fetching book:", err);
      alert("Failed to load book.");
      navigate("/");
    }
    setLoading(false);
  };

  const activeChapter = book?.chapters?.[activeChapterIndex] || null;

  // Save Book details on the server
  const handleSaveBook = async (updatedBook = book) => {
    setSaveStatus("saving");
    try {
      const res = await API.put(`/books/${id}`, {
        title: updatedBook.title,
        subtitle: updatedBook.subtitle,
        author: updatedBook.author,
        status: updatedBook.status,
        chapters: updatedBook.chapters,
      });
      setBook(res.data);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Error saving book:", err);
      setSaveStatus("error");
    }
  };

  // Chapter Content Updates
  const handleContentChange = (e) => {
    const value = e.target.value;
    setBook((prev) => {
      const copy = { ...prev };
      copy.chapters[activeChapterIndex].content = value;
      return copy;
    });
    setSaveStatus("unsaved");
  };

  const handleChapterTitleChange = (e) => {
    const value = e.target.value;
    setBook((prev) => {
      const copy = { ...prev };
      copy.chapters[activeChapterIndex].title = value;
      return copy;
    });
    setSaveStatus("unsaved");
  };

  const handleChapterDescChange = (e) => {
    const value = e.target.value;
    setBook((prev) => {
      const copy = { ...prev };
      copy.chapters[activeChapterIndex].description = value;
      return copy;
    });
    setAiPrompt(value);
    setSaveStatus("unsaved");
  };

  // Add/Remove Chapters
  const handleAddChapter = () => {
    setBook((prev) => {
      const copy = { ...prev };
      const newIdx = copy.chapters.length + 1;
      const newCh = {
        title: `Chapter ${newIdx}: Untitled Chapter`,
        description: "Write a short summary of this chapter.",
        content: "",
      };
      copy.chapters = [...copy.chapters, newCh];
      
      // Auto select the new chapter
      setActiveChapterIndex(copy.chapters.length - 1);
      setAiPrompt(newCh.description);
      return copy;
    });
    setSaveStatus("unsaved");
  };

  const handleDeleteChapter = (indexToDelete) => {
    if (book.chapters.length <= 1) {
      alert("An eBook must have at least one chapter.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this chapter? All written content will be lost.")) {
      setBook((prev) => {
        const copy = { ...prev };
        copy.chapters = copy.chapters.filter((_, idx) => idx !== indexToDelete);
        
        // Adjust active index if it was deleted
        if (activeChapterIndex >= copy.chapters.length) {
          setActiveChapterIndex(copy.chapters.length - 1);
          setAiPrompt(copy.chapters[copy.chapters.length - 1]?.description || "");
        } else {
          setAiPrompt(copy.chapters[activeChapterIndex]?.description || "");
        }
        return copy;
      });
      setSaveStatus("unsaved");
    }
  };

  // Status Toggle
  const handleStatusChange = (newStatus) => {
    const updated = { ...book, status: newStatus };
    setBook(updated);
    handleSaveBook(updated);
  };

  // Cover Image Upload
  const handleCoverUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("coverImage", file);

    setSaveStatus("saving");
    try {
      const res = await API.put(`/books/cover/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setBook(res.data);
      setSaveStatus("saved");
      alert("Cover image uploaded successfully!");
    } catch (err) {
      console.error("Cover upload error:", err);
      alert(err.response?.data?.message || "Failed to upload cover image.");
      setSaveStatus("error");
    }
  };

  // AI Content Generation
  const handleGenerateChapterContent = async () => {
    if (!activeChapter) return;
    setAiGenerating(true);
    try {
      const res = await API.post("/ai/generate-chapter-content", {
        chapterTitle: activeChapter.title,
        chapterDescription: aiPrompt,
        style: aiStyle,
      });

      if (res.data && res.data.content) {
        setBook((prev) => {
          const copy = { ...prev };
          copy.chapters[activeChapterIndex].content = res.data.content;
          return copy;
        });
        setSaveStatus("unsaved");
      }
    } catch (err) {
      console.error("AI writing error:", err);
      alert("AI failed to generate chapter content. Please try again.");
    }
    setAiGenerating(false);
  };

  // Exports
  const handleExportPDF = async () => {
    if (saveStatus === "unsaved") {
      if (window.confirm("You have unsaved changes. Save changes before exporting?")) {
        await handleSaveBook();
      }
    }
    try {
      const response = await API.get(`/export/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF.");
    }
  };

  const handleExportDOCX = async () => {
    if (saveStatus === "unsaved") {
      if (window.confirm("You have unsaved changes. Save changes before exporting?")) {
        await handleSaveBook();
      }
    }
    try {
      const response = await API.get(`/export/${id}/doc`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export DOCX failed:", err);
      alert("Failed to export Word Document.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ height: "100vh" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }}></div>
        <p>Loading your writing studio...</p>
      </div>
    );
  }

  const coverUrl = book?.coverImage
    ? `http://localhost:8000/backend/uploads/${book.coverImage}`
    : null;

  return (
    <div className="editor-container">
      {/* Editor Header */}
      <header className="editor-header">
        <div className="header-left">
          <Link
            to="/"
            className="btn btn-secondary"
            style={{ padding: "8px", borderRadius: "50%", border: "none" }}
            title="Go to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="book-title-meta">
            <h2>{book?.title}</h2>
            <div className="save-badge">
              {saveStatus === "saved" && (
                <>
                  <CheckCircle size={12} style={{ color: "var(--accent-emerald)" }} />
                  <span>Changes Saved</span>
                </>
              )}
              {saveStatus === "saving" && (
                <>
                  <div className="spinner" style={{ width: "12px", height: "12px" }}></div>
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <AlertCircle size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => handleSaveBook()}>
                    Save Changes
                  </span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle size={12} style={{ color: "var(--accent-red)" }} />
                  <span style={{ color: "var(--accent-red)" }}>Save Failed!</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="status-toggle">
            <button
              onClick={() => handleStatusChange("draft")}
              className={`status-toggle-btn ${book?.status === "draft" ? "active" : ""}`}
            >
              Draft
            </button>
            <button
              onClick={() => handleStatusChange("published")}
              className={`status-toggle-btn ${book?.status === "published" ? "active" : ""}`}
            >
              Publish
            </button>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={() => handleSaveBook()}
            className="btn btn-secondary"
            disabled={saveStatus === "saved" || saveStatus === "saving"}
          >
            <Save size={16} />
            <span>Save</span>
          </button>

          <button onClick={handleExportPDF} className="btn btn-secondary">
            <Download size={16} />
            <span>PDF</span>
          </button>

          <button onClick={handleExportDOCX} className="btn btn-secondary">
            <Download size={16} />
            <span>DOCX</span>
          </button>
        </div>
      </header>

      {/* Editor Workspace */}
      <div className="editor-workspace">
        {/* Chapters Navigation (Left) */}
        <aside className="editor-sidebar">
          <div className="sidebar-header">
            <h3>Chapters</h3>
            <button
              onClick={handleAddChapter}
              className="btn btn-secondary"
              style={{ padding: "6px", border: "none" }}
              title="Add New Chapter"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="chapters-list">
            {book?.chapters?.map((ch, idx) => (
              <div
                key={ch._id || idx}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  setAiPrompt(ch.description || "");
                }}
                className={`chapter-nav-item ${activeChapterIndex === idx ? "active" : ""}`}
              >
                <div className="chapter-nav-info">
                  <span className="chapter-nav-idx">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="chapter-nav-title">{ch.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChapter(idx);
                  }}
                  className="chapter-nav-delete"
                  title="Delete Chapter"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Text Canvas (Middle) */}
        <main className="editor-canvas">
          {activeChapter ? (
            <>
              <div className="canvas-toolbar">
                <div className="mode-tabs">
                  <button
                    onClick={() => setEditorMode("edit")}
                    className={`mode-tab ${editorMode === "edit" ? "active" : ""}`}
                  >
                    <Edit size={12} style={{ marginRight: "4px", display: "inline" }} />
                    Edit Markdown
                  </button>
                  <button
                    onClick={() => setEditorMode("preview")}
                    className={`mode-tab ${editorMode === "preview" ? "active" : ""}`}
                  >
                    <Eye size={12} style={{ marginRight: "4px", display: "inline" }} />
                    Live Preview
                  </button>
                </div>
              </div>

              <div className="canvas-content">
                {editorMode === "edit" ? (
                  <textarea
                    value={activeChapter.content}
                    onChange={handleContentChange}
                    placeholder="# Write your chapter in Markdown...

Use # for Title, ## for section headers, **bold** for emphasis, etc."
                    className="editor-textarea"
                  ></textarea>
                ) : (
                  <div
                    className="preview-rendered"
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdownToHtml(activeChapter.content),
                    }}
                  ></div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-canvas">
              <BookOpen size={48} style={{ color: "var(--text-muted)" }} />
              <p>Select a chapter from the list or add one to start writing.</p>
            </div>
          )}
        </main>

        {/* AI & Cover settings Panel (Right) */}
        <aside className="editor-ai-panel">
          <div className="ai-panel-header">
            <Sparkles size={16} style={{ color: "var(--accent-purple)" }} />
            <h3>Studio Assistant</h3>
          </div>

          <div className="ai-panel-content">
            {/* Book Cover Widget */}
            <div className="ai-card glass-panel">
              <h4>Book Cover</h4>
              <p>Upload a cover image (JPEG/PNG up to 2MB) for your eBook exports.</p>
              
              <div className="cover-preview" onClick={handleCoverUploadClick}>
                {coverUrl ? (
                  <img src={coverUrl} alt="eBook Cover" />
                ) : (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Upload size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Click to upload</span>
                  </div>
                )}
                
                <div className="cover-overlay">
                  <Upload size={16} />
                  <span>Change Cover</span>
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            {/* Chapter Configuration */}
            {activeChapter && (
              <div className="ai-card glass-panel">
                <h4>Chapter Config</h4>
                <div className="ai-editor-details">
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Title</label>
                    <input
                      type="text"
                      value={activeChapter.title}
                      onChange={handleChapterTitleChange}
                      className="form-input"
                      style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Description</label>
                    <textarea
                      value={activeChapter.description}
                      onChange={handleChapterDescChange}
                      className="form-input"
                      style={{
                        padding: "8px 12px",
                        fontSize: "0.85rem",
                        height: "80px",
                        fontFamily: "inherit",
                        resize: "none"
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant Writer */}
            {activeChapter && (
              <div className="ai-card glass-panel" style={{ border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                <h4 style={{ color: "var(--accent-purple)" }}>
                  <Sparkles size={14} />
                  <span>AI Chapter Writer</span>
                </h4>
                <p>Gemini will write a complete chapter (approx. 1500 words) using your settings.</p>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>Writing Style</label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="form-input"
                    style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    <option value="Professional">Professional / Formal</option>
                    <option value="Creative">Creative / Narrative</option>
                    <option value="Conversational">Conversational / Casual</option>
                    <option value="Academic">Academic / Technical</option>
                    <option value="Educational">Educational / Tutorial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>Focus Prompt / Details</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Specific items or guidelines for the AI..."
                    className="form-input"
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.85rem",
                      height: "100px",
                      fontFamily: "inherit",
                      resize: "none"
                    }}
                  />
                </div>

                <button
                  onClick={handleGenerateChapterContent}
                  className="btn btn-primary"
                  style={{ width: "100%", fontSize: "0.85rem" }}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Write Chapter Content</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookEditor;
