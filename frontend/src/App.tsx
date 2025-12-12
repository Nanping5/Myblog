import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import Projects from './pages/Projects'
import Chat from './pages/Chat'
import Admin from './pages/Admin'

function App() {
  return (
    <Router>
      <Routes>
        {/* Chat页面使用独立的全屏布局 */}
        <Route path="/chat" element={<Chat />} />
        {/* 其他页面使用通用Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
