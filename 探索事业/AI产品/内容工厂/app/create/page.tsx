'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PenTool,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronRight,
  RefreshCw,
  Save,
  Send,
  Eye,
  Wand2,
  Settings,
  Hash,
  Type,
  AlignLeft,
  Palette,
  Target,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  X,
  Edit3,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// 导入新的类型和服务
import { TopicWithHistory, GeneratedArticle } from '@/types/ai-analysis'
import {
  mergeTopicsWithHistory,
  refreshTopicsData,
  setupDataSyncListener,
  getLastSyncTime
} from '@/lib/data-sync'
import { HistoryManager, DraftManager } from '@/lib/content-management'
import { IMAGE_STYLES, IMAGE_RATIOS, COVER_TEMPLATES } from '@/lib/content-cache'

// 格式化时间
const formatTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) {
    return '未知时间'
  }

  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return dateObj.toLocaleDateString('zh-CN')
}

// 获取图片比例的 CSS aspect-ratio 值
const getAspectRatio = (ratio: string): string => {
  const ratioMap: Record<string, string> = {
    '1:1': '1/1',
    '4:3': '4/3',
    '16:9': '16/9',
    '3:4': '3/4',
    '9:16': '9/16'
  }
  return ratioMap[ratio] || '4/3'
}

export default function CreatePage() {
  const searchParams = useSearchParams()
  const draftId = searchParams?.get('draft')

  // 添加客户端渲染保护
  const [isMounted, setIsMounted] = useState(false)

  // 选题相关状态
  const [selectedSource, setSelectedSource] = useState<'insights' | 'custom'>('insights')
  const [selectedTopic, setSelectedTopic] = useState<TopicWithHistory | null>(null)
  const [topics, setTopics] = useState<TopicWithHistory[]>([])
  const [filteredTopics, setFilteredTopics] = useState<TopicWithHistory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)

  // 确保组件在客户端挂载后才执行相关代码
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 创作参数状态
  const [customTopic, setCustomTopic] = useState('')
  const [contentLength, setContentLength] = useState('800-1000')
  const [writingStyle, setWritingStyle] = useState('professional')
  const [imageCount, setImageCount] = useState('3')
  const [imageStyle, setImageStyle] = useState('auto')
  const [imageRatio, setImageRatio] = useState('4:3')

  // 批量创作状态
  const [batchCount, setBatchCount] = useState(1)
  const [enableBatch, setEnableBatch] = useState(false)

  // 生成和预览状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedArticles, setGeneratedArticles] = useState<GeneratedArticle[]>([])
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  // 错误和提示状态
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 历史记录状态
  const [showHistory, setShowHistory] = useState(false)
  const [historyRecords, setHistoryRecords] = useState<any[]>([])

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')

  // 复制状态
  const [copiedMarkdown, setCopiedMarkdown] = useState(false)

  // 封面相关状态
  const [showCoverPreview, setShowCoverPreview] = useState(false)
  const [regeneratingCover, setRegeneratingCover] = useState(false)

  // 加载草稿 - 只在客户端执行
  useEffect(() => {
    if (!isMounted || !draftId) return

    const loadDraft = async () => {
      setLoadingDraft(true)
      try {
        // 直接从localStorage获取草稿数据
        if (typeof window !== 'undefined') {
          const { DraftManager } = await import('@/lib/content-management')
          const draft = DraftManager.getDraft(draftId)

          if (draft) {
            // 将草稿转换为GeneratedArticle格式
            const article: GeneratedArticle = {
              id: draft.id,
              title: draft.title,
              content: draft.content,
              images: draft.images || [],
              wordCount: (draft as any).wordCount || 0,
              readingTime: (draft as any).readingTime || 0,
              topicId: draft.topicId,
              createdAt: new Date(draft.createdAt),
              parameters: (draft as any).parameters
            }

            // 加载草稿到生成状态
            setGeneratedArticles([article])
            setCurrentArticleIndex(0)
            setShowPreview(true)
            setSelectedSource('custom')
            setCustomTopic(draft.title)

            // 如果有保存的参数，恢复它们
            if ((draft as any).parameters) {
              const params = (draft as any).parameters
              if (params.length) setContentLength(params.length)
              if (params.style) setWritingStyle(params.style)
              if (params.imageCount) setImageCount(params.imageCount)
              if (params.imageStyle) setImageStyle(params.imageStyle)
              if (params.imageRatio) setImageRatio(params.imageRatio)
            }

            setSuccess('已加载草稿内容')
            setTimeout(() => setSuccess(null), 3000)
          } else {
            setError('草稿不存在')
            setTimeout(() => setError(null), 3000)
          }
        } else {
          setError('无法访问本地存储')
          setTimeout(() => setError(null), 3000)
        }
      } catch (error) {
        console.error('加载草稿出错:', error)
        setError('加载草稿出错')
        setTimeout(() => setError(null), 3000)
      } finally {
        setLoadingDraft(false)
      }
    }

    loadDraft()
  }, [isMounted, draftId])

  // 初始化数据同步 - 只在客户端执行
  useEffect(() => {
    if (!isMounted) return

    // 加载初始数据
    const initialTopics = mergeTopicsWithHistory()
    setTopics(initialTopics)
    setFilteredTopics(initialTopics)
    setLastSyncTime(getLastSyncTime())

    // 设置实时监听
    const cleanup = setupDataSyncListener((updatedTopics) => {
      setTopics(updatedTopics)
      setFilteredTopics(updatedTopics)
      setLastSyncTime(new Date())
      setSuccess('已同步最新选题数据')
      setTimeout(() => setSuccess(null), 3000)
    })

    // 监听手动刷新事件
    const handleRefreshEvent = (e: CustomEvent) => {
      console.log('收到手动刷新事件:', e.detail)
      setTopics(e.detail.topics)
      setLastSyncTime(new Date(e.detail.timestamp))
      setSuccess('选题数据已刷新')
      setTimeout(() => setSuccess(null), 3000)
    }

    window.addEventListener('topics-data-refreshed', handleRefreshEvent as EventListener)

    // 清理过期历史记录
    HistoryManager.cleanupHistory(7)

    return () => {
      cleanup()
      window.removeEventListener('topics-data-refreshed', handleRefreshEvent as EventListener)
    }
  }, [isMounted])

  // 恢复上次的创作状态 - 只在客户端执行
  useEffect(() => {
    if (!isMounted) return

    const restoreLastState = () => {
      try {
        if (typeof window !== 'undefined') {
          const lastState = localStorage.getItem('content-factory-last-state')
          if (lastState) {
            const state = JSON.parse(lastState)
            const isRecent = new Date().getTime() - new Date(state.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24小时内

            if (isRecent && !draftId) { // 只有在没有编辑草稿时才恢复状态
              if (state.customTopic) setCustomTopic(state.customTopic)
              if (state.contentLength) setContentLength(state.contentLength)
              if (state.writingStyle) setWritingStyle(state.writingStyle)
              if (state.imageCount) setImageCount(state.imageCount)
              if (state.imageStyle) setImageStyle(state.imageStyle)
              if (state.imageRatio) setImageRatio(state.imageRatio)
              if (state.batchCount) setBatchCount(state.batchCount)
              if (state.enableBatch !== undefined) setEnableBatch(state.enableBatch)
              if (state.generatedArticles) setGeneratedArticles(state.generatedArticles)
              if (state.currentArticleIndex !== undefined) setCurrentArticleIndex(state.currentArticleIndex)
              if (state.showPreview !== undefined) setShowPreview(state.showPreview)

              setSuccess('已恢复上次的创作状态')
              setTimeout(() => setSuccess(null), 3000)
            }
          }
        }
      } catch (error) {
        console.error('恢复创作状态失败:', error)
      }
    }

    restoreLastState()
  }, [isMounted, draftId])

  // 自动保存创作状态
  useEffect(() => {
    if (!isMounted) return

    const saveState = () => {
      try {
        if (typeof window !== 'undefined') {
          const state = {
            timestamp: new Date().toISOString(),
            customTopic,
            contentLength,
            writingStyle,
            imageCount,
            imageStyle,
            imageRatio,
            batchCount,
            enableBatch,
            generatedArticles,
            currentArticleIndex,
            showPreview
          }
          localStorage.setItem('content-factory-last-state', JSON.stringify(state))
        }
      } catch (error) {
        console.error('保存创作状态失败:', error)
      }
    }

    // 监听状态变化并保存
    const stateKeys = [
      customTopic, contentLength, writingStyle, imageCount, imageStyle, imageRatio,
      batchCount, enableBatch, generatedArticles, currentArticleIndex, showPreview
    ]

    // 防抖保存
    const timeoutId = setTimeout(saveState, 2000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isMounted, customTopic, contentLength, writingStyle, imageCount, imageStyle, imageRatio, batchCount, enableBatch, generatedArticles, currentArticleIndex, showPreview])

  // 筛选逻辑 - 根据选择的分类筛选选题
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredTopics(topics)
    } else {
      const filtered = topics.filter(topic =>
        topic.keywords?.category === selectedCategory
      )
      setFilteredTopics(filtered)
    }
  }, [topics, selectedCategory])

  // 获取所有可用的分类
  const availableCategories = Array.from(
    new Set(topics.map(topic => topic.keywords?.category).filter(Boolean))
  )

  // 手动刷新选题数据
  const handleRefreshTopics = useCallback(() => {
    setIsSyncing(true)
    setError(null)

    try {
      const refreshedTopics = refreshTopicsData()
      setTopics(refreshedTopics)
      setFilteredTopics(refreshedTopics)
      setLastSyncTime(new Date())
      setSuccess('选题数据已刷新')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('刷新选题数据失败')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // 选择选题
  const handleTopicSelect = useCallback((topic: TopicWithHistory) => {
    setSelectedTopic(topic)
    setError(null)
  }, [])

  // 清空选题选择
  const handleTopicClear = useCallback(() => {
    setSelectedTopic(null)
  }, [])

  // 生成文章
  const handleGenerate = useCallback(async () => {
    if (selectedSource === 'insights' && !selectedTopic) {
      setError('请选择一个选题')
      return
    }
    if (selectedSource === 'custom' && !customTopic.trim()) {
      setError('请输入自定义选题')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setError(null)
    setSuccess(null)

    try {
      const requestBody = {
        topic: selectedTopic!,
        length: contentLength,
        style: writingStyle,
        imageCount: parseInt(imageCount),
        imageStyle,
        imageRatio,
        isBatch: enableBatch && batchCount > 1,
        count: batchCount
      }

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '生成失败')
      }

      const result = await response.json()

      if (result.success) {
        const articles = Array.isArray(result.data) ? result.data : [result.data]
        setGeneratedArticles(articles)
        setSuccess(result.message || '文章生成成功')

        // 保存到历史记录（仅在客户端）
        if (typeof window !== 'undefined') {
          import('@/lib/content-management').then(({ HistoryManager }) => {
            articles.forEach((article: GeneratedArticle) => {
              HistoryManager.saveToHistory(article)
            })
          })

          // 清除保存的创作状态，因为已经成功生成
          localStorage.removeItem('content-factory-last-state')
        }

        setShowPreview(true)
        setCurrentArticleIndex(0)
      } else {
        throw new Error('生成返回失败结果')
      }

    } catch (error) {
      console.error('生成文章失败:', error)
      setError(error instanceof Error ? error.message : '生成文章失败')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }, [
    selectedSource,
    selectedTopic,
    customTopic,
    contentLength,
    writingStyle,
    imageCount,
    enableBatch,
    batchCount
  ])

  // 复制文章内容
  const handleCopy = useCallback(() => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    navigator.clipboard.writeText(currentArticle.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [generatedArticles, currentArticleIndex])

  // 复制Markdown格式
  const handleCopyMarkdown = useCallback(() => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    // 转换为Markdown格式
    const markdownContent = convertToMarkdown(currentArticle.title, currentArticle.content)

    navigator.clipboard.writeText(markdownContent)
    setCopiedMarkdown(true)
    setTimeout(() => setCopiedMarkdown(false), 2000)
  }, [generatedArticles, currentArticleIndex])

  // 将文章内容转换为Markdown格式
  const convertToMarkdown = (title: string, content: string): string => {
    // 处理标题
    let markdown = `# ${title}\n\n`

    // 分段处理内容
    const paragraphs = content.split('\n').filter(p => p.trim())

    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim()
      if (!trimmed) return

      // 处理标题
      if (trimmed.startsWith('##')) {
        const level = trimmed.match(/^#+/)?.[0].length || 2
        const text = trimmed.replace(/^#+\s*/, '')
        markdown += `${'#'.repeat(level)} ${text}\n\n`
      }
      // 处理列表项
      else if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map(item => item.replace(/^- /, '').trim())
        items.forEach(item => {
          if (item) markdown += `- ${item}\n`
        })
        markdown += '\n'
      }
      // 处理数字列表
      else if (/^\d+\.\s/.test(trimmed)) {
        markdown += `${trimmed}\n`
      }
      // 处理普通段落
      else {
        markdown += `${trimmed}\n\n`
      }
    })

    return markdown
  }

  // 优化的内容渲染函数
  const renderOptimizedContent = (content: string, images: any[]) => {
    const paragraphs = content.split('\n').filter(p => p.trim())
    const totalParagraphs = paragraphs.length
    const imagesCount = images.length
    const elements: JSX.Element[] = []

    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim()
      if (!trimmed) return

      // 处理标题
      if (trimmed.startsWith('##')) {
        const level = trimmed.match(/^#+/)?.[0].length || 2
        const text = trimmed.replace(/^#+\s*/, '')
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

        elements.push(
          <HeadingTag key={`h${index}`} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">
            {text}
          </HeadingTag>
        )
      }
      // 处理列表项
      else if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map(item => item.replace(/^- /, '').trim()).filter(Boolean)
        elements.push(
          <ul key={`ul${index}`} className="space-y-2 my-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            {items.map((item, i) => (
              <li key={i} className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )
      }
      // 处理数字列表
      else if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split('\n').filter(Boolean)
        elements.push(
          <ol key={`ol${index}`} className="space-y-2 my-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            {items.map((item, i) => (
              <li key={i} className="text-gray-700 leading-relaxed flex items-start">
                <span className="text-green-500 font-semibold mr-2">{i + 1}.</span>
                <span>{item.replace(/^\d+\.\s/, '')}</span>
              </li>
            ))}
          </ol>
        )
      }
      // 处理引用
      else if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '')
        elements.push(
          <blockquote key={`quote${index}`} className="border-l-4 border-orange-500 bg-orange-50 pl-4 py-2 my-6 italic text-gray-700">
            {quoteText}
          </blockquote>
        )
      }
      // 处理普通段落
      else {
        // 分割长段落为更短的句子
        const sentences = trimmed.split(/[。！？]/).filter(s => s.trim())

        if (sentences.length > 3) {
          // 长段落分成多个小段落
          const chunks = []
          for (let i = 0; i < sentences.length; i += 2) {
            chunks.push(sentences.slice(i, i + 2).join('。') + '。')
          }

          chunks.forEach((chunk, chunkIndex) => {
            elements.push(
              <p key={`p${index}_${chunkIndex}`} className="text-gray-700 leading-relaxed mb-4 text-justify">
                {chunk}
              </p>
            )
          })
        } else {
          elements.push(
            <p key={`p${index}`} className="text-gray-700 leading-relaxed mb-4 text-justify">
              {trimmed}
            </p>
          )
        }
      }

      // 智能插入图片
      if (imagesCount > 0) {
        // 在第2、4、6段后插入图片
        const insertPositions = [1, 3, 5]
        if (insertPositions.includes(index) && elements.length > 0) {
          const imageIndex = Math.min(Math.floor(index / 2), imagesCount - 1)
          if (imageIndex >= 0 && imageIndex < imagesCount) {
            const image = images[imageIndex]
            // 兼容不同的图片数据结构
            const imageUrl = image.url || image
            const imageDesc = image.description || `配图 ${imageIndex + 1}`

            elements.push(
              <div key={`img${index}`} className="my-8 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={imageDesc}
                  className="w-full h-auto"
                  style={{
                    aspectRatio: '16/9',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.warn('图片加载失败:', imageUrl)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => {
                    console.log('图片加载成功:', imageUrl)
                  }}
                />
                <div className="p-3 bg-gray-50 text-center">
                  <p className="text-sm text-gray-600 font-medium">
                    {imageDesc}
                  </p>
                </div>
              </div>
            )
          }
        }
      }
    })

    return elements
  }

  // 重新生成封面
  const handleRegenerateCover = useCallback(async () => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    setRegeneratingCover(true)
    try {
      // 调用API重新生成封面
      const response = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentArticle.title,
          content: currentArticle.content
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('封面生成响应:', result)

        const { cover } = result

        // 更新文章的封面
        const updatedArticles = [...generatedArticles]
        updatedArticles[currentArticleIndex] = {
          ...currentArticle,
          cover
        }
        console.log('更新后的文章封面:', updatedArticles[currentArticleIndex].cover)
        setGeneratedArticles(updatedArticles)

        setSuccess('封面已重新生成')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error('封面生成失败')
      }
    } catch (error) {
      console.error('重新生成封面失败:', error)
      setError('封面生成失败，请重试')
      setTimeout(() => setError(null), 3000)
    } finally {
      setRegeneratingCover(false)
    }
  }, [generatedArticles, currentArticleIndex])

  // 开始编辑
  const handleStartEdit = useCallback(() => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    setEditedTitle(currentArticle.title)
    setEditedContent(currentArticle.content)
    setIsEditing(true)
  }, [generatedArticles, currentArticleIndex])

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    const updatedArticles = [...generatedArticles]
    updatedArticles[currentArticleIndex] = {
      ...currentArticle,
      title: editedTitle,
      content: editedContent,
      wordCount: countWords(editedContent),
      readingTime: calculateReadingTime(editedContent)
    }

    setGeneratedArticles(updatedArticles)
    setIsEditing(false)
    setSuccess('文章已更新')
    setTimeout(() => setSuccess(null), 3000)
  }, [generatedArticles, currentArticleIndex, editedTitle, editedContent])

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
  }, [])

  // 保存到草稿
  const handleSave = useCallback(async () => {
    const currentArticle = generatedArticles[currentArticleIndex]
    if (!currentArticle) return

    try {
      // 增强草稿数据，确保包含所有必要信息
      const enhancedArticle = {
        ...currentArticle,
        // 确保包含创作参数
        parameters: {
          length: contentLength,
          style: writingStyle,
          imageCount: parseInt(imageCount),
          imageStyle,
          imageRatio,
          topic: selectedTopic || customTopic
        },
        // 更新字数和阅读时间
        wordCount: currentArticle.wordCount || countWords(currentArticle.content),
        readingTime: currentArticle.readingTime || calculateReadingTime(currentArticle.content)
      }

      await DraftManager.saveToDraft(enhancedArticle)
      setSuccess('文章已保存到草稿')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('保存草稿失败')
      setTimeout(() => setError(null), 3000)
    }
  }, [generatedArticles, currentArticleIndex, contentLength, writingStyle, imageCount, imageStyle, imageRatio, selectedTopic, customTopic])

  // 统计字数的辅助函数
  const countWords = (content: string): number => {
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
    return chineseChars + englishWords
  }

  // 计算阅读时间的辅助函数
  const calculateReadingTime = (content: string): number => {
    const wordCount = countWords(content)
    return Math.max(1, Math.ceil(wordCount / 500))
  }

  // 加载历史记录
  const loadHistory = () => {
    if (typeof window !== 'undefined') {
      try {
        const records = HistoryManager.getRecentHistory(30) // 获取最近30条记录
        setHistoryRecords(records)
        setShowHistory(true)
      } catch (error) {
        console.error('加载历史记录失败:', error)
        setError('加载历史记录失败')
        setTimeout(() => setError(null), 3000)
      }
    }
  }

  // 从历史记录恢复文章
  const restoreFromHistory = (record: any) => {
    setGeneratedArticles([record.article])
    setCurrentArticleIndex(0)
    setShowPreview(true)
    setShowHistory(false)

    // 恢复创作参数
    if (record.article.parameters) {
      const params = record.article.parameters
      if (params.length) setContentLength(params.length)
      if (params.style) setWritingStyle(params.style)
      if (params.imageCount) setImageCount(params.imageCount.toString())
      if (params.imageStyle) setImageStyle(params.imageStyle)
      if (params.imageRatio) setImageRatio(params.imageRatio)
    }

    setSuccess('已恢复历史文章')
    setTimeout(() => setSuccess(null), 3000)
  }

  // 切换文章（批量模式下）
  const handleSwitchArticle = useCallback((index: number) => {
    setCurrentArticleIndex(index)
    setCopied(false)
  }, [])

  
  // 如果组件还未在客户端挂载，显示loading状态避免hydration错误
  if (!isMounted) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">内容创作</h1>
          <p className="text-gray-500 mt-1">基于AI智能生成高质量文章，自动配图，支持批量创作</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-500">正在加载...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">内容创作</h1>
        <p className="text-gray-500 mt-1">基于AI智能生成高质量文章，自动配图，支持批量创作</p>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <X className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {loadingDraft && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Loader2 className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
          <span className="text-blue-700">正在加载草稿...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：创作设置 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 选题来源 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                选题来源
              </h2>
              {lastSyncTime && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  最后同步: {formatTime(lastSyncTime)}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="source"
                  value="insights"
                  checked={selectedSource === 'insights'}
                  onChange={(e) => setSelectedSource(e.target.value as 'insights' | 'custom')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium">从洞察报告选择</p>
                  <p className="text-sm text-gray-500">基于分析结果创作 ({filteredTopics.length}个可选)</p>
                </div>
                <button
                  onClick={handleRefreshTopics}
                  disabled={isSyncing}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  title="刷新选题"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </label>
              <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="source"
                  value="custom"
                  checked={selectedSource === 'custom'}
                  onChange={(e) => setSelectedSource(e.target.value as 'insights' | 'custom')}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">自定义输入</p>
                  <p className="text-sm text-gray-500">输入自己的选题</p>
                </div>
              </label>
            </div>
          </div>

          {/* 选题列表或自定义输入 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                {selectedSource === 'insights' ? '可用选题' : '自定义选题'}
              </h2>
              {selectedSource === 'insights' && selectedTopic && (
                <button
                  onClick={handleTopicClear}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清空选择
                </button>
              )}
            </div>
            {selectedSource === 'insights' ? (
              <>
                {/* 分类筛选器 */}
                {availableCategories.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Filter className="w-4 h-4 inline mr-1" />
                      关键词分类筛选
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">全部分类 ({topics.length})</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category} ({topics.filter(t => t.keywords?.category === category).length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredTopics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>暂无符合条件的选题</p>
                      <p className="text-xs mt-1">请尝试选择其他分类或重新生成洞察</p>
                    </div>
                  ) : (
                    filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTopic?.id === topic.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-4 h-4 rounded-full border-2 mt-0.5 mr-3 flex-shrink-0">
                          {selectedTopic?.id === topic.id && (
                            <div className="w-full h-full rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{topic.title}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{topic.description}</p>
                          <div className="flex items-center mt-2 text-xs">
                            <span className="text-blue-600 font-medium">重要指数 {topic.confidence}%</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-gray-500">{formatTime(topic.createdAt)}</span>
                          </div>
                          {/* 三维度分析标签 */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {topic.decisionStage.stage}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {topic.audienceScene.audience}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              {topic.audienceScene.scene}
                            </span>
                            {topic.keywords?.category && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                {topic.keywords.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="请输入您的选题内容..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            )}
          </div>

          {/* 创作参数 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-500" />
              创作参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlignLeft className="w-4 h-4 inline mr-1" />
                  文章长度
                </label>
                <select
                  value={contentLength}
                  onChange={(e) => setContentLength(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="500">500字以内</option>
                  <option value="500-800">500-800字</option>
                  <option value="800-1200">800-1200字</option>
                  <option value="1000-1500">1000-1500字</option>
                  <option value="1500-2000">1500-2000字</option>
                  <option value="2000+">2000字以上</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  写作风格
                </label>
                <select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="professional">专业严谨</option>
                  <option value="casual">轻松活泼</option>
                  <option value="storytelling">故事叙述</option>
                  <option value="educational">教育科普</option>
                  <option value="emotional">情感共鸣</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  图片数量
                </label>
                <select
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">不插入图片</option>
                  <option value="1">1张</option>
                  <option value="2">2张</option>
                  <option value="3">3张</option>
                  <option value="5">5张</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  图片风格
                </label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {IMAGE_STYLES.find(style => style.value === imageStyle)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Settings className="w-4 h-4 inline mr-1" />
                  图片比例
                </label>
                <select
                  value={imageRatio}
                  onChange={(e) => setImageRatio(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {IMAGE_RATIOS.map((ratio) => (
                    <option key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {IMAGE_RATIOS.find(ratio => ratio.value === imageRatio)?.description}
                </p>
              </div>

              {/* 批量创作选项 */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBatch}
                      onChange={(e) => setEnableBatch(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">批量创作</span>
                  </label>
                  {enableBatch && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Beta
                    </span>
                  )}
                </div>

                {enableBatch && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      创作数量
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setBatchCount(1)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          batchCount === 1
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        1篇
                      </button>
                      <button
                        onClick={() => setBatchCount(3)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          batchCount === 3
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        3篇
                      </button>
                      <button
                        onClick={() => setBatchCount(5)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          batchCount === 5
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        5篇
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={batchCount}
                        onChange={(e) => setBatchCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="自定义"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      批量创作会基于不同角度生成多篇文章，建议不超过5篇
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 历史记录 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  历史记录
                </h2>
                <button
                  onClick={loadHistory}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  查看
                </button>
              </div>
              <p className="text-sm text-gray-500">
                查看最近生成的文章，支持恢复内容和创作参数
              </p>
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (selectedSource === 'insights' ? !selectedTopic : !customTopic.trim())}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {enableBatch ? `批量生成中...` : '生成中...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  {enableBatch ? `开始批量创作 (${batchCount}篇)` : '开始创作'}
                </>
              )}
            </button>

            {/* 生成进度 */}
            {isGenerating && enableBatch && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>生成进度</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  正在生成第 {Math.ceil(generationProgress / 100 * batchCount)} 篇文章...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 h-full">
            {!showPreview && !isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无内容</h3>
                <p className="text-gray-500 max-w-sm">
                  选择选题并设置参数后，点击"开始创作"生成文章
                </p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full p-12">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                  {enableBatch ? 'AI正在批量创作中' : 'AI正在创作中'}
                </h3>
                <p className="text-gray-500">请稍候，正在为您生成优质内容...</p>
                <div className="mt-6 space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    分析选题要点...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    生成文章大纲...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    撰写正文内容...
                  </p>
                  <p className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    插入相关图片...
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* 批量创作时显示文章切换器 */}
                {generatedArticles.length > 1 && (
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        批量创作结果 ({generatedArticles.length}篇)
                      </h3>
                      <div className="flex items-center space-x-2">
                        {generatedArticles.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => handleSwitchArticle(index)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              currentArticleIndex === index
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            第{index + 1}篇
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 预览头部 */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {generatedArticles.length > 1 ? `文章预览 (${currentArticleIndex + 1}/${generatedArticles.length})` : '文章预览'}
                    </h3>
                    {generatedArticles[currentArticleIndex] && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Type className="w-4 h-4" />
                        <span>{generatedArticles[currentArticleIndex].wordCount}字</span>
                        <span className="text-gray-300">•</span>
                        <BookOpen className="w-4 h-4" />
                        <span>约{generatedArticles[currentArticleIndex].readingTime}分钟</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setShowCoverPreview(true)}
                          className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 flex items-center"
                          title="预览封面"
                        >
                          <ImageIcon className="w-4 h-4 mr-1.5" />
                          封面
                        </button>
                        <button
                          onClick={handleStartEdit}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          编辑
                        </button>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                            title="复制纯文本"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-1.5 text-green-500" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1.5" />
                                复制
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCopyMarkdown}
                            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center"
                            title="复制Markdown格式"
                          >
                            {copiedMarkdown ? (
                              <>
                                <Check className="w-4 h-4 mr-1.5 text-green-500" />
                                MD已复制
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4 mr-1.5" />
                                复制MD
                              </>
                            )}
                          </button>
                        </div>
                        <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
                          <RefreshCw className="w-4 h-4 mr-1.5" />
                          重新生成
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1.5" />
                          保存草稿
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          保存编辑
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center"
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          取消编辑
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 预览内容 */}
                {generatedArticles[currentArticleIndex] && (
                  <>
                    <div className="flex-1 overflow-y-auto p-6">
                      {!isEditing ? (
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">
                          {generatedArticles[currentArticleIndex].title}
                        </h1>
                      ) : (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            文章标题
                          </label>
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl font-bold"
                            placeholder="请输入文章标题"
                          />
                        </div>
                      )}

                      {!isEditing ? (
                        <div className="prose prose-lg max-w-none">
                          {renderOptimizedContent(generatedArticles[currentArticleIndex].content, generatedArticles[currentArticleIndex].images)}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              正文内容
                            </label>
                            <textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[400px] text-gray-700 leading-relaxed"
                              placeholder="请输入正文内容，段落之间用空行分隔"
                              style={{ resize: 'vertical' }}
                            />
                            <div className="mt-2 text-sm text-gray-500">
                              <span>字数：{countWords(editedContent)} 字</span>
                              <span className="ml-4">预计阅读时间：{calculateReadingTime(editedContent)} 分钟</span>
                            </div>
                          </div>

                          {/* 编辑提示 */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">编辑提示</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                  <ul className="list-disc space-y-1">
                                    <li>段落之间请用空行分隔</li>
                                    <li>标题可以使用 ## 开头表示二级标题</li>
                                    <li>列表项可以使用 - 开头</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 预览底部操作 */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        生成时间：{new Date(generatedArticles[currentArticleIndex].createdAt).toLocaleString('zh-CN')}
                        {isEditing && (
                          <span className="ml-2 text-blue-600 font-medium">
                            编辑模式
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {!isEditing && (
                          <Link
                            href="/publish"
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            发布管理
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 历史记录弹窗 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">历史创作记录</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {historyRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 flex-1 mr-4">{record.article.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{record.article.wordCount}字</span>
                          <span>•</span>
                          <span>{formatTime(new Date(record.createdAt))}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{record.article.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {record.article.parameters?.style && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {record.article.parameters.style}
                            </span>
                          )}
                          {record.article.parameters?.imageCount > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {record.article.parameters.imageCount}张图片
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => restoreFromHistory(record)}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          恢复文章
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 封面预览模态框 */}
      {showCoverPreview && generatedArticles[currentArticleIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-pink-500" />
                公众号封面预览
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRegenerateCover}
                  disabled={regeneratingCover}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {regeneratingCover ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新生成
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCoverPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 封面预览内容 */}
            <div className="p-6 space-y-6">
              {/* 公众号封面预览区域 */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-2xl">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">公众号文章封面预览</h3>
                    <p className="text-xs text-gray-500 text-center">2.35:1 标准公众号封面比例</p>
                  </div>

                  {/* 封面图片容器 */}
                  <div className="relative bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '2.35/1' }}>
                    {(() => {
                      const article = generatedArticles[currentArticleIndex]
                      console.log('封面预览检查:', {
                        hasArticle: !!article,
                        hasCover: !!article?.cover,
                        coverUrl: article?.cover?.url?.substring(0, 100) + '...'
                      })
                      return article?.cover
                    })() ? (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${generatedArticles[currentArticleIndex].cover.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                        role="img"
                        aria-label="公众号封面"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">暂无封面图片</p>
                          <p className="text-sm text-gray-500 mt-1">点击"重新生成"创建专属封面</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 封面信息 */}
                  {generatedArticles[currentArticleIndex].cover && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">封面标题：</span>
                          <span className="text-gray-900 font-medium ml-2">
                            {generatedArticles[currentArticleIndex].cover.title}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">生成时间：</span>
                          <span className="text-gray-700 ml-2">
                            {formatTime(generatedArticles[currentArticleIndex].cover.generatedAt)}
                          </span>
                        </div>
                        {generatedArticles[currentArticleIndex].cover.template && (
                          <div>
                            <span className="text-gray-500">使用模板：</span>
                            <span className="text-gray-700 ml-2">
                              {COVER_TEMPLATES.find(t => t.id === generatedArticles[currentArticleIndex].cover.template)?.name || '智能选择'}
                            </span>
                          </div>
                        )}
                        {generatedArticles[currentArticleIndex].cover.description && (
                          <div className="col-span-2">
                            <span className="text-gray-500">封面描述：</span>
                            <span className="text-gray-700 ml-2">
                              {generatedArticles[currentArticleIndex].cover.description}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 分割线 */}
              <div className="border-t border-gray-200"></div>

              {/* 文章信息预览 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">文章信息</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">文章标题</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {generatedArticles[currentArticleIndex].title}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">字数统计</label>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {generatedArticles[currentArticleIndex].wordCount}
                      </p>
                      <p className="text-sm text-gray-500">字</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">配图数量</label>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {generatedArticles[currentArticleIndex].images.length}
                      </p>
                      <p className="text-sm text-gray-500">张</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">阅读时间</label>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {generatedArticles[currentArticleIndex].readingTime}
                      </p>
                      <p className="text-sm text-gray-500">分钟</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={() => {
                    if (generatedArticles[currentArticleIndex].cover) {
                      // 下载封面图片
                      const link = document.createElement('a')
                      link.href = generatedArticles[currentArticleIndex].cover.url
                      link.download = `公众号封面-${generatedArticles[currentArticleIndex].title}.jpg`
                      link.click()
                    }
                  }}
                  disabled={!generatedArticles[currentArticleIndex].cover}
                  className="px-6 py-3 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载封面
                </button>
                <button
                  onClick={() => {
                    setShowCoverPreview(false)
                    // 滚动到文章预览区域
                    document.getElementById('article-preview')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-6 py-3 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  查看文章
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}