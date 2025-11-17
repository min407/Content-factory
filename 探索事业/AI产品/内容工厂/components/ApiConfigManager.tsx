'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  TestTube,
  Download,
  Upload,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  Zap,
  Database,
  Image,
  MessageSquare,
  Send
} from 'lucide-react'
import {
  ApiConfig,
  ApiProvider,
  ApiConfigTemplate,
  ApiTestResult,
  API_CONFIG_TEMPLATES,
  ApiConfigValidation,
  API_SERVICE_PROVIDERS
} from '@/types/api-config'

// 直接导入，使用React的客户端渲染
import { ApiConfigManager } from '@/lib/api-config'
import { UserApiConfigManager } from '@/lib/user-api-config'

/**
 * API配置管理器组件
 */
export default function ApiConfigManagerComponent() {
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [testingProvider, setTestingProvider] = useState<ApiProvider | null>(null)
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, ApiConfigValidation>>({})

  // 初始化和加载配置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 自动迁移环境变量配置
      ApiConfigManager.migrateFromEnv()
      loadConfigs()
    } else {
      setLoading(false)
    }
  }, [])

  // 自动检测连接状态
  const autoCheckConnectionStatus = async (configs: ApiConfig[]) => {
    console.log('🔍 [自动检测] 开始检测连接状态...')

    for (const config of configs) {
      // 只检测已配置且最近没有测试过的API
      if (config.isConfigured && !config.lastTested) {
        console.log(`🔍 [自动检测] 检测 ${config.name} 连接状态...`)

        try {
          const result = await UserApiConfigManager.testConnection(config.provider)

          // 更新UI中的状态
          setConfigs(prev => prev.map(c =>
            c.provider === config.provider
              ? {
                  ...c,
                  lastTested: result.timestamp,
                  testStatus: result.success ? 'success' : 'error',
                  testMessage: result.message
                }
              : c
          ))

          console.log(`✅ [自动检测] ${config.name} 检测完成:`, result.success ? '成功' : '失败')
        } catch (error) {
          console.log(`❌ [自动检测] ${config.name} 检测失败:`, error)
        }

        // 避免频繁请求，每个检测间隔1秒
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('🔍 [自动检测] 所有连接状态检测完成')
  }

  const loadConfigs = async () => {
    try {
      setLoading(true)

      // 优先从服务器获取用户专属配置
      try {
        const userConfigs = await UserApiConfigManager.getConfigs()
        if (userConfigs.length > 0) {
          setConfigs(userConfigs as ApiConfig[])
          console.log('✅ 用户配置加载成功:', userConfigs.length)

          // 自动检测已配置API的连接状态
          setTimeout(() => {
            autoCheckConnectionStatus(userConfigs as ApiConfig[])
          }, 500) // 延迟500ms确保UI已渲染

          return
        }
      } catch (serverError) {
        console.log('用户配置加载失败，尝试从本地获取:', serverError)
      }

      // 回退到本地配置（用于未登录用户或调试）
      if (ApiConfigManager) {
        const localConfigs = ApiConfigManager.getConfigs()
        setConfigs(localConfigs)
        console.log('⚠️ 使用本地配置:', localConfigs.length)
      }
    } catch (error) {
      console.error('加载API配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (config: ApiConfig) => {
    try {
      console.log('🔄 [前端] 开始保存配置...')
      // 优先保存到用户专属服务器存储
      const success = await UserApiConfigManager.saveConfig(config)
      console.log('📊 [前端] UserApiConfigManager.saveConfig 返回:', success)

      if (success) {
        console.log('🔄 [前端] 重新加载配置...')
        await loadConfigs()
        console.log('🔄 [前端] 关闭编辑弹窗...')
        setEditingConfig(null)
        console.log('✅ [前端] 配置已保存到用户专属存储')
        return true
      }

      // 回退到本地存储（用于未登录用户）
      if (ApiConfigManager) {
        const localSuccess = ApiConfigManager.saveConfig(config)
        if (localSuccess) {
          await loadConfigs()
          setEditingConfig(null)
          console.log('⚠️ 配置已保存到本地存储')
          return true
        }
      }

      console.error('保存配置失败：所有存储方式都失败了')
      return false

    } catch (error) {
      console.error('保存配置失败:', error)
      return false
    }
  }

  const deleteConfig = async (configId: string) => {
    try {
      // 优先从本地删除
      if (ApiConfigManager) {
        const config = configs.find(c => c.id === configId)
        if (config) {
          const success = ApiConfigManager.deleteConfig(config.provider)
          if (success) {
            await loadConfigs()
            return true
          }
        }
      }

      // 如果本地删除失败，尝试从服务器删除
      const response = await fetch(`/api/config/api/${configId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadConfigs()
        return true
      }
    } catch (error) {
      console.error('删除配置失败:', error)
    }
    return false
  }

  const testApiConnection = async (provider: ApiProvider) => {
    try {
      setTestingProvider(provider)

      // 优先使用用户配置测试
      try {
        const result = await UserApiConfigManager.testConnection(provider)

        // 更新配置中的测试状态
        setConfigs(prev => prev.map(config =>
          config.provider === provider
            ? {
                ...config,
                lastTested: result.timestamp,
                testStatus: result.success ? 'success' : 'error',
                testMessage: result.message
              }
            : config
        ))

        // 测试状态已保存到数据库，无需重新加载

        return result
      } catch (userError) {
        console.log('用户配置测试失败，尝试本地测试:', userError)
      }

      // 回退到本地测试（用于未登录用户）
      if (ApiConfigManager) {
        try {
          const result = await ApiConfigManager.testConnection(provider)

          // 更新配置中的测试状态
          setConfigs(prev => prev.map(config =>
            config.provider === provider
              ? {
                  ...config,
                  lastTested: result.timestamp,
                  testStatus: result.success ? 'success' : 'error',
                  testMessage: result.message
                }
              : config
          ))

          return result
        } catch (localError) {
          console.log('本地测试也失败:', localError)
        }
      }

      // 最后尝试服务器测试
      try {
        const response = await fetch('/api/config/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ provider })
        })

        const result: ApiTestResult = await response.json()

        // 更新配置中的测试状态
        setConfigs(prev => prev.map(config =>
          config.provider === provider
            ? {
                ...config,
                lastTested: result.timestamp,
                testStatus: result.success ? 'success' : 'error',
                testMessage: result.message
              }
            : config
        ))

        return result
      } catch (serverError) {
        console.log('服务器测试也失败:', serverError)
      }
    } catch (error) {
      console.error('测试API连接失败:', error)
      return {
        success: false,
        message: '连接测试失败',
        timestamp: new Date()
      }
    } finally {
      setTestingProvider(null)
    }
  }

  const togglePasswordVisibility = (configId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }))
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

  const getStatusColor = (config: ApiConfig) => {
    if (!config.isConfigured) return 'text-gray-500'
    if (!config.isActive) return 'text-gray-400'

    switch (config.testStatus) {
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      case 'pending': return 'text-yellow-500'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (config: ApiConfig) => {
    if (!config.isConfigured) return AlertCircle
    if (!config.isActive) return XCircle

    switch (config.testStatus) {
      case 'success': return CheckCircle
      case 'error': return XCircle
      case 'pending': return AlertCircle
      default: return AlertCircle
    }
  }

  const exportConfigs = () => {
    const exportData = {
      version: '1.0.0',
      timestamp: new Date(),
      configs: configs.map(config => ({
        provider: config.provider,
        name: config.name,
        apiBase: config.apiBase,
        model: config.model,
        hasApiKey: !!config.apiKey
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">加载API配置...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API配置管理</h1>
                <p className="text-sm text-gray-600">管理您的AI服务API密钥和配置</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportConfigs}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={configs.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>导出配置</span>
              </button>
              <button
                onClick={() => setEditingConfig({
                  id: Date.now().toString(),
                  provider: ApiProvider.OPENROUTER,
                  name: '',
                  description: '',
                  apiKey: '',
                  isActive: true,
                  isConfigured: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                <span>添加配置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总配置数</p>
                <p className="text-2xl font-bold text-gray-900">{configs.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已激活</p>
                <p className="text-2xl font-bold text-green-600">
                  {configs.filter(c => c.isActive && c.isConfigured).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">配置完成</p>
                <p className="text-2xl font-bold text-blue-600">
                  {configs.filter(c => c.isConfigured).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">需要关注</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {configs.filter(c => !c.isConfigured || c.testStatus === 'error').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* 配置列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">API配置列表</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {Object.values(ApiProvider).map(provider => {
              const config = configs.find(c => c.provider === provider)
              const template = API_CONFIG_TEMPLATES[provider]
              const Icon = getProviderIcon(provider)

              return (
                <div key={provider} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        config?.isConfigured && config?.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        {config && (
                          <div className="flex flex-col space-y-2 mt-2">
                            {/* 服务商信息 */}
                            {config.serviceProvider && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">服务商:</span>
                                {(() => {
                                  const providers = API_SERVICE_PROVIDERS[provider]
                                  const selectedProvider = providers?.find(p => p.id === config.serviceProvider)
                                  if (!selectedProvider) {
                                    return <span className="text-xs text-gray-700">未知服务商</span>
                                  }
                                  return (
                                    <span className="flex items-center space-x-1 text-xs text-gray-700">
                                      <span>{selectedProvider.name}</span>
                                      {selectedProvider.isRecommended && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">推荐</span>}
                                      {selectedProvider.isCustom && <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">自定义</span>}
                                    </span>
                                  )
                                })()}
                              </div>
                            )}

                            {/* 状态信息 */}
                            <div className="flex items-center space-x-4">
                              <span className={`flex items-center space-x-1 text-sm ${getStatusColor(config)}`}>
                                {(() => {
                                  const Icon = getStatusIcon(config)
                                  return Icon ? <Icon className="w-4 h-4" /> : null
                                })()}
                                <span>
                                  {!config.isConfigured ? '未配置' :
                                   !config.isActive ? '已禁用' :
                                   config.testStatus === 'success' ? '连接正常' :
                                   config.testStatus === 'error' ? '连接失败' : '未测试'}
                                </span>
                              </span>
                              {config.lastTested && (
                                <span className="text-xs text-gray-500">
                                  最后测试: {new Date(config.lastTested).toLocaleString()}
                                </span>
                              )}
                              {config.testMessage && (
                                <span className="text-xs text-gray-600 max-w-md truncate">
                                  {config.testMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {config && (
                        <>
                          <button
                            onClick={() => testApiConnection(provider)}
                            disabled={testingProvider === provider}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          >
                            {testingProvider === provider ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                            <span>测试</span>
                          </button>
                          <button
                            onClick={() => setEditingConfig(config)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>编辑</span>
                          </button>
                          {config.isConfigured && (
                            <button
                              onClick={() => deleteConfig(config.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>删除</span>
                            </button>
                          )}
                        </>
                      )}
                      {!config && (
                        <button
                          onClick={() => setEditingConfig({
                            id: Date.now().toString(),
                            provider,
                            name: template.name,
                            description: template.description,
                            apiKey: '',
                            apiBase: template.defaultValues.apiBase,
                            model: template.defaultValues.model,
                            isActive: true,
                            isConfigured: false,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          })}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          <Plus className="w-4 h-4" />
                          <span>配置</span>
                        </button>
                      )}
                      {template.documentation.url && (
                        <a
                          href={template.documentation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>文档</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 编辑配置弹窗 */}
      {editingConfig && (
        <ApiConfigEditor
          config={editingConfig}
          template={API_CONFIG_TEMPLATES[editingConfig.provider]}
          onSave={saveConfig}
          onCancel={() => setEditingConfig(null)}
          showPassword={!!showPasswords[editingConfig.id]}
          onTogglePassword={() => togglePasswordVisibility(editingConfig.id)}
        />
      )}
    </div>
  )
}

/**
 * API配置编辑器组件
 */
interface ApiConfigEditorProps {
  config: ApiConfig
  template: ApiConfigTemplate
  onSave: (config: ApiConfig) => Promise<boolean>
  onCancel: () => void
  showPassword: boolean
  onTogglePassword: () => void
}

function ApiConfigEditor({
  config,
  template,
  onSave,
  onCancel,
  showPassword,
  onTogglePassword
}: ApiConfigEditorProps) {
  const [formData, setFormData] = useState<ApiConfig>(config)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    template.requiredFields.forEach(field => {
      const value = formData[field.key as keyof ApiConfig] as string
      if (field.required && !value?.trim()) {
        newErrors.push(`${field.label}是必填项`)
      }

      if (field.validation) {
        if (field.validation.pattern && value && !new RegExp(field.validation.pattern).test(value)) {
          newErrors.push(field.validation.message || `${field.label}格式不正确`)
        }
        if (field.validation.minLength && value && value.length < field.validation.minLength) {
          newErrors.push(`${field.label}长度不能少于${field.validation.minLength}个字符`)
        }
        if (field.validation.maxLength && value && value.length > field.validation.maxLength) {
          newErrors.push(`${field.label}长度不能超过${field.validation.maxLength}个字符`)
        }
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    console.log('🚀 [前端] 准备保存配置:', {
      provider: formData.provider,
      name: formData.name,
      apiKey: formData.apiKey ? `${formData.apiKey.substring(0, 8)}...` : 'undefined',
      apiBase: formData.apiBase,
      model: formData.model
    })

    setSaving(true)
    try {
      const updatedConfig: ApiConfig = {
        ...formData,
        isConfigured: !!formData.apiKey?.trim(),
        updatedAt: new Date()
      }

      console.log('📤 [前端] 发送配置到服务器:', updatedConfig)
      const success = await onSave(updatedConfig)
      console.log('📥 [前端] 保存结果:', success)

      if (success) {
        setErrors([])
      } else {
        setErrors(['保存失败，请稍后重试'])
      }
    } catch (error) {
      console.error('❌ [前端] 保存出错:', error)
      setErrors(['保存失败，请稍后重试'])
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.key as keyof ApiConfig] as string || ''

    switch (field.type) {
      case 'service_provider':
        return (
          <div className="space-y-2">
            <select
              value={value}
              onChange={(e) => {
                const newFormData = {
                  ...formData,
                  [field.key]: e.target.value
                }

                // 如果选择了自定义服务商，清空API地址
                if (e.target.value.includes('custom')) {
                  newFormData.apiBase = ''
                } else {
                  // 自动填充API地址
                  const providers = API_SERVICE_PROVIDERS[template.provider]
                  const selectedProvider = providers?.find(p => p.id === e.target.value)
                  if (selectedProvider && selectedProvider.baseUrl) {
                    newFormData.apiBase = selectedProvider.baseUrl
                  }
                }

                setFormData(newFormData)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择API服务商</option>
              {field.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.isRecommended && '👑'}
                </option>
              ))}
            </select>

            {/* 显示选中服务商的详细信息 */}
            {value && (
              (() => {
                const providers = API_SERVICE_PROVIDERS[template.provider]
                const selectedProvider = providers?.find(p => p.id === value)
                if (!selectedProvider) return null

                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div className="font-medium text-blue-900 flex items-center space-x-2">
                      <span>{selectedProvider.name}</span>
                      {selectedProvider.isRecommended && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">推荐</span>}
                      {selectedProvider.isCustom && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">自定义</span>}
                    </div>
                    <div className="text-blue-700 mt-1">{selectedProvider.description}</div>
                    {selectedProvider.pricing && (
                      <div className="text-blue-600 text-xs mt-1">
                        💰 {selectedProvider.pricing}
                      </div>
                    )}
                    {selectedProvider.features && selectedProvider.features.length > 0 && (
                      <div className="text-blue-600 text-xs mt-1">
                        ✨ {selectedProvider.features.join(' • ')}
                      </div>
                    )}
                  </div>
                )
              })()
            )}
          </div>
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData({
              ...formData,
              [field.key]: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">请选择</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={(e) => setFormData({
                ...formData,
                [field.key]: e.target.value
              })}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => setFormData({
              ...formData,
              [field.key]: e.target.value
            })}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {config.id === Date.now().toString() ? '添加' : '编辑'} {template.name} 配置
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">配置错误</p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 配置字段 */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({
                  ...formData,
                  isActive: e.target.checked
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                启用此配置
              </label>
            </div>

            {template.requiredFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.helpText && (
                  <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                )}
              </div>
            ))}

            {/* 配置指南 */}
            {template.documentation.setupGuide && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">配置指南</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  {template.documentation.setupGuide.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? '保存中...' : '保存配置'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}