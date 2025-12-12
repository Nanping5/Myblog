import { Link, useLocation } from 'react-router-dom'
import { ReactNode, useState, useEffect } from 'react'
import { Home, FileText, Code, MessageCircle, ChevronUp, Github, Menu, X } from 'lucide-react'
import { Logo } from './Icons'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [showBackTop, setShowBackTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 路由变化时关闭菜单
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="layout">
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          animation: navSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          padding: 0 2rem;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .logo:hover {
          transform: scale(1.05);
        }
        
        .logo-text {
          font-size: 1.125rem;
          font-weight: 600;
          background: linear-gradient(135deg, #fff 0%, #a1a1aa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .nav-links {
          display: flex;
          gap: 0.25rem;
        }
        
        .nav-link {
          color: #71717a;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateX(-50%);
        }
        
        .nav-link:hover {
          color: #e4e4e7;
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        
        .nav-link:hover::before {
          width: 80%;
        }
        
        .nav-link.active {
          color: #fff;
          background: rgba(99,102,241,0.15);
        }
        
        .nav-link.active::before {
          width: 80%;
        }
        
        .main-content {
          flex: 1;
          padding-top: 64px;
          animation: contentFadeIn 0.6s ease;
        }
        
        @keyframes contentFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .footer {
          background: rgba(0,0,0,0.3);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 3rem 2rem;
          text-align: center;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .footer-text {
          color: #52525b;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .footer-links {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }
        
        .footer-link {
          color: #71717a;
          text-decoration: none;
          font-size: 0.85rem;
          transition: all 0.25s;
        }
        
        .footer-link:hover {
          color: #a5b4fc;
          transform: translateY(-2px);
        }
        
        .nav-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .back-top {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(99,102,241,0.4);
          z-index: 99;
        }
        
        .back-top.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .back-top:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.5);
        }
        
        .mobile-menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e4e4e7;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .mobile-menu-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .mobile-nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99;
          backdrop-filter: blur(4px);
        }
        
        .mobile-nav-overlay.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        
        .mobile-nav {
          position: fixed;
          top: 0;
          right: 0;
          width: 280px;
          height: 100vh;
          background: linear-gradient(180deg, #12121a 0%, #0d0d12 100%);
          z-index: 100;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        
        .mobile-nav.open {
          transform: translateX(0);
        }
        
        .mobile-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .mobile-nav-close {
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }
        
        .mobile-nav-close:hover {
          background: rgba(255,255,255,0.05);
          color: #e4e4e7;
        }
        
        .mobile-nav-links {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          color: #a1a1aa;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .mobile-nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: #e4e4e7;
        }
        
        .mobile-nav-link.active {
          background: rgba(99,102,241,0.15);
          color: #fff;
        }
        
        @media (max-width: 768px) {
          .navbar-content {
            padding: 0 1rem;
          }
          
          .nav-links {
            display: none;
          }
          
          .mobile-menu-btn {
            display: flex;
          }
          
          .back-top {
            bottom: 1.5rem;
            right: 1.5rem;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo">
            <Logo size="default" />
          </Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <span className="nav-icon"><Home size={16} /> 首页</span>
            </Link>
            <Link to="/articles" className={`nav-link ${isActive('/articles') ? 'active' : ''}`}>
              <span className="nav-icon"><FileText size={16} /> 文章</span>
            </Link>
            <Link to="/projects" className={`nav-link ${isActive('/projects') ? 'active' : ''}`}>
              <span className="nav-icon"><Code size={16} /> 项目</span>
            </Link>
            <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>
              <span className="nav-icon"><MessageCircle size={16} /> AI聊天</span>
            </Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* 移动端导航 */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <Logo size="small" />
          <button className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mobile-nav-links">
          <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} /> 首页
          </Link>
          <Link to="/articles" className={`mobile-nav-link ${isActive('/articles') ? 'active' : ''}`}>
            <FileText size={20} /> 文章
          </Link>
          <Link to="/projects" className={`mobile-nav-link ${isActive('/projects') ? 'active' : ''}`}>
            <Code size={20} /> 项目
          </Link>
          <Link to="/chat" className={`mobile-nav-link ${isActive('/chat') ? 'active' : ''}`}>
            <MessageCircle size={20} /> AI聊天
          </Link>
        </div>
      </div>

      <main className="main-content">
        {children}
      </main>

      <button 
        className={`back-top ${showBackTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="返回顶部"
      >
        <ChevronUp size={20} />
      </button>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Dev Space · Built with Go + React</p>
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Github size={16} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
