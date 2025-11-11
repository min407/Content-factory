'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  PenTool,
  Send,
  Settings,
  BarChart3,
  FileText,
  Zap,
  User,
  LogOut,
  Key
} from 'lucide-react'

const menuItems = [
  {
    href: '/',
    label: '仪表盘',
    icon: LayoutDashboard,
    description: '总览和数据统计'
  },
  {
    href: '/analysis',
    label: '选题分析',
    icon: Search,
    description: '关键词分析与洞察'
  },
  {
    href: '/create',
    label: '内容创作',
    icon: PenTool,
    description: 'AI智能创作'
  },
  {
    href: '/publish',
    label: '发布管理',
    icon: Send,
    description: '文章管理与发布'
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 检查当前用户状态
    const checkUser = () => {
      try {
        const userData = localStorage.getItem('content_factory_user')
        setUser(userData ? JSON.parse(userData) : null)
      } catch {
        setUser(null)
      }
    }

    checkUser()

    // 监听存储变化
    const handleStorageChange = () => {
      checkUser()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorage', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('content_factory_user')
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">内容工厂</h1>
            <p className="text-xs text-gray-500">智能创作平台</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
                           (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className={`text-xs ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 用户信息和API Key设置 */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* 用户信息 */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.username}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* API Key状态 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {user.apiKey ? 'API已配置' : '未配置API'}
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                user.apiKey ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </div>
          </div>
        )}

        {/* API Key设置快捷入口 */}
        <Link
          href="/settings"
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>API Key设置</span>
        </Link>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}