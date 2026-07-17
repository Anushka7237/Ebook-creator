import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Book,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  FileText
} from "lucide-react";
import "./BookWizard.css";

const BookWizard = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // Steps: 1 (Details & Mode), 2 (AI Config), 3 (Review Outline)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  // Step 1: Details and Mode
  const [bookDetails, setBookDetails] = useState({
    title: "",
    subtitle: "",
    author: user?.name || "",
    mode: "ai" // 'manual' or 'ai'
  });

  // Step 2: AI Config
  const [aiConfig, setAiConfig] = useState({
    topic: "",
    description: "",
    style: "Professional",
    numChapters: 5
  });

  // Step 3: Chapters Outline
  const [chapters, setChapters] = useState([]);

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setBookDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiChange = (e) => {
    const { name, value } = e.target;
    setAiConfig((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1 -> Next
  const handleStep1Next = async (e) => {
    e.preventDefault();
    setError("");

    if (!bookDetails.title.trim() || !bookDetails.author.trim()) {
      setError("Title and Author are required.");
      return;
    }

    if (bookDetails.mode === "manual") {
      // Create empty book directly
      setLoading(true);
      try {
        const res = await API.post("/books", {
          title: bookDetails.title,
          subtitle: bookDetails.subtitle,
          author: bookDetails.author,
          chapters: []
        });
        navigate(`/editor/${res.data._id}`);
      } catch (err) {
        console.error(err);
        setError("Failed to create book. Please try again.");
      }
      setLoading(false);
    } else {
      // Go to AI Config
      setStep(2);
    }
  };

  // Step 2 -> Generate Outline
  const handleGenerateOutline = async (e) => {
    e.preventDefault();
    setError("");

    if (!aiConfig.topic.trim()) {
      setError("Please provide a topic/subject for your book.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/ai/generate-outline", {
        topic: aiConfig.topic,
        description: aiConfig.description,
        style: aiConfig.style,
        numChapters: Number(aiConfig.numChapters)
      });
      
      if (res.data && res.data.outline) {
        // Outline keys returned: title, description
        // Add default empty content field to chapters
        const mappedChapters = res.data.outline.map((ch) => ({
          title: ch.title,
          description: ch.description,
          content: ""
        }));
        setChapters(mappedChapters);
        setStep(3);
      } else {
        setError("Received empty response from AI. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "AI failed to generate outline. Try again.");
    }
    setLoading(false);
  };

  // Outline Operations (Step 3)
  const handleChapterTitleChange = (index, value) => {
    setChapters((prev) => {
      const copy = [...prev];
      copy[index].title = value;
      return copy;
    });
  };

  const handleChapterDescChange = (index, value) => {
    setChapters((prev) => {
      const copy = [...prev];
      copy[index].description = value;
      return copy;
    });
  };

  const handleAddChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        title: `Chapter ${prev.length + 1}: New Chapter`,
        description: "Write a short summary of this chapter.",
        content: ""
      }
    ]);
  };

  const handleDeleteChapter = (index) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveChapter = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === chapters.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    setChapters((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
      return copy;
    });
  };

  // Step 3 -> Finish
  const handleCreateBook = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/books", {
        title: bookDetails.title,
        subtitle: bookDetails.subtitle,
        author: bookDetails.author,
        chapters: chapters
      });
      navigate(`/editor/${res.data._id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create book. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="wizard-container">
      {/* Wizard Main Content */}
      <main className="wizard-content">
        <button
          onClick={() => {
            if (step === 1) navigate("/");
            else setStep(step - 1);
          }}
          className="btn btn-secondary"
          style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Step Indicators */}
        <div className="wizard-steps">
          <div className="steps-line"></div>
          <div className={`wizard-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <div className="step-num">1</div>
            <span className="step-name">Details</span>
          </div>
          <div className={`wizard-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <div className="step-num">2</div>
            <span className="step-name">AI Config</span>
          </div>
          <div className={`wizard-step ${step >= 3 ? "active" : ""}`}>
            <div className="step-num">3</div>
            <span className="step-name">Review</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* STEP 1: Details and Mode Selection */}
        {step === 1 && (
          <div className="wizard-card glass-panel">
            <div className="wizard-title-desc">
              <h2>Let's set up your book details</h2>
              <p>Fill in the foundational information for your new ebook project.</p>
            </div>

            <form onSubmit={handleStep1Next}>
              <div className="form-group">
                <label className="form-label">Book Title</label>
                <input
                  type="text"
                  name="title"
                  value={bookDetails.title}
                  onChange={handleDetailsChange}
                  placeholder="e.g. The Quantum Leap"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle (Optional)</label>
                <input
                  type="text"
                  name="subtitle"
                  value={bookDetails.subtitle}
                  onChange={handleDetailsChange}
                  placeholder="e.g. Navigating modern physics with ease"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Author Name</label>
                <input
                  type="text"
                  name="author"
                  value={bookDetails.author}
                  onChange={handleDetailsChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: "30px" }}>
                <label className="form-label">Creation Mode</label>
                <div className="option-toggle-grid">
                  <div
                    className={`option-toggle-card ${bookDetails.mode === "ai" ? "selected" : ""}`}
                    onClick={() => setBookDetails((prev) => ({ ...prev, mode: "ai" }))}
                  >
                    <div className="option-icon">
                      <Sparkles size={20} />
                    </div>
                    <div className="option-info-text">
                      <h3>AI-Assisted Outline</h3>
                      <p>Describe your topic and let Gemini generate a structural outline of chapters for you.</p>
                    </div>
                  </div>

                  <div
                    className={`option-toggle-card ${bookDetails.mode === "manual" ? "selected" : ""}`}
                    onClick={() => setBookDetails((prev) => ({ ...prev, mode: "manual" }))}
                  >
                    <div className="option-icon">
                      <Book size={20} />
                    </div>
                    <div className="option-info-text">
                      <h3>Blank Slate (Manual)</h3>
                      <p>Skip outline helper and jump straight into writing your book from scratch.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="wizard-actions">
                <div></div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      <span>{bookDetails.mode === "manual" ? "Create Book" : "Configure AI"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: AI Outline Config */}
        {step === 2 && !loading && (
          <div className="wizard-card glass-panel">
            <div className="wizard-title-desc">
              <h2>Configure AI Outline Generator</h2>
              <p>Configure how Gemini should draft the chapters and layout for your ebook.</p>
            </div>

            <form onSubmit={handleGenerateOutline}>
              <div className="form-group">
                <label className="form-label">What is your book topic?</label>
                <input
                  type="text"
                  name="topic"
                  value={aiConfig.topic}
                  onChange={handleAiChange}
                  placeholder="e.g. Python Programming for Beginners"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brief Description / Extra Guidelines (Optional)</label>
                <textarea
                  name="description"
                  value={aiConfig.description}
                  onChange={handleAiChange}
                  placeholder="e.g. Focus on interactive code scripts, write for middle schoolers, and include simple analogies."
                  className="form-input"
                  style={{ height: "100px", fontFamily: "inherit", resize: "none" }}
                ></textarea>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Writing Style</label>
                  <select
                    name="style"
                    value={aiConfig.style}
                    onChange={handleAiChange}
                    className="form-input"
                  >
                    <option value="Professional">Professional / Formal</option>
                    <option value="Creative">Creative / Narrative</option>
                    <option value="Conversational">Conversational / Casual</option>
                    <option value="Academic">Academic / Technical</option>
                    <option value="Educational">Educational / Tutorial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Chapters</label>
                  <select
                    name="numChapters"
                    value={aiConfig.numChapters}
                    onChange={handleAiChange}
                    className="form-input"
                  >
                    <option value={3}>3 Chapters</option>
                    <option value={5}>5 Chapters</option>
                    <option value={8}>8 Chapters</option>
                    <option value={10}>10 Chapters</option>
                    <option value={12}>12 Chapters</option>
                  </select>
                </div>
              </div>

              <div className="wizard-actions">
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  <Sparkles size={16} />
                  <span>Generate Outline</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Generating Loading State */}
        {step === 2 && loading && (
          <div className="wizard-card glass-panel">
            <div className="ai-loading-screen">
              <div className="ai-pulse-circle">
                <Sparkles size={36} />
              </div>
              <h3>Generating Chapter Outline...</h3>
              <p>
                Our AI model (Gemini 2.5 Flash) is creating a tailored table of contents, outlining chapters based on your writing style and topic. This may take a few seconds.
              </p>
              <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
            </div>
          </div>
        )}

        {/* STEP 3: Review and Edit Outline */}
        {step === 3 && (
          <div className="wizard-card glass-panel" style={{ maxWidth: "100%" }}>
            <div className="wizard-title-desc">
              <h2>Review generated outline</h2>
              <p>Customize the chapters, titles, and descriptions. You can rearrange, edit, add, or delete chapters before finalizing.</p>
            </div>

            <div className="outline-editor-list">
              {chapters.map((ch, idx) => (
                <div key={idx} className="outline-item">
                  <div className="outline-item-controls">
                    <button
                      type="button"
                      onClick={() => handleMoveChapter(idx, "up")}
                      disabled={idx === 0}
                      className="control-btn"
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveChapter(idx, "down")}
                      disabled={idx === chapters.length - 1}
                      className="control-btn"
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="outline-item-fields">
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => handleChapterTitleChange(idx, e.target.value)}
                      placeholder="Chapter Title"
                      className="outline-item-title"
                    />
                    <textarea
                      value={ch.description}
                      onChange={(e) => handleChapterDescChange(idx, e.target.value)}
                      placeholder="Chapter Description"
                      className="outline-item-desc"
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(idx)}
                      className="btn btn-secondary"
                      style={{ padding: "8px", color: "var(--accent-red)", borderColor: "transparent" }}
                      title="Delete Chapter"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddChapter} className="outline-add-btn">
              <Plus size={16} />
              <span>Add Custom Chapter</span>
            </button>

            <div className="wizard-actions">
              <button
                type="button"
                onClick={() => setStep(bookDetails.mode === "ai" ? 2 : 1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleCreateBook}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Book size={16} />
                    <span>Create eBook Studio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookWizard;
