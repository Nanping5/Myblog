import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, FileText, Code } from 'lucide-react'
import api from '../services/api'

interface Article {
  id: number
  title: string
  summary: string
  created_at: string
}

interface Project {
  id: number
  name: string
  description: string
  github_url: string
  technologies: string[]
}

// 打字机效果Hook
const useTypewriter = (texts: string[], speed = 100, pause = 2000) => {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[textIndex]
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1))
          setCharIndex(charIndex + 1)
        } else {
          setTimeout(() => setIsDeleting(true), pause)
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1))
          setCharIndex(charIndex - 1)
        } else {
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? speed / 2 : speed)

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex, texts, speed, pause])

  return displayText
}

// 技能数据
const skillCategories = [
  {
    name: '后端',
    skills: ['Go', 'Python', 'Node.js', 'Java']
  },
  {
    name: '前端',
    skills: ['React', 'TypeScript', 'Vue', 'Next.js']
  },
  {
    name: 'DevOps',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD']
  },
  {
    name: '数据库',
    skills: ['MySQL', 'PostgreSQL', 'Redis', 'MongoDB']
  }
]

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const typewriterText = useTypewriter(['全栈开发者', '技术爱好者', '开源贡献者', '终身学习者'], 120, 2500)

  useEffect(() => {
    api.get('/articles?page_size=3').then((data: any) => {
      setArticles(data.articles || [])
    }).catch(() => {})

    api.get('/projects/featured').then((data: any) => {
      setProjects(data.projects || [])
    }).catch(() => {})
  }, [])

  return (
    <div className="home-page">
      <style>{`
        .home-page {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e4e4e7;
        }
        
        /* Hero Section */
        .hero {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: heroPulse 8s ease-in-out infinite;
        }
        
        @keyframes heroPulse {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 100px;
          font-size: 0.85rem;
          color: #a5b4fc;
          margin-bottom: 2rem;
          animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .hero-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #fff 0%, #a1a1aa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: #71717a;
          max-width: 600px;
          line-height: 1.7;
          margin-bottom: 3rem;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
        }
        
        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
        }
        
        .btn {
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(99,102,241,0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(99,102,241,0.5);
        }
        
        .btn-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e4e4e7;
        }
        
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-3px);
        }
        
        /* Skills Section */
        .skills-section {
          padding: 4rem 2rem;
          background: linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 100%);
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .section-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .section-subtitle {
          color: #71717a;
        }
        
        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }
        
        .skill-tag {
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        
        .skill-tag:hover {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 25px rgba(99,102,241,0.2);
        }
        
        .typewriter {
          display: inline;
        }
        
        .typewriter::after {
          content: '|';
          animation: blink 1s infinite;
          color: #6366f1;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .skill-categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .skill-category {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s;
        }
        
        .skill-category:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(99,102,241,0.3);
        }
        
        .skill-category-name {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6366f1;
          margin-bottom: 1rem;
        }
        
        .skill-category-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        /* Content Sections */
        .content-section {
          padding: 4rem 2rem;
        }
        
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .view-all {
          color: #6366f1;
          text-decoration: none;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s;
        }
        
        .view-all:hover {
          transform: translateX(4px);
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        
        .card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          color: inherit;
          display: block;
          position: relative;
          overflow: hidden;
        }
        
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .card:hover::before {
          transform: scaleX(1);
        }
        
        .card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-6px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        }
        
        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #fafafa;
          transition: color 0.2s;
        }
        
        .card:hover .card-title {
          color: #a5b4fc;
        }
        
        .card-desc {
          color: #71717a;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .card-meta {
          font-size: 0.8rem;
          color: #52525b;
        }
        
        .card-link {
          color: #6366f1;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .card-link:hover {
          color: #a5b4fc;
        }
        
        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .tech-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(99,102,241,0.1);
          border-radius: 100px;
          font-size: 0.75rem;
          color: #a5b4fc;
          transition: all 0.2s;
        }
        
        .card:hover .tech-tag {
          background: rgba(99,102,241,0.2);
        }
        
        .empty-state {
          text-align: center;
          color: #52525b;
          padding: 3rem;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 16px;
        }
        
        @media (max-width: 768px) {
          .hero {
            min-height: 70vh;
            padding: 3rem 1.5rem;
          }
          
          .hero-buttons {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
          }
          
          .btn {
            justify-content: center;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span>欢迎来到我的小站</span>
        </div>
        <h1 className="hero-title">
          <span className="typewriter">{typewriterText}</span>
        </h1>
        <p className="hero-subtitle">
          专注于 Go、React 和云原生技术。喜欢简洁高效的解决方案，热衷于探索新技术和分享知识。
        </p>
        <div className="hero-buttons">
          <Link to="/chat" className="btn btn-primary">
            <MessageCircle size={18} /> AI 聊天
          </Link>
          <Link to="/articles" className="btn btn-secondary">
            <FileText size={18} /> 阅读文章
          </Link>
          <Link to="/projects" className="btn btn-secondary">
            <Code size={18} /> 项目展示
          </Link>
        </div>
      </section>

      {/* Skills */}
      <section className="skills-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">技术栈</h2>
            <p className="section-subtitle">我日常使用的技术和工具</p>
          </div>
          <div className="skill-categories">
            {skillCategories.map(category => (
              <div key={category.name} className="skill-category">
                <div className="skill-category-name">{category.name}</div>
                <div className="skill-category-items">
                  {category.skills.map(skill => (
                    <div key={skill} className="skill-tag">{skill}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="content-section">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-title">最新文章</h2>
            <Link to="/articles" className="view-all">查看全部 →</Link>
          </div>
          <div className="cards-grid">
            {articles.length === 0 ? (
              <div className="empty-state">暂无文章</div>
            ) : (
              articles.map(article => (
                <Link to={`/articles/${article.id}`} key={article.id} className="card">
                  <h3 className="card-title">{article.title}</h3>
                  <p className="card-desc">{article.summary || '暂无摘要'}</p>
                  <div className="card-meta">
                    {new Date(article.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="content-section">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-title">精选项目</h2>
            <Link to="/projects" className="view-all">查看全部 →</Link>
          </div>
          <div className="cards-grid">
            {projects.length === 0 ? (
              <div className="empty-state">暂无项目</div>
            ) : (
              projects.map(project => (
                <div className="card" key={project.id}>
                  <h3 className="card-title">{project.name}</h3>
                  <p className="card-desc">{project.description || '暂无描述'}</p>
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="card-link">
                      GitHub →
                    </a>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="tech-tags">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
