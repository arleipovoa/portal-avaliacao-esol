import {
  type AppModule,
  getLoginPathForModule,
  persistModule,
} from "@/lib/moduleRouting";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const MODULES: Array<{
  module: AppModule;
  label: string;
  path: string;
  description: string;
}> = [
  {
    module: "obras",
    label: "Avaliação de Obras",
    path: getLoginPathForModule("obras"),
    description: "Avaliação técnica de instalações e obras",
  },
  {
    module: "360",
    label: "Avaliação 360º",
    path: getLoginPathForModule("360"),
    description: "Avaliação de desempenho entre colaboradores",
  },
  {
    module: "nps",
    label: "NPS",
    path: getLoginPathForModule("nps"),
    description: "Net Promoter Score e satisfação de clientes",
  },
];

import { useAuth } from "@/_core/hooks/useAuth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [exploreOpen, setExploreOpen] = useState(false);
  const { user } = useAuth({ redirectOnUnauthenticated: false });

  const visibleModules = MODULES.filter(m => {
    if (m.module === "obras") {
      if (user) return (user as any).jobCategory === "operacional" || (user as any).appRole === "admin";
      return true;
    }
    return true;
  });

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minHeight: "100vh",
        backgroundColor: "#12110f",
        color: "#fff",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* ── Navbar ── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          backgroundColor: "rgba(18,17,15,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "#ffcc29",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.09 12.69C3.74 13.11 3.57 13.32 3.57 13.49C3.56 13.65 3.63 13.79 3.75 13.89C3.89 14 4.16 14 4.71 14H12L11 22L19.91 11.31C20.26 10.89 20.43 10.68 20.43 10.51C20.43 10.35 20.37 10.21 20.25 10.11C20.11 10 19.84 10 19.29 10H12L13 2Z" stroke="#12110f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 15, letterSpacing: "-0.3px" }}>
            E-sol <span style={{ color: "#ffcc29" }}>|</span> Avaliações
          </span>
        </div>

        {/* 3 botões de acesso no canto direito */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {visibleModules.map((m) => (
            <button
              key={m.module}
              onClick={() => {
                persistModule(m.module);
                setLocation(m.path);
              }}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#12110f",
                backgroundColor: "#ffcc29",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to bottom right, rgba(18,17,15,0.90) 35%, rgba(18,17,15,0.55) 100%), url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "120px 48px 80px",
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,204,41,0.35)",
              backgroundColor: "rgba(255,204,41,0.08)",
              marginBottom: 24,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#ffcc29"/>
            </svg>
            <span style={{ color: "#ffcc29", fontSize: 12, fontWeight: 600 }}>
              Sistema de Avaliação 2026
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "clamp(42px, 6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 4,
              letterSpacing: "-1.5px",
            }}
          >
            Portal de Avaliações
          </h1>
          <h2
            style={{
              fontSize: "clamp(42px, 6vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#ffcc29",
              marginBottom: 28,
              letterSpacing: "-1.5px",
            }}
          >
            Grupo E-sol
          </h2>

          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 480,
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            Avaliação técnica de obras, desempenho 360º entre colaboradores e NPS de clientes — tudo em um único portal.
          </p>

          {/* Botão Explorar com dropdown */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              onMouseEnter={() => setExploreOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                backgroundColor: "#ffcc29",
                color: "#12110f",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Explorar
              <ChevronDown
                size={16}
                style={{
                  transition: "transform 0.2s",
                  transform: exploreOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {exploreOpen && (
              <div
                onMouseLeave={() => setExploreOpen(false)}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: 280,
                  backgroundColor: "#1a1917",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  zIndex: 50,
                }}
              >
                {visibleModules.map((m, i) => (
                  <button
                    key={m.module}
                    onClick={() => {
                      persistModule(m.module);
                      setExploreOpen(false);
                      setLocation(m.path);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "16px 18px",
                      background: "none",
                      border: "none",
                      borderBottom: i < visibleModules.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      color: "#fff",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{m.label}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>{m.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Click fora fecha dropdown */}
      {exploreOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setExploreOpen(false)}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
          Grupo E-sol &mdash; Portal de Avaliações &copy; 2026
        </p>
      </footer>
    </div>
  );
}
