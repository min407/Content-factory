'use client'

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
  LogIn,
  LogOut
} from 'lucide-react'
import { useAuth, AuthStatus } from '@/lib/auth-context'

const menuItems = [
  {
    href: '/',
    label: '仪表盘',
    icon: LayoutDashboard,
    description: '总览和数据统计',
    requireAuth: false
  },
  {
    href: '/analysis',
    label: '选题分析',
    icon: Search,
    description: '关键词分析与洞察',
    requireAuth: true
  },
  {
    href: '/create',
    label: '内容创作',
    icon: PenTool,
    description: 'AI智能创作',
    requireAuth: true
  },
  {
    href: '/publish',
    label: '发布管理',
    icon: Send,
    description: '文章管理与发布',
    requireAuth: true
  },
  {
    href: '/api-settings',
    label: 'API配置',
    icon: Settings,
    description: 'API密钥管理',
    requireAuth: true
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout, isLoading } = useAuth()

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
          {menuItems
            .filter(item => !item.requireAuth || isAuthenticated)
            .map((item) => {
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

        {/* 认证相关操作 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          {isLoading ? (
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">检查中...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-2">
              {/* 用户信息 */}
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.username || '未知用户'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* 登出按钮 */}
              <button
                onClick={() => logout()}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all border-l-4 border-transparent"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">退出登录</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all border-l-4 border-transparent"
              >
                <LogIn className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">登录</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border-l-4 border-transparent"
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">注册</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-white mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">今日统计</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-white/90 text-sm">
              <span>分析任务</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex justify-between text-white/90 text-sm">
              <span>生成文章</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between text-white/90 text-sm">
              <span>已发布</span>
              <span className="font-semibold">5</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// 向后兼容的默认导出
export default Sidebar