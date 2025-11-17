'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Radio,
  Clock
} from 'lucide-react'
import {
  WechatAccount,
  PublishStatusType,
  PublishStatus,
  ArticleTypeConfig
} from '@/types/wechat-publish'

interface WechatPublishModalProps {
  isOpen: boolean
  onClose: () => void
  draft: any
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export default function WechatPublishModal({
  isOpen,
  onClose,
  draft,
  onSuccess,
  onError
}: WechatPublishModalProps) {
  const [step, setStep] = useState<'select' | 'publishing' | 'result'>('select')
  const [wechatAccounts, setWechatAccounts] = useState<WechatAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [articleType, setArticleType] = useState<'news' | 'newspic'>('news')
  const [publishStatus, setPublishStatus] = useState<PublishStatusType>(PublishStatus.IDLE)
  const [loading, setLoading] = useState(false)
  const [publishResult, setPublishResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  // 加载公众号列表
  useEffect(() => {
    if (isOpen && wechatAccounts.length === 0) {
      loadWechatAccounts()
    }
  }, [isOpen])

  const loadWechatAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wechat-publish/accounts')
      const data = await response.json()

      if (data.success) {
        setWechatAccounts(data.data.accounts)
        if (data.data.accounts.length > 0) {
          setSelectedAccount(data.data.accounts[0].wechatAppid)
        }
      } else {
        setError(data.error || '获取公众号列表失败')
      }
    } catch (err) {
      console.error('加载公众号列表失败:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      setStep('publishing')
      setPublishStatus(PublishStatus.LOADING)
      setError('')

      // 检查是否是批量发布模式
      if (draft.isBatch && draft.batchDrafts) {
        // 批量发布模式
        const batchResponse = await fetch('/api/wechat-publish/batch-publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            draftIds: draft.batchDrafts.map((d: any) => d.id),
            wechatAppid: selectedAccount,
            articleType: articleType,
            drafts: draft.batchDrafts
          })
        })

        const batchData = await batchResponse.json()

        if (batchResponse.ok && batchData.success) {
          setPublishStatus(PublishStatus.SUCCESS)
          setPublishResult({
            total: batchData.data.total,
            successCount: batchData.data.successCount,
            failedCount: batchData.data.failedCount,
            results: batchData.data.results
          })
          setStep('result')

          // 在客户端更新批量发布的草稿状态
          try {
            const { DraftManager } = await import('@/lib/content-management')

            // 更新每个成功发布的草稿状态
            const successResults = batchData.data.results.filter((result: any) => result.status === 'success')

            for (const result of successResults) {
              const draftItem = draft.batchDrafts.find((d: any) => d.id === result.draftId)
              if (draftItem) {
                DraftManager.updateDraft(result.draftId, {
                  status: 'published',
                  publishedAt: new Date(),
                  publishedTo: {
                    platform: 'wechat',
                    accountId: selectedAccount,
                    articleType: articleType,
                    publicationId: result.publicationId,
                    mediaId: result.mediaId
                  }
                })
                console.log(`✅ 客户端更新草稿 ${result.draftId} 状态成功`)
              }
            }
          } catch (updateError) {
            console.error('客户端批量更新草稿状态失败:', updateError)
          }

          onSuccess?.(batchData.data)
        } else {
          setPublishStatus(PublishStatus.ERROR)
          setError(batchData.error || '批量发布失败')
          onError?.(batchData.error || '批量发布失败')
        }
      } else {
        // 单篇发布模式
        const response = await fetch('/api/wechat-publish/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            draftId: draft.id,
            wechatAppid: selectedAccount,
            articleType: articleType,
            draftData: draft // 传递完整的草稿数据
          })
        })

        const data = await response.json()

        if (data.success) {
          setPublishStatus(PublishStatus.SUCCESS)
          setPublishResult(data.data)
          setStep('result')

          // 在客户端更新草稿状态
          try {
            const { DraftManager } = await import('@/lib/content-management')
            DraftManager.updateDraft(draft.id, {
              status: 'published',
              publishedAt: new Date(),
              publishedTo: {
                platform: 'wechat',
                accountId: selectedAccount,
                articleType: articleType,
                publicationId: data.data.publicationId,
                mediaId: data.data.mediaId
              }
            })
            console.log('客户端草稿状态更新成功')
          } catch (updateError) {
            console.error('客户端更新草稿状态失败:', updateError)
          }

          onSuccess?.(data.data)
        } else {
          setPublishStatus(PublishStatus.ERROR)
          setError(data.error || '发布失败')
          onError?.(data.error || '发布失败')
        }
      }
    } catch (err) {
      console.error('发布失败:', err)
      setPublishStatus(PublishStatus.ERROR)
      setError('网络错误，请稍后重试')
      onError?.('网络错误，请稍后重试')
    }
  }

  const handleClose = () => {
    if (step === 'publishing' && publishStatus === PublishStatus.LOADING) {
      // 发布中不允许关闭
      return
    }

    // 重置状态
    setStep('select')
    setSelectedAccount('')
    setArticleType('news')
    setPublishStatus(PublishStatus.IDLE)
    setPublishResult(null)
    setError('')

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Send className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">
              发布到公众号
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'publishing' && publishStatus === PublishStatus.LOADING}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-6">
              {/* 草稿信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">{draft.title}</h3>
                    <p className="text-sm text-blue-700 line-clamp-2">
                      {draft.content.substring(0, 150)}...
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      字数：{(draft as any).wordCount || 0} 字
                    </p>
                  </div>
                </div>
              </div>

              {/* 选择公众号 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  选择公众号
                </label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">加载公众号列表...</span>
                  </div>
                ) : wechatAccounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>暂无可用公众号</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {wechatAccounts.map((account) => (
                      <label
                        key={account.wechatAppid}
                        className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="account"
                          value={account.wechatAppid}
                          checked={selectedAccount === account.wechatAppid}
                          onChange={(e) => setSelectedAccount(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <img
                            src={account.avatar}
                            alt={account.name}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'>公众号</text></svg>`
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{account.name}</span>
                              {account.verified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  已认证
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.type === 'subscription' ? '订阅号' : '服务号'}
                              {account.status !== 'active' && (
                                <span className="ml-2 text-red-500">（已停用）</span>
                              )}
                            </div>
                          </div>
                          <Radio
                            className={`w-5 h-5 ${
                              selectedAccount === account.wechatAppid
                                ? 'text-green-500'
                                : 'text-gray-300'
                            }`}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 选择发布类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  发布类型
                </label>
                <div className="space-y-2">
                  {Object.entries(ArticleTypeConfig).map(([type, config]) => (
                    <label
                      key={type}
                      className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="articleType"
                        value={type}
                        checked={articleType === type}
                        onChange={(e) => setArticleType(e.target.value as 'news' | 'newspic')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        {type === 'news' ? (
                          <FileText className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-green-500" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{config.label}</div>
                          <div className="text-sm text-gray-500">{config.description}</div>
                        </div>
                        <Radio
                          className={`w-5 h-5 ${
                            articleType === type ? 'text-green-500' : 'text-gray-300'
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'publishing' && (
            <div className="text-center py-12">
              {publishStatus === PublishStatus.LOADING && (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      正在发布到公众号...
                    </h3>
                    <p className="text-gray-500">
                      请稍候，系统正在处理您的文章
                    </p>
                  </div>
                </div>
              )}

              {publishStatus === PublishStatus.ERROR && (
                <div className="space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">
                      发布失败
                    </h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    重新尝试
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'result' && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  发布成功！
                </h3>
                <p className="text-gray-600">
                  文章已成功发布到公众号草稿箱
                </p>
              </div>

              {publishResult && (
                <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">发布详情</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>发布ID: {publishResult.publicationId}</p>
                    <p>媒体ID: {publishResult.mediaId}</p>
                    <p>状态: {publishResult.status}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  完成
                </button>
                <button
                  onClick={() => {
                    // 可以跳转到公众号管理后台
                    window.open('https://mp.weixin.qq.com/', '_blank')
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  查看草稿箱
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {step === 'select' && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              onClick={handlePublish}
              disabled={!selectedAccount || loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              发布到公众号
            </button>
          </div>
        )}
      </div>
    </div>
  )
}