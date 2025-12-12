import { useState, useEffect } from 'react'
import api from '../services/api'

interface Article {
  id: number
  title: string
  content: string
  summary: string
  tags: string[]
  is_published: boolean
  created_at: string
}

interface Project {
  id: number
  name: string
  description: string
  github_url: string
  demo_url: string
  technologies: string[]
  featured: boolean
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<'articles' | 'projects'>('articles')
  const [articles, setArticles] = useState<Article[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null)
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (localStorage.getItem('token')) {
      setIsLoggedIn(true)
      loadData()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [a, p] = await Promise.all([api.get('/articles?page_size=100'), api.get('/projects')])
      setArticles((a as any).articles || [])
      setProjects((p as any).projects || [])
    } catch {}
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const data: any = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', data.token)
      setIsLoggedIn(true)
      loadData()
    } catch (err: any) {
      setLoginError(err.message || '登录失败')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

  const saveArticle = async () => {
    if (!editingArticle?.title) return
    try {
      if (editingArticle.id) await api.put(`/articles/${editingArticle.id}`, editingArticle)
      else await api.post('/articles', editingArticle)
      setEditingArticle(null)
      loadData()
    } catch (err: any) { alert(err.message) }
  }

  const deleteArticle = async (id: number) => {
    if (!confirm('确定删除？')) return
    try { await api.delete(`/articles/${id}`); loadData() } catch {}
  }

  const saveProject = async () => {
    if (!editingProject?.name) return
    try {
      if (editingProject.id) await api.put(`/projects/${editingProject.id}`, editingProject)
      else await api.post('/projects', editingProject)
      setEditingProject(null)
      loadData()
    } catch (err: any) { alert(err.message) }
  }

  const deleteProject = async (id: number) => {
    if (!confirm('确定删除？')) return
    try { await api.delete(`/projects/${id}`); loadData() } catch {}
  }

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <style>{`
          .login-page {
            min-height: calc(100vh - 64px);
            background: #0a0a0f;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .login-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            padding: 2.5rem;
            width: 100%;
            max-width: 400px;
          }
          .login-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #fafafa;
            text-align: center;
            margin-bottom: 2rem;
          }
          .form-group { margin-bottom: 1.25rem; }
          .form-label { display: block; color: #a1a1aa; font-size: 0.875rem; margin-bottom: 0.5rem; }
          .form-input {
            width: 100%;
            padding: 0.875rem 1rem;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            color: #fafafa;
            font-size: 1rem;
          }
          .form-input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          }
          .login-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin-top: 0.5rem;
          }
          .login-btn:hover { opacity: 0.9; }
          .error-msg { color: #f87171; text-align: center; margin-top: 1rem; font-size: 0.875rem; }
        `}</style>
        <div className="login-card">
          <h1 className="login-title">🔐 管理后台</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">密码</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn">登录</button>
            {loginError && <p className="error-msg">{loginError}</p>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <style>{`
        .admin-page { min-height: calc(100vh - 64px); background: #0a0a0f; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .admin-title { font-size: 1.5rem; font-weight: 600; color: #fafafa; }
        .logout-btn {
          padding: 0.5rem 1rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          color: #f87171;
          cursor: pointer;
        }
        .tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
        .tab {
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .tab:hover { background: rgba(255,255,255,0.05); }
        .tab.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-color: transparent;
          color: white;
        }
        .toolbar { margin-bottom: 1rem; }
        .add-btn {
          padding: 0.75rem 1.25rem;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 10px;
          color: #4ade80;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .data-table {
          width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
        }
        .data-table th, .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .data-table th { background: rgba(0,0,0,0.2); color: #a1a1aa; font-weight: 500; font-size: 0.85rem; }
        .data-table td { color: #e4e4e7; }
        .data-table tr:hover { background: rgba(255,255,255,0.02); }
        .action-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          margin-right: 0.5rem;
        }
        .edit-btn { background: rgba(99,102,241,0.2); color: #a5b4fc; }
        .delete-btn { background: rgba(239,68,68,0.2); color: #f87171; }
        .status-badge { padding: 0.25rem 0.5rem; border-radius: 100px; font-size: 0.75rem; }
        .status-published { background: rgba(34,197,94,0.2); color: #4ade80; }
        .status-draft { background: rgba(239,68,68,0.2); color: #f87171; }
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal {
          background: #12121a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 2rem; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
        }
        .modal h2 { color: #fafafa; margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; color: #a1a1aa; font-size: 0.875rem; margin-bottom: 0.5rem; }
        .form-input, .form-textarea {
          width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fafafa; font-size: 0.9rem;
        }
        .form-textarea { min-height: 120px; resize: vertical; font-family: inherit; }
        .form-input:focus, .form-textarea:focus { outline: none; border-color: #6366f1; }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; }
        .checkbox-group input { width: auto; }
        .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .save-btn {
          padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none; border-radius: 8px; color: white; cursor: pointer;
        }
        .cancel-btn {
          padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #a1a1aa; cursor: pointer;
        }
        .loading { text-align: center; color: #52525b; padding: 3rem; }
      `}</style>

      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">📊 管理后台</h1>
          <button className="logout-btn" onClick={handleLogout}>退出</button>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>📝 文章</button>
          <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>🚀 项目</button>
        </div>

        {loading ? <div className="loading">加载中...</div> : activeTab === 'articles' ? (
          <>
            <div className="toolbar">
              <button className="add-btn" onClick={() => setEditingArticle({ title: '', content: '', summary: '', tags: [], is_published: false })}>➕ 新建文章</button>
            </div>
            <table className="data-table">
              <thead><tr><th>标题</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td><span className={`status-badge ${a.is_published ? 'status-published' : 'status-draft'}`}>{a.is_published ? '已发布' : '草稿'}</span></td>
                    <td>{new Date(a.created_at).toLocaleDateString('zh-CN')}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => setEditingArticle(a)}>编辑</button>
                      <button className="action-btn delete-btn" onClick={() => deleteArticle(a.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="toolbar">
              <button className="add-btn" onClick={() => setEditingProject({ name: '', description: '', github_url: '', demo_url: '', technologies: [], featured: false })}>➕ 新建项目</button>
            </div>
            <table className="data-table">
              <thead><tr><th>名称</th><th>精选</th><th>操作</th></tr></thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.featured ? '⭐' : '-'}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => setEditingProject(p)}>编辑</button>
                      <button className="action-btn delete-btn" onClick={() => deleteProject(p.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {editingArticle && (
        <div className="modal-overlay" onClick={() => setEditingArticle(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingArticle.id ? '编辑文章' : '新建文章'}</h2>
            <div className="form-group"><label className="form-label">标题</label><input className="form-input" value={editingArticle.title || ''} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">摘要</label><input className="form-input" value={editingArticle.summary || ''} onChange={e => setEditingArticle({...editingArticle, summary: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">内容</label><textarea className="form-textarea" value={editingArticle.content || ''} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">标签（逗号分隔）</label><input className="form-input" value={(editingArticle.tags || []).join(', ')} onChange={e => setEditingArticle({...editingArticle, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} /></div>
            <div className="form-group checkbox-group"><input type="checkbox" checked={editingArticle.is_published || false} onChange={e => setEditingArticle({...editingArticle, is_published: e.target.checked})} /><label className="form-label" style={{margin:0}}>发布</label></div>
            <div className="modal-actions"><button className="save-btn" onClick={saveArticle}>保存</button><button className="cancel-btn" onClick={() => setEditingArticle(null)}>取消</button></div>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="modal-overlay" onClick={() => setEditingProject(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingProject.id ? '编辑项目' : '新建项目'}</h2>
            <div className="form-group"><label className="form-label">名称</label><input className="form-input" value={editingProject.name || ''} onChange={e => setEditingProject({...editingProject, name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">描述</label><textarea className="form-textarea" value={editingProject.description || ''} onChange={e => setEditingProject({...editingProject, description: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">GitHub</label><input className="form-input" value={editingProject.github_url || ''} onChange={e => setEditingProject({...editingProject, github_url: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">演示地址</label><input className="form-input" value={editingProject.demo_url || ''} onChange={e => setEditingProject({...editingProject, demo_url: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">技术栈（逗号分隔）</label><input className="form-input" value={(editingProject.technologies || []).join(', ')} onChange={e => setEditingProject({...editingProject, technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} /></div>
            <div className="form-group checkbox-group"><input type="checkbox" checked={editingProject.featured || false} onChange={e => setEditingProject({...editingProject, featured: e.target.checked})} /><label className="form-label" style={{margin:0}}>精选</label></div>
            <div className="modal-actions"><button className="save-btn" onClick={saveProject}>保存</button><button className="cancel-btn" onClick={() => setEditingProject(null)}>取消</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
