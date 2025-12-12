import {
  Home,
  FileText,
  Code,
  MessageCircle,
  Settings,
  Github,
  Linkedin,
  Mail,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  ChevronUp,
  Calendar,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react'

// 导出所有图标
export {
  Home,
  FileText,
  Code,
  MessageCircle,
  Settings,
  Github,
  Linkedin,
  Mail,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  ChevronUp,
  Calendar,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
}

// Logo组件
export const Logo = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizes = {
    small: { icon: 24, text: '1rem' },
    default: { icon: 32, text: '1.125rem' },
    large: { icon: 40, text: '1.5rem' },
  }
  const s = sizes[size]

  return (
    <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" className="logo-icon">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="12" height="12" rx="3" fill="url(#logoGradient)"/>
        <rect x="18" y="18" width="12" height="12" rx="3" fill="url(#logoGradient)" opacity="0.7"/>
        <circle cx="26" cy="6" r="4" fill="url(#logoGradient)" opacity="0.5"/>
      </svg>
      <span style={{ 
        fontSize: s.text, 
        fontWeight: 600,
        background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Dev Space
      </span>
    </div>
  )
}

// 社交链接组件
export const SocialLinks = () => {
  const socials = [
    { name: 'GitHub', icon: Github, url: 'https://github.com' },
    { name: 'Email', icon: Mail, url: 'mailto:contact@example.com' },
  ]

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {socials.map(social => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          style={{
            color: '#71717a',
            transition: 'all 0.2s',
          }}
        >
          <social.icon size={20} />
        </a>
      ))}
    </div>
  )
}
