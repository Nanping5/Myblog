import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Article {
  id: number
  title: string
  summary: string
  tags: string[]
  view_count: number
  created_at: string
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    setLoading(true)
    api.get(`/articles?page=${page}&page_size=${pageSize}`).then((data: any) => {
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    }).catch(() => setArticles([]))
    .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="articles-page">
      <style>{`
        .articles-page {
          min-height: calc(100vh - 64px);
          background: #0a0a0f;
          padding: 3rem 2rem;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .page-header { margin-bottom: 3rem; }
        .page-title {
          font-size: 2rem; font-weight: 600; color: #fafafa; margin-bottom: 0.5rem;
        }
        .page-desc { color: #71717a; }
        .article-list { display: flex; flex-direction: column; gap: 1rem; }
        .article-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
        }
        .article-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(99,102,241,0.3);
          transform: translateX(4px);
        }
        .article-title { font-size: 1.125rem; font-weight: 600; color: #fafafa; margin-bottom: 0.5rem; }
        .article-summary { color: #71717a; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem; }
        .article-meta { display: flex; gap: 1.5rem; font-size: 0.8rem; color: #52525b; }
        .article-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .tag {
          padding: 0.25rem 0.75rem;
          background: rgba(99,102,241,0.1);
          border-radius: 100px;
          font-size: 0.75rem;
          color: #a5b4fc;
        }
        .pagination { display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem; }
        .pagination button {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination button:hover:not(:disabled) {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.3);
          color: #fff;
        }
        .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
        .pagination button.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-color: transparent;
          color: white;
        }
        .loading, .empty { text-align: center; color: #52525b; padding: 4rem; }
      `}</style>

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">文章</h1>
          <p className="page-desc">技术分享、踩坑记录和学习笔记</p>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="empty">暂无文章</div>
        ) : (
          <>
            <div className="article-list">
              {articles.map(article => (
                <Link to={`/articles/${article.id}`} key={article.id} className="article-card">
                  <h2 className="article-title">{article.title}</h2>
                  <p className="article-summary">{article.summary || '暂无摘要'}</p>
                  <div className="article-meta">
                    <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                    <span>{article.view_count} 阅读</span>
                  </div>
                  {article.tags?.length > 0 && (
                    <div className="article-tags">
                      {article.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>上一页</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>{p}</button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
