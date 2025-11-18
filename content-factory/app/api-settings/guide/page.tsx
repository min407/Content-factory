'use client'

import { useState } from 'react'
import {
  FileText,
  Key,
  Image,
  MessageSquare,
  Send,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ApiProvider, API_CONFIG_TEMPLATES } from '@/types/api-config'

/**
 * API配置指南页面
 */
export default function ApiSettingsGuidePage() {
  const [expandedSections, setExpandedSections] = useState<Set<ApiProvider>>(new Set([ApiProvider.OPENROUTER]))

  const toggleSection = (provider: ApiProvider) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider)
    } else {
      newExpanded.add(provider)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 简单的提示，实际项目中可以使用toast
    alert('已复制到剪贴板')
  }

  const getProviderIcon = (provider: ApiProvider) => {
    const iconMap = {
      [ApiProvider.OPENROUTER]: MessageSquare,
      [ApiProvider.SILICONFLOW]: Image,
      [ApiProvider.WECHAT_SEARCH]: Database,
      [ApiProvider.XIAOHONGSHU_SEARCH]: Database,
      [ApiProvider.XIAOHONGSHU_DETAIL]: Database,
      [ApiProvider.WECHAT_PUBLISH]: Send
    }
    return iconMap[provider] || Key
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <FileText className="w-6 h-6 text-gray-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">API配置指南</h1>
                <p className="text-sm text-gray-600">详细的API密钥配置步骤和说明</p>
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
              className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>API配置</span>
              </div>
            </a>
            <a
              href="/api-settings/guide"
              className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>配置指南</span>
              </div>
            </a>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 概览说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">配置概览</h2>
              <p className="text-blue-700 mb-4">
                本系统支持多个AI服务的API配置，包括大语言模型、图片生成、内容搜索等功能。
                配置完成后，系统将自动使用您提供的API密钥进行相应的服务调用。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-blue-700">安全的本地存储</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-blue-700">实时连接测试</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-blue-700">灵活的配置管理</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-blue-700">自动环境变量迁移</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 各API配置指南 */}
        <div className="space-y-6">
          {Object.entries(API_CONFIG_TEMPLATES).map(([provider, template]) => {
            const Icon = getProviderIcon(provider as ApiProvider)
            const isExpanded = expandedSections.has(provider as ApiProvider)

            return (
              <div key={provider} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* 标题 */}
                <button
                  onClick={() => toggleSection(provider as ApiProvider)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* 详细内容 */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="space-y-6">
                      {/* 配置步骤 */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">配置步骤</h4>
                        <ol className="space-y-2">
                          {template.documentation.setupGuide?.map((step, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* 必需字段 */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">必需字段</h4>
                        <div className="space-y-3">
                          {template.requiredFields.map((field) => (
                            <div key={field.key} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{field.label}</h5>
                                  <p className="text-sm text-gray-600">{field.helpText}</p>
                                  {field.placeholder && (
                                    <p className="text-xs text-gray-500 mt-1">示例: {field.placeholder}</p>
                                  )}
                                </div>
                                {field.placeholder && (
                                  <button
                                    onClick={() => copyToClipboard(field.placeholder || '')}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 快速链接 */}
                      {template.documentation.url && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-3">快速链接</h4>
                          <a
                            href={template.documentation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>{template.name} 官方文档</span>
                          </a>
                        </div>
                      )}

                      {/* 注意事项 */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-yellow-900">注意事项</h5>
                            <ul className="mt-2 text-sm text-yellow-700 space-y-1 list-disc list-inside">
                              <li>API密钥一旦配置，系统将优先使用用户配置的密钥</li>
                              <li>所有配置都安全存储在本地浏览器中</li>
                              <li>建议定期测试API连接，确保配置有效</li>
                              <li>如需更换API密钥，直接编辑相应配置即可</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 故障排除 */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-3">故障排除</h3>
              <div className="space-y-3 text-sm text-red-700">
                <div>
                  <strong className="font-medium">API连接失败</strong>
                  <p className="mt-1">检查API密钥是否正确，网络连接是否正常，API服务是否可用。</p>
                </div>
                <div>
                  <strong className="font-medium">配置保存失败</strong>
                  <p className="mt-1">清除浏览器缓存后重试，或检查浏览器是否阻止了本地存储。</p>
                </div>
                <div>
                  <strong className="font-medium">API调用错误</strong>
                  <p className="mt-1">检查API密钥权限、请求格式是否正确，以及API配额是否充足。</p>
                </div>
                <div>
                  <strong className="font-medium">密钥安全问题</strong>
                  <p className="mt-1">所有密钥仅存储在本地，不会上传到服务器。请勿在公共设备上配置API密钥。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}