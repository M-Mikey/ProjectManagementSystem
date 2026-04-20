// Layout.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../Navbar/Navbar";
import Topbar from "../Navbar/Topbar";
import { Outlet } from "react-router-dom";

const BREAKPOINT = 992; // Bootstrap lg

const Layout = () => {
const [isNavOpen, setIsNavOpen] = useState(() => window.innerWidth >= BREAKPOINT);
const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < BREAKPOINT);
  const containerRef = useRef(null);

  const handleResize = useCallback((width) => {
    const mobile = width < BREAKPOINT;
    setIsMobile(mobile);
   
    setIsNavOpen(!mobile);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        handleResize(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleResize]);

  const toggleNav = useCallback(() => setIsNavOpen((prev) => !prev), []);
  const closeNav = useCallback(() => setIsNavOpen(false), []);

  return (
    <div className="app-container" ref={containerRef}>
      <Topbar isNavOpen={isNavOpen} onToggleNav={toggleNav} />

      <div className="main-layout d-flex">
        {/* Mobile backdrop — only rendered when nav is open on mobile */}
        {isMobile && isNavOpen && (
          <div
            className="nav-backdrop"
            onClick={closeNav}
            aria-hidden="true"
          />
        )}

        <Navbar isNavOpen={isNavOpen} isMobile={isMobile} onClose={closeNav} />

        <div className="flex-grow-1">
          <div className="content container-fluid p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;