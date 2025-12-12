import { useState, useEffect } from 'react'
import api from '../services/api'

interface Project {
  id: number
  name: string
  description: string
  github_url: string
  demo_url: string
  technologies: string[]
  featured: boolean
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projects').then((data: any) => {
      setProjects(data.projects || [])
    }).catch(() => setProjects([]))
    .finally(() => setLoading(false))
  }, [])

  return (
    <div className="projects-page">
      <style>{`
        .projects-page {
          min-height: calc(100vh - 64px);
          background: #0a0a0f;
          padding: 3rem 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .page-header { margin-bottom: 3rem; }
        .page-title { font-size: 2rem; font-weight: 600; color: #fafafa; margin-bottom: 0.5rem; }
        .page-desc { color: #71717a; }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .project-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .project-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .project-card.featured { border-color: rgba(99,102,241,0.4); }
        .project-cover {
          height: 160px;
          background: linear-gradient(135deg, #1e1e2e 0%, #12121a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
        }
        .project-content { padding: 1.5rem; }
        .project-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .project-name { font-size: 1.125rem; font-weight: 600; color: #fafafa; margin: 0; }
        .featured-badge {
          padding: 0.25rem 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 6px;
          font-size: 0.7rem;
          color: white;
          font-weight: 500;
        }
        .project-desc { color: #71717a; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem; }
        .project-links { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .project-link {
          color: #6366f1;
          text-decoration: none;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .project-link:hover { text-decoration: underline; }
        .tech-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .tech-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(99,102,241,0.1);
          border-radius: 100px;
          font-size: 0.75rem;
          color: #a5b4fc;
        }
        .loading, .empty { text-align: center; color: #52525b; padding: 4rem; }
      `}</style>

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">项目</h1>
          <p className="page-desc">我做过的一些项目</p>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="empty">暂无项目</div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className={`project-card ${project.featured ? 'featured' : ''}`}>
                <div className="project-cover">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="project-content">
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    {project.featured && <span className="featured-badge">精选</span>}
                  </div>
                  <p className="project-desc">{project.description || '暂无描述'}</p>
                  <div className="project-links">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        GitHub
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        演示
                      </a>
                    )}
                  </div>
                  {project.technologies?.length > 0 && (
                    <div className="tech-tags">
                      {project.technologies.map((tech, i) => <span key={i} className="tech-tag">{tech}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
