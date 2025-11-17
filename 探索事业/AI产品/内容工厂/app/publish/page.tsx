'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Check,
  X,
  Clock,
  FileText,
  Calendar,
  Tag,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Share2,
  Download,
  Archive,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { withAuth } from '@/lib/auth-context'
import { Draft } from '@/types/ai-analysis'
import { DraftManager } from '@/lib/content-management'
import WechatPublishModal from '@/components/WechatPublishModal'

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: FileText },
  pending_review: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  published: { label: '已发布', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '发布失败', color: 'bg-red-100 text-red-700', icon: AlertCircle }
}

const platformConfig = {
  xiaohongshu: { label: '小红书', color: 'bg-red-500' },
  wechat: { label: '公众号', color: 'bg-green-500' }
}

function PublishPageContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [publishingArticle, setPublishingArticle] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 公众号发布弹窗状态
  const [showWechatPublishModal, setShowWechatPublishModal] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<any>(null)

  // 加载草稿数据（直接从客户端localStorage读取）
  const loadDrafts = async () => {
    try {
      // 确保在客户端环境
      if (typeof window !== 'undefined') {
        const drafts = DraftManager.getDrafts()
        setDrafts(drafts)
      }
    } catch (error) {
      console.error('加载草稿出错:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadDrafts()
  }, [])

  // 刷新草稿
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDrafts()
  }

  const handlePublish = (draftId: string, platform: 'xiaohongshu' | 'wechat') => {
    if (platform === 'wechat') {
      // 打开公众号发布弹窗
      const draft = drafts.find(d => d.id === draftId)
      if (draft) {
        setSelectedDraft(draft)
        setShowWechatPublishModal(true)
        setShowDropdown(null)
      }
    } else {
      // 小红书发布（保留原有模拟逻辑）
      setPublishingArticle(draftId)
      setTimeout(() => {
        setPublishingArticle(null)
        alert(`成功发布到${platformConfig[platform].label}！`)
      }, 2000)
    }
  }

  // 处理公众号发布成功
  const handleWechatPublishSuccess = (result: any) => {
    // 重新加载草稿列表
    loadDrafts()
    // 可以添加成功提示
    console.log('公众号发布成功:', result)
  }

  // 处理公众号发布错误
  const handleWechatPublishError = (error: string) => {
    // 可以添加错误提示
    console.error('公众号发布失败:', error)
  }

  const handleSelectAll = () => {
    if (selectedArticles.length === drafts.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(drafts.map(d => d.id))
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('确定要删除这个草稿吗？')) return

    try {
      // 确保在客户端环境
      if (typeof window !== 'undefined') {
        const deleted = DraftManager.deleteDraft(draftId)
        if (deleted) {
          await loadDrafts() // 重新加载草稿
          setShowDropdown(null)
        } else {
          alert('删除失败：草稿不存在')
        }
      }
    } catch (error) {
      console.error('删除草稿出错:', error)
      alert('删除失败')
    }
  }

  const handleViewDraft = (draft: any) => {
    // 创建一个模态框显示草稿内容
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto w-full">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-xl font-bold text-gray-900">草稿内容预览</h2>
            <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">标题</h3>
            <p class="text-gray-800">${draft.title}</p>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">正文内容</h3>
            <div class="prose max-w-none text-gray-800 bg-gray-50 p-4 rounded-lg">
              ${draft.content.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${draft.images && draft.images.length > 0 ? `
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">图片</h3>
              <div class="grid grid-cols-2 gap-4">
                ${draft.images.map((img: any, index: number) => `
                  <div class="space-y-2">
                    <img src="${img.url}" alt="图片${index + 1}" class="w-full rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-600">${img.description || '图片描述'}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="text-sm text-gray-500 border-t pt-4">
            <p>创建时间：${new Date(draft.createdAt).toLocaleString()}</p>
            <p>更新时间：${new Date(draft.updatedAt).toLocaleString()}</p>
            ${(draft as any).wordCount ? `<p>字数：${(draft as any).wordCount} 字</p>` : ''}
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" onclick="this.closest('.fixed').remove()">
              关闭
            </button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="window.open('/create?draft=${draft.id}', '_blank')">
              编辑草稿
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // 点击背景关闭模态框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || draft.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发布管理</h1>
          <p className="text-gray-500 mt-1">
            管理和发布您的文章到各个平台
            {!loading && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({drafts.length} 个草稿)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <Link
            href="/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            新建文章
          </Link>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索文章标题..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 筛选 */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="pending_review">待审核</option>
                <option value="published">已发布</option>
                <option value="failed">发布失败</option>
              </select>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedArticles.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                已选择 {selectedArticles.length} 项
              </span>
              <button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                批量发布
              </button>
              <button
                onClick={() => {
                  if (confirm(`确定要删除选中的 ${selectedArticles.length} 个草稿吗？`)) {
                    if (typeof window !== 'undefined') {
                      selectedArticles.forEach((draftId) => {
                        try {
                          DraftManager.deleteDraft(draftId)
                        } catch (error) {
                          console.error('删除草稿出错:', error)
                        }
                      })
                      loadDrafts()
                      setSelectedArticles([])
                    }
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                批量删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 文章列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">加载草稿中...</span>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">暂无草稿</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'all'
                ? '没有找到符合条件的草稿'
                : '您还没有保存任何草稿'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                href="/create"
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建第一篇文章
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedArticles.length === filteredDrafts.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  字数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDrafts.map((draft) => {
                const StatusIcon = statusConfig[draft.status as keyof typeof statusConfig]?.icon || FileText
                return (
                  <tr key={draft.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(draft.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArticles([...selectedArticles, draft.id])
                          } else {
                            setSelectedArticles(selectedArticles.filter(id => id !== draft.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {draft.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {draft.content.substring(0, 100)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(statusConfig[draft.status as keyof typeof statusConfig]?.color) || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {(statusConfig[draft.status as keyof typeof statusConfig]?.label) || '草稿'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {(draft as any).wordCount || 0} 字
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <p>{new Date(draft.createdAt).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <p>{new Date(draft.updatedAt).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDraft(draft)}
                          className="text-gray-400 hover:text-gray-600"
                          title="查看草稿"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/create?draft=${draft.id}`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Link>
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdown(showDropdown === draft.id ? null : draft.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {showDropdown === draft.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => handlePublish(draft.id, 'xiaohongshu')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                disabled={publishingArticle === draft.id}
                              >
                                {publishingArticle === draft.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                发布到小红书
                              </button>
                              <button
                                onClick={() => handlePublish(draft.id, 'wechat')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                disabled={publishingArticle === draft.id}
                              >
                                {publishingArticle === draft.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                发布到公众号
                              </button>
                              <div className="border-t border-gray-200"></div>
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <Copy className="w-4 h-4 mr-2" />
                                复制文章
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                导出文章
                              </button>
                              <div className="border-t border-gray-200"></div>
                              <button
                                onClick={() => handleDeleteDraft(draft.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {!loading && filteredDrafts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredDrafts.length}</span> 条，
              共 <span className="font-medium">{filteredDrafts.length}</span> 条
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center" disabled>
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一页
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center" disabled>
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 公众号发布弹窗 */}
      {showWechatPublishModal && selectedDraft && (
        <WechatPublishModal
          isOpen={showWechatPublishModal}
          onClose={() => {
            setShowWechatPublishModal(false)
            setSelectedDraft(null)
          }}
          draft={selectedDraft}
          onSuccess={handleWechatPublishSuccess}
          onError={handleWechatPublishError}
        />
      )}
    </div>
  )
}

// 包装需要登录的页面
export default withAuth(function PublishPage() {
  return (
    <DashboardLayout>
      <PublishPageContent />
    </DashboardLayout>
  )
})