import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

interface Article {
  id: number
  title: string
  content: string
  summary: string
  tags: string[]
  view_count: number
  created_at: string
  updated_at: string
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/articles/${id}`).then((data: any) => {
      setArticle(data)
    }).catch((err: any) => {
      setError(err.message || '文章不存在')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-page"><style>{`.loading-page{min-height:100vh;background:#0a0a0f;display:flex;align-items:center;justify-content:center;color:#52525b;}`}</style>加载中...</div>

  if (error || !article) {
    return (
      <div className="error-page">
        <style>{`
          .error-page{min-height:calc(100vh - 64px);background:#0a0a0f;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#71717a;}
          .error-page h2{color:#f87171;margin-bottom:1rem;}
          .back-link{color:#6366f1;text-decoration:none;}
          .back-link:hover{text-decoration:underline;}
        `}</style>
        <h2>{error || '文章不存在'}</h2>
        <Link to="/articles" className="back-link">← 返回文章列表</Link>
      </div>
    )
  }

  return (
    <div className="article-detail">
      <style>{`
        .article-detail { min-height: calc(100vh - 64px); background: #0a0a0f; padding: 3rem 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        .back-link { color: #6366f1; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; margin-bottom: 2rem; font-size: 0.9rem; }
        .back-link:hover { text-decoration: underline; }
        .article-header { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .article-title { font-size: 2rem; font-weight: 600; color: #fafafa; margin-bottom: 1rem; line-height: 1.4; }
        .article-meta { display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.85rem; color: #71717a; }
        .article-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .tag { padding: 0.25rem 0.75rem; background: rgba(99,102,241,0.1); border-radius: 100px; font-size: 0.75rem; color: #a5b4fc; }
        .article-content { line-height: 1.8; color: #a1a1aa; font-size: 1rem; }
        .article-content p { margin-bottom: 1.5rem; }
        .article-content h2 { font-size: 1.5rem; color: #fafafa; margin: 2rem 0 1rem; }
        .article-content h3 { font-size: 1.25rem; color: #fafafa; margin: 1.5rem 0 0.75rem; }
        .article-content pre { background: #12121a; color: #e4e4e7; padding: 1rem; border-radius: 10px; overflow-x: auto; margin: 1.5rem 0; border: 1px solid rgba(255,255,255,0.06); }
        .article-content code { background: rgba(99,102,241,0.1); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.9em; color: #a5b4fc; }
        .article-content pre code { background: none; padding: 0; color: inherit; }
        .article-content blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin: 1.5rem 0; color: #71717a; font-style: italic; }
        .article-content ul, .article-content ol { margin: 1rem 0; padding-left: 2rem; }
        .article-content li { margin-bottom: 0.5rem; }
        .article-content a { color: #6366f1; }
      `}</style>

      <div className="container">
        <Link to="/articles" className="back-link">← 返回文章列表</Link>
        <article>
          <header className="article-header">
            <h1 className="article-title">{article.title}</h1>
            <div className="article-meta">
              <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
              <span>{article.view_count} 阅读</span>
              {article.updated_at !== article.created_at && (
                <span>更新于 {new Date(article.updated_at).toLocaleDateString('zh-CN')}</span>
              )}
            </div>
            {article.tags?.length > 0 && (
              <div className="article-tags">
                {article.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
              </div>
            )}
          </header>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: formatContent(article.content) }} />
        </article>
      </div>
    </div>
  )
}

function formatContent(content: string): string {
  if (!content) return '<p>暂无内容</p>'
  return content.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
}
