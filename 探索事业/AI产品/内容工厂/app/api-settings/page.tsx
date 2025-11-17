'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Settings, Shield, Info, ExternalLink, Lock, ArrowLeft } from 'lucide-react'
import { useAuth, withAuth } from '@/lib/auth-context'

// 动态导入API配置管理器组件，避免SSR问题
const ApiConfigManagerComponent = dynamic(() => import('@/components/ApiConfigManager'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
})

/**
 * API设置页面（需要登录）
 */
function ApiSettingsPageContent() {
  const [isClient, setIsClient] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {/* 返回按钮 */}
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                title="返回上一页"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </button>

              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-gray-600" />
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">我的API配置</h1>
                <p className="text-sm text-gray-600">
                  管理您的个人API配置，数据安全存储在服务器端
                  {user && <span className="text-blue-600 ml-1">({user.username})</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <a
              href="/api-settings"
              className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>API配置</span>
              </div>
            </a>
            <a
              href="/api-settings/guide"
              className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>配置指南</span>
              </div>
            </a>
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 提示信息 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900">用户专属API配置</h3>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>• 您的API配置已安全升级为用户专属模式，与其他用户完全隔离</p>
                <p>• 配置数据存储在服务器端，支持跨设备同步和备份</p>
                <p>• 支持多服务商配置，可以灵活切换不同的API服务</p>
                <p>• 实时连接测试，确保您的API配置正常工作</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速链接 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <a
            href="https://openrouter.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors"
          >
            <div>
              <h4 className="font-medium text-gray-900">OpenRouter文档</h4>
              <p className="text-sm text-gray-600">获取API密钥和使用指南</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <a
            href="https://siliconflow.cn/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors"
          >
            <div>
              <h4 className="font-medium text-gray-900">Silicon Flow文档</h4>
              <p className="text-sm text-gray-600">图片生成API使用指南</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <a
            href="/api-settings/guide"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-colors"
          >
            <div>
              <h4 className="font-medium text-gray-900">详细配置指南</h4>
              <p className="text-sm text-gray-600">查看完整的配置步骤</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>

        {/* API配置管理器 */}
        <ApiConfigManagerComponent />
      </div>
    </div>
  )
}

// 使用高阶组件保护页面，需要登录才能访问
export default withAuth(ApiSettingsPageContent)