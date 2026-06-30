"use client";

import { useState, useEffect } from "react";

const BRAND_ASSETS = {
  wordmark: "/assets/brand/ascendance-wordmark.png"
};

const CIRCLE_COLORS = {
  "Regent": "linear-gradient(135deg, #48006e 0%, #30004a 100%)",
  "Collectors": "linear-gradient(135deg, #c99d42 0%, #a67c24 100%)",
  "Ivory": "linear-gradient(135deg, #a72c33 0%, #7c1a20 100%)",
  "Remnant Circle": "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
  "Vision Partner": "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
};

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  
  // Modals state
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [pendingPartnerId, setPendingPartnerId] = useState(null);
  const [toast, setToast] = useState("");
  
  // Donate form inputs state for dynamic updates
  const [donateCircle, setDonateCircle] = useState("");
  const [donateCurrency, setDonateCurrency] = useState("NGN");
  const [donateAmount, setDonateAmount] = useState("");

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      if (data.ok) {
        setPartners(data.partners || []);
      }
    } catch (e) {
      console.error("Failed to fetch partners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleCircleChange = (circle) => {
    setDonateCircle(circle);
    let usdAmount = 0;
    if (circle === "Regent") usdAmount = 400;
    else if (circle === "Collectors") usdAmount = 300;
    else if (circle === "Ivory") usdAmount = 200;
    else if (circle === "Remnant Circle") usdAmount = 120;
    else if (circle === "Vision Partner") usdAmount = 50;

    if (donateCurrency === "USD") {
      setDonateAmount(usdAmount);
    } else {
      setDonateAmount(usdAmount * 1360);
    }
  };

  const handleCurrencyChange = (curr) => {
    setDonateCurrency(curr);
    const currentAmount = Number(donateAmount) || 0;
    if (curr === "USD" && donateCurrency === "NGN") {
      setDonateAmount(Math.round(currentAmount / 1360));
    } else if (curr === "NGN" && donateCurrency === "USD") {
      setDonateAmount(Math.round(currentAmount * 1360));
    }
  };

  const toggleExpand = (id) => {
    setExpandedPartnerId(expandedPartnerId === id ? null : id);
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      action: "donate",
      email: fd.get("email"),
      fullName: fd.get("fullName"),
      country: fd.get("country"),
      circle: donateCircle,
      amount: Number(donateAmount),
      currency: donateCurrency
    };

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        setPendingPartnerId(data.partner.id);
        setShowDonateForm(false);
        // Reset form inputs
        setDonateCircle("");
        setDonateAmount("");
        // Show next popup (Post a Remark)
        setShowRemarkForm(true);
      } else {
        triggerToast(data.error || "Failed to submit donation details.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred during submission.");
    }
  };

  const handleRemarkSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      action: "remark",
      partnerId: pendingPartnerId,
      title: fd.get("remarkTitle"),
      content: fd.get("remarkContent")
    };

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        setShowRemarkForm(false);
        setPendingPartnerId(null);
        triggerToast("Thank you for your generous legacy partnership!");
        fetchPartners();
      } else {
        triggerToast(data.error || "Failed to publish remark.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An error occurred publishing remark.");
    }
  };

  const handleSkipRemark = () => {
    setShowRemarkForm(false);
    setPendingPartnerId(null);
    triggerToast("Thank you for your legacy partnership!");
    fetchPartners();
  };

  const handleLike = async (partnerId) => {
    // Generate a temporary visitorId if not logged in
    let visitorId = localStorage.getItem("ascendance_visitor_id");
    if (!visitorId) {
      visitorId = "visitor-" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("ascendance_visitor_id", visitorId);
    }

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", partnerId, visitorId })
      });
      const data = await res.json();
      if (data.ok) {
        // Optimistically update lists
        setPartners(prev => prev.map(p => p.id === partnerId ? data.partner : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, partnerId) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      action: "comment",
      partnerId,
      text: fd.get("commentText"),
      userName: fd.get("userName"),
      countryCode: fd.get("countryCode")
    };

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        setPartners(prev => prev.map(p => p.id === partnerId ? data.partner : p));
        e.target.reset();
        triggerToast("Comment added!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="shell view-store">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--brand-dark)",
          color: "#white",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "100px",
          boxShadow: "0 10px 25px rgba(72, 0, 110, 0.3)",
          fontWeight: "bold",
          zIndex: 10000,
          fontSize: "0.9rem",
          transition: "all 0.3s ease"
        }}>
          {toast}
        </div>
      )}

      {/* Top Header */}
      <header className="topbar" aria-label="Ascendance">
        <div className="brand-lockup">
          <a href="/"><img src={BRAND_ASSETS.wordmark} alt="Ascendance The Trilogy" style={{ cursor: 'pointer' }} /></a>
        </div>
        <nav className="desktop-nav">
          <a href="/?view=community" className="desktop-nav-link">Community</a>
          <a href="/?view=books" className="desktop-nav-link is-active">Store</a>
          <a href="/?view=home" className="desktop-nav-link">Home</a>
          <a href="/?view=notices" className="desktop-nav-link">Gift</a>
          <a href="/?view=profile" className="desktop-nav-link">Profile</a>
        </nav>
      </header>

      {/* Bottom Tabs Nav */}
      <nav className="nav-tabs">
        <a href="/?view=community" className="nav-link">
          <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
            <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><circle cx="6" cy="11" r="3" /><path d="M2 21v-1a3 3 0 0 1 3-3h1" /><circle cx="18" cy="11" r="3" /><path d="M18 17h1a3 3 0 0 1 3 3v1" />
          </svg>
          Community
        </a>
        <a href="/?view=books" className="nav-link is-active">
          <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
            <path d="M4 10h16l-1.2-5.2A2 2 0 0 0 16.9 3H7.1a2 2 0 0 0-1.9 1.8L4 10Z" /><path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" /><path d="M9 21v-7h6v7" />
          </svg>
          Store
        </a>
        <a href="/?view=home" className="nav-link">
          <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
            <path d="m3 11 9-8 9 8" /><path d="M5 10.5V21h14V10.5" /><path d="M10 21v-6h4v6" />
          </svg>
          Home
        </a>
        <a href="/?view=notices" className="nav-link">
          <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
            <path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
          Gift
        </a>
        <a href="/?view=profile" className="nav-link">
          <svg className="nav-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </a>
      </nav>

      {/* Main Page Area */}
      <main className="main" style={{ display: 'grid', gap: '28px', maxWidth: '680px', margin: '0 auto', padding: '24px 16px 100px' }}>
        
        {/* Title Section */}
        <div>
          <p className="eyebrow">Ascendance – The Movie</p>
          <h1 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: '4px 0 0', fontSize: '2.5rem', fontWeight: '500' }}>Partners</h1>
        </div>

        {/* Hero Banner Poster Image */}
        <div style={{ width: '100%', overflow: 'hidden', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid var(--line)' }}>
          <img 
            src="/assets/brand/movie_poster.png" 
            alt="Ascendance Movie Poster" 
            style={{ width: '100%', display: 'block', height: 'auto' }} 
          />
        </div>

        {/* Legacy Donate Action Card */}
        <section className="print-order" style={{ borderLeft: '4px solid var(--app-gold)', padding: '24px', background: 'var(--app-surface)', borderRadius: '12px' }}>
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ color: 'var(--app-gold)', margin: 0 }}>Lifetime Legacy</p>
            <h2 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', margin: '8px 0', fontSize: '1.6rem', fontWeight: 'bold' }}>Choose a Circle & Donate</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              You are not purchasing a Book –<br />You are investing in a Legacy.
            </p>
          </div>
          <button 
            className="primary-btn" 
            onClick={() => setShowDonateForm(true)} 
            style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Donate
          </button>
        </section>



        {/* Partners / Donors Feed */}
        <section style={{ display: 'grid', gap: '16px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: 'var(--app-purple)', fontSize: '1.5rem', margin: '16px 0 4px 0' }}>Legacy Partners</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--brand)' }}>Loading partners...</div>
          ) : partners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>No partners registered yet. Be the first to partner!</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {partners.map(partner => {
                const expanded = expandedPartnerId === partner.id;
                let visitorId = typeof window !== "undefined" ? localStorage.getItem("ascendance_visitor_id") : null;
                const liked = partner.remark?.likedBy?.includes(visitorId);

                return (
                  <article key={partner.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.02)', overflow: 'hidden', display: 'grid' }}>
                    
                    {/* Card Header & Brief info */}
                    <div style={{ padding: '20px', display: 'grid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--app-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                            {(partner.name || "A").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--ink)', fontSize: '0.95rem' }}>{partner.name}</strong>
                            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{partner.country} · {new Date(partner.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{
                          background: CIRCLE_COLORS[partner.circle] || 'var(--app-purple)',
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {partner.circle}
                        </div>
                      </div>

                      {/* Display remark text if it is NOT expanded but present (truncated overview) */}
                      {!expanded && partner.remark && (
                        <button 
                          onClick={() => toggleExpand(partner.id)} 
                          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'grid', gap: '4px' }}
                        >
                          <h3 style={{ fontSize: '1.05rem', color: 'var(--app-purple)', margin: 0, fontWeight: 'bold' }}>{partner.remark.title}</h3>
                          <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {partner.remark.content}
                          </p>
                        </button>
                      )}
                    </div>

                    {/* Card Actions bar */}
                    {partner.remark && (
                      <div style={{ display: 'flex', gap: '24px', padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>
                        <button 
                          onClick={() => handleLike(partner.id)} 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: liked ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {partner.remark.likes || 0}
                        </button>
                        <button 
                          onClick={() => toggleExpand(partner.id)} 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', padding: 0 }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          </svg>
                          {partner.remark.comments?.length || 0}
                        </button>
                      </div>
                    )}

                    {/* Expanded Detail view & Comments */}
                    {expanded && partner.remark && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '20px', background: '#fcfcfc', display: 'grid', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', color: 'var(--app-purple)', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                            {partner.remark.title}
                          </h3>
                          <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                            {partner.remark.content}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button 
                            onClick={() => toggleExpand(partner.id)} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', padding: 0 }}
                          >
                            Close
                          </button>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 'bold' }}>
                            {partner.remark.comments?.length || 0} reply{(partner.remark.comments?.length !== 1) && 's'}
                          </span>
                        </div>

                        {/* Comments replies list */}
                        {partner.remark.comments?.length > 0 && (
                          <div style={{ display: 'grid', gap: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '12px', marginTop: '8px' }}>
                            {partner.remark.comments.map(comment => (
                              <div key={comment.id} style={{ display: 'flex', gap: '12px', alignItems: 'start', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--app-gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>
                                  {comment.avatar || comment.user.slice(0, 1).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{comment.user}</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{comment.country} · {new Date(comment.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, lineHeight: '1.4' }}>{comment.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Add form */}
                        <form onSubmit={(e) => handleAddComment(e, partner.id)} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                          <input 
                            name="userName" 
                            placeholder="Name" 
                            required 
                            style={{ flex: '1 1 120px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.85rem' }} 
                          />
                          <input 
                            name="countryCode" 
                            placeholder="NG" 
                            maxLength={2} 
                            required 
                            style={{ width: '50px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }} 
                          />
                          <input 
                            name="commentText" 
                            placeholder="Add a remark..." 
                            required 
                            style={{ flex: '2 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.85rem' }} 
                          />
                          <button className="primary-btn" style={{ minHeight: 'auto', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}>Send</button>
                        </form>

                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* MODAL 1: Make Donation form */}
      {showDonateForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--line)', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', color: 'var(--app-purple)', fontSize: '1.4rem' }}>Make a Donation</h2>
              <button onClick={() => setShowDonateForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '4px', color: 'var(--muted)' }}>&times;</button>
            </div>

            <form onSubmit={handleDonateSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email" 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7' }} 
                />
              </div>
              
              <div>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Full name" 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--app-purple)', marginBottom: '4px' }}>Country of Domicile (2-Letter)</label>
                <input 
                  type="text" 
                  name="country" 
                  defaultValue="NG" 
                  maxLength={2} 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7', textTransform: 'uppercase' }} 
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--brand)', marginBottom: '6px' }}>Select Circle</label>
                <select 
                  name="circle" 
                  value={donateCircle}
                  onChange={(e) => handleCircleChange(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7' }}
                >
                  <option value="" disabled>Select Circle</option>
                  <option value="Regent">Regent ($400 - $500)</option>
                  <option value="Collectors">Collectors ($300 - $350)</option>
                  <option value="Ivory">Ivory ($200 - $250)</option>
                  <option value="Remnant Circle">Remnant Circle ($120 - $150)</option>
                  <option value="Vision Partner">Vision Partner (Giving because I believe in the mission)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--brand)', marginBottom: '6px' }}>Donation Amount</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    name="currency" 
                    value={donateCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    style={{ width: '90px', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7' }}
                  >
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                  </select>
                  <input 
                    type="number" 
                    name="amount" 
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder="Amount" 
                    required 
                    min={1}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--brand)', fontSize: '0.95rem', background: '#fffcf7' }} 
                  />
                </div>
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', minHeight: '48px', marginTop: '8px' }}>Submit</button>
            </form>

            {/* Bank details */}
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', border: '1px solid var(--brand)', background: '#fffcf7' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--app-purple)', fontWeight: 'bold' }}>Bank Account Details</h4>
              <div style={{ display: 'grid', gap: '6px', fontSize: '0.85rem', color: 'var(--ink)' }}>
                <div><strong>Bank:</strong> Standard Chartered Bank</div>
                <div><strong>A/C Name:</strong> Stanley Ohanugo</div>
                <div><strong>USD:</strong> 0002412812</div>
                <div><strong>NGN:</strong> 0002412805</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Post a Remark popup */}
      {showRemarkForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--line)', margin: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', color: 'var(--app-purple)', fontSize: '1.4rem' }}>Post a Remark</h2>
              <button onClick={handleSkipRemark} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '4px', color: 'var(--muted)' }}>&times;</button>
            </div>

            <form onSubmit={handleRemarkSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--brand)', marginBottom: '6px' }}>Title</label>
                <input 
                  type="text" 
                  name="remarkTitle" 
                  placeholder="What is the headline?" 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.95rem' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--brand)', marginBottom: '6px' }}>Review</label>
                <textarea 
                  name="remarkContent" 
                  placeholder="What is your experience?" 
                  required 
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '0.95rem', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="ghost-btn" onClick={handleSkipRemark} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ flex: 1 }}>Publish</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
