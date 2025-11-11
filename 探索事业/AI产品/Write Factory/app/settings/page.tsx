'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ApiKeySettings from '@/components/ApiKeySettings'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 mt-1">管理您的账户和系统配置</p>
      </div>

      <div className="space-y-6">
        {/* API Key设置 */}
        <ApiKeySettings />

        {/* 账户信息 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <p className="text-gray-900">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            {user.lastLoginAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最后登录</label>
                <p className="text-gray-900">
                  {new Date(user.lastLoginAt).toLocaleString('zh-CN')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 系统信息 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">版本</span>
              <span className="text-gray-900">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">数据存储</span>
              <span className="text-gray-900">本地存储</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">支持的分析类型</span>
              <span className="text-gray-900">公众号文章分析</span>
            </div>
          </div>
        </div>

        {/* 使用帮助 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">使用帮助</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">如何获取API Key？</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>联系数据平台管理员申请访问权限</li>
                <li>登录对应的数据服务平台</li>
                <li>在个人中心找到API管理页面</li>
                <li>复制您的专属API Key</li>
                <li>回到本页面将API Key粘贴保存</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">安全提示</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>请妥善保管您的API Key，不要分享给他人</li>
                <li>建议定期更换API Key以确保账户安全</li>
                <li>如发现异常使用，请及时联系平台管理员</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">常见问题</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900">Q: 为什么需要配置API Key？</p>
                  <p>A: API Key用于身份验证和数据访问，确保只有授权用户可以使用分析功能。</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Q: 数据会保存在哪里？</p>
                  <p>A: 所有数据都保存在您的浏览器本地，不会上传到任何服务器。</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Q: 可以在不同设备上使用吗？</p>
                  <p>A: 需要在每个设备上分别登录和配置API Key。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}