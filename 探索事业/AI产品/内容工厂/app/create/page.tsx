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
  Download,
  ChevronDown
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

  // 爆文选择相关状态
  const [showArticleSelection, setShowArticleSelection] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [selectedArticles, setSelectedArticles] = useState<any[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [creationMode, setCreationMode] = useState<'original' | 'reference'>('original')
  const [originalInspiration, setOriginalInspiration] = useState('')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

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
    // 清空之前的选择状态
    setShowArticleSelection(false)
    setSelectedArticles([])
    setRelatedArticles([])
  }, [])

  // 清空选题选择
  const handleTopicClear = useCallback(() => {
    setSelectedTopic(null)
    setShowArticleSelection(false)
    setSelectedArticles([])
    setRelatedArticles([])
  }, [])

  // 获取相关爆文
  const fetchRelatedArticles = useCallback(async (topic: TopicWithHistory) => {
    setLoadingArticles(true)
    try {
      // 直接从localStorage获取AI分析结果
      const analysisResults = localStorage.getItem('ai-analysis-results')
      if (analysisResults) {
        const analysisData = JSON.parse(analysisResults)
        console.log('完整分析数据结构:', {
          summariesCount: analysisData.summaries?.length || 0,
          insightsCount: analysisData.insights?.length || 0,
          articlesCount: analysisData.articles?.length || 0,
          hasStats: !!analysisData.stats,
          analysisTime: new Date(analysisData.analysisTime || 0).toLocaleString()
        })

        console.log('当前选择的选题:', topic.title)
        console.log('选题详情:', topic)

        // 优先使用articles数据，如果没有则使用summaries
        let articlesToSearch = analysisData.articles || []

        // 如果没有articles，尝试从summaries转换
        if (articlesToSearch.length === 0 && analysisData.summaries) {
          articlesToSearch = analysisData.summaries.map((summary: any) => ({
            title: summary.title,
            summary: summary.summary || summary.description || '',
            reads: summary.reads || summary.read || 0,
            likes: summary.likes || summary.praise || 0,
            url: summary.url || '',
            content: summary.content || ''
          }))
          console.log('从summaries转换得到articles:', articlesToSearch.length)
        }

        // 标准化数据字段名，确保数据一致性
        articlesToSearch = articlesToSearch.map((article: any) => ({
          ...article,
          reads: article.reads || article.read || 0,
          likes: article.likes || article.praise || 0,
          summary: article.summary || article.description || article.content || '',
          engagementRate: article.engagementRate || (
            article.read > 0 ? ((article.praise || article.likes || 0) / article.read * 100).toFixed(1) + '%' : '0%'
          )
        }))

        console.log('用于搜索的文章总数:', articlesToSearch.length)

        if (articlesToSearch.length === 0) {
          console.warn('没有可用的文章数据进行搜索')
          setRelatedArticles([])
          return
        }

        // 分析选题标题，提取关键词
        const topicKeywords = topic.title.toLowerCase()
          .split(/[，。！？；：\s、]+/)
          .filter(keyword => keyword.length > 1)
          .flatMap(keyword => {
            // 进一步分解长词汇为更小的关键词
            return keyword.split(/[\s\-_:]+/).filter(k => k.length > 1)
          })

        // 添加一些同义词和相关词汇
        const expandedKeywords = [...topicKeywords]

        // 根据选题内容添加相关词汇
        if (topic.title.includes('副业')) {
          expandedKeywords.push('赚钱', '收入', '兼职', '创业', '项目')
        }
        if (topic.title.includes('职场') || topic.title.includes('新人')) {
          expandedKeywords.push('工作', '职场', '新人', '初入职场', '小白')
        }
        if (topic.title.includes('选择') || topic.title.includes('指南')) {
          expandedKeywords.push('指南', '教程', '方法', '技巧', '经验')
        }

        console.log('原始关键词:', topicKeywords)
        console.log('扩展关键词:', expandedKeywords)

        // 根据关键词匹配相关文章，增强匹配逻辑
        const related = articlesToSearch.filter((article: any, index: number) => {
          const articleTitle = (article.title || '').toLowerCase()
          const articleSummary = (article.summary || article.description || '').toLowerCase()
          const articleDigest = (article.digest || '').toLowerCase()
          const articleContent = (article.content || '').toLowerCase()

          // 组合文章文本进行匹配
          const articleText = `${articleTitle} ${articleSummary} ${articleDigest} ${articleContent}`

          // 检查是否包含扩展关键词
          const hasKeywordMatch = expandedKeywords.some((keyword: string) => {
            return articleText.includes(keyword)
          })

          // 如果选题有description，也进行匹配
          const topicDesc = topic.description?.toLowerCase() || ''
          const hasDescMatch = topicDesc.length > 0 &&
            expandedKeywords.some((keyword: string) => {
              return articleText.includes(keyword) || topicDesc.includes(keyword)
            })

          const isMatch = hasKeywordMatch || hasDescMatch

          // 添加关键词匹配详情用于调试
          const matchedKeywords = expandedKeywords.filter(keyword =>
            articleText.includes(keyword)
          )

          if (index < 5) {
            console.log(`文章 ${index + 1}: "${articleTitle}" - 匹配: ${isMatch}, 匹配关键词: [${matchedKeywords.join(', ')}]`)
          }

          return isMatch
        }).map((article: any) => {
          // 计算相关性分数
          let score = 0
          const articleTitle = (article.title || '').toLowerCase()
          const articleSummary = (article.summary || article.description || '').toLowerCase()

          expandedKeywords.forEach((keyword: string) => {
            if (articleTitle.includes(keyword)) score += 3 // 标题匹配权重高
            if (articleSummary.includes(keyword)) score += 2 // 摘要匹配权重中
          })

          return {
            ...article,
            relevanceScore: score
          }
        })
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore) // 按相关性排序
        .slice(0, 8) // 限制最多8篇相关文章

        console.log('筛选后的相关文章数量:', related.length)
        console.log('相关文章详情:', related.map((a: any) => ({
          title: a.title,
          score: a.relevanceScore,
          reads: a.reads || 0,
          likes: a.likes || 0
        })))

        setRelatedArticles(related)

        if (related.length === 0) {
          console.warn('未找到相关文章，详细调试信息：')
          console.warn('- 原始关键词:', topicKeywords)
          console.warn('- 扩展关键词:', expandedKeywords)
          console.warn('- 可搜索文章数:', articlesToSearch.length)
          console.warn('- 前3篇文章标题:', articlesToSearch.slice(0, 3).map((a: any) => a.title))
          console.warn('- 文章内容预览:', articlesToSearch.slice(0, 3).map((a: any) => ({
            title: a.title,
            summary: (a.summary || a.description || '').substring(0, 50) + '...'
          })))
        }
      } else {
        console.warn('未找到AI分析结果，请先进行选题分析')
        setRelatedArticles([])

        // 显示提示信息
        alert('请先前往"选题分析"页面进行分析，然后再选择选题')
      }
    } catch (error) {
      console.error('获取相关爆文失败:', error)
      setRelatedArticles([])
    } finally {
      setLoadingArticles(false)
    }
  }, [])

  // 切换爆文选择状态
  const toggleArticleSelection = useCallback(() => {
    if (!showArticleSelection && selectedTopic) {
      fetchRelatedArticles(selectedTopic)
    }
    setShowArticleSelection(!showArticleSelection)
  }, [showArticleSelection, selectedTopic, fetchRelatedArticles])

  // 选择/取消选择爆文
  const toggleArticleSelect = useCallback((article: any) => {
    setSelectedArticles(prev => {
      const isSelected = prev.some(a => a.title === article.title)
      if (isSelected) {
        return prev.filter(a => a.title !== article.title)
      } else {
        return [...prev, article]
      }
    })
  }, [])

  // 切换原文显示
  const toggleArticleContent = useCallback((articleTitle: string) => {
    setExpandedArticle(prev => prev === articleTitle ? null : articleTitle)
  }, [])

  // 提取文章关键要点
  const extractKeyPoints = useCallback((content: string) => {
    if (!content) return []

    // 简单的关键要点提取逻辑
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 5).map(s => s.trim()) // 取前5个较长句子作为关键要点
  }, [])

  // 分析写作风格
  const analyzeWritingStyle = useCallback((content: string) => {
    if (!content) return 'unknown'

    const textLength = content.length
    const sentences = content.split(/[。！？]/).length
    const avgSentenceLength = textLength / sentences

    // 简单的写作风格分析
    if (avgSentenceLength > 50) return 'professional' // 专业学术风格
    if (avgSentenceLength > 30) return 'narrative'    // 叙述风格
    return 'conversational'                          // 对话风格
  }, [])

  // 分析内容结构
  const analyzeContentStructure = useCallback((content: string) => {
    if (!content) return { hasIntroduction: false, hasBody: false, hasConclusion: false }

    const paragraphs = content.split('\n').filter(p => p.trim().length > 0)
    const hasIntroduction = paragraphs.length > 0 && paragraphs[0].length < 200
    const hasBody = paragraphs.length > 2
    const hasConclusion = paragraphs.length > 0 &&
      (paragraphs[paragraphs.length - 1].includes('总结') ||
       paragraphs[paragraphs.length - 1].includes('总之') ||
       paragraphs[paragraphs.length - 1].includes('结语'))

    return { hasIntroduction, hasBody, hasConclusion }
  }, [])

  // 确定创作策略
  const determineCreationStrategy = useCallback((topic: any, articles: any[]) => {
    if (articles.length === 0) return 'original'

    const avgReads = articles.reduce((sum, a) => sum + (a.reads || 0), 0) / articles.length
    const avgLikes = articles.reduce((sum, a) => sum + (a.likes || 0), 0) / articles.length

    // 根据爆文数据确定创作策略
    if (avgReads > 10000 && avgLikes > 500) {
      return 'viral_adaptation' // 爆文改编策略
    } else if (articles.length >= 3) {
      return 'multi_reference'    // 多参考资料策略
    } else {
      return 'single_reference'   // 单一参考策略
    }
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

    // 构建增强的二创分析数据
    const enhancedAnalysisData = {
      topic: selectedTopic || { title: customTopic, description: '' },
      referenceArticles: selectedArticles.map(article => ({
        title: article.title,
        summary: article.summary,
        content: article.content,
        keyPoints: extractKeyPoints(article.content), // 提取关键要点
        engagementMetrics: {
          reads: article.reads,
          likes: article.likes,
          engagementRate: article.engagementRate
        },
        writingStyle: analyzeWritingStyle(article.content), // 分析写作风格
        structure: analyzeContentStructure(article.content) // 分析内容结构
      })),
      creationStrategy: determineCreationStrategy(selectedTopic, selectedArticles)
    }

    // 验证创作模式要求
    if (creationMode === 'original' && !originalInspiration.trim()) {
      setError('原创模式请输入原创灵感内容')
      return
    }
    if (creationMode === 'reference' && selectedArticles.length === 0) {
      setError('对标模式请选择至少一篇对标文章')
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
        creationMode,
        originalInspiration: creationMode === 'original' ? originalInspiration : undefined,
        referenceArticles: creationMode === 'reference' ? selectedArticles : [],
        isBatch: enableBatch && batchCount > 1,
        count: batchCount,
        // 增强的二创分析数据
        enhancedAnalysis: creationMode === 'reference' ? enhancedAnalysisData : null
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
    // 首先清理内容，移除多余的空行和Markdown符号
    const cleanContent = content
      .split('\n')
      .map(line => line.trim())
      .filter((line, index, arr) =>
        line.length > 0 || (index > 0 && index < arr.length - 1 && arr[index - 1].length > 0 && arr[index + 1].length > 0)
      )
      .join('\n')

    const paragraphs = cleanContent.split('\n').filter(p => p.trim())
    const imagesCount = images.length
    const elements: React.ReactNode[] = []

    // 用于跟踪图片插入位置
    let imageInsertIndex = 0

    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim()
      if (!trimmed) return

      // 处理标题
      if (trimmed.startsWith('##')) {
        const level = trimmed.match(/^#+/)?.[0].length || 2
        const text = trimmed.replace(/^#+\s*/, '')

        elements.push(
          <h3
            key={`h${index}`}
            className="text-xl font-bold text-gray-900 mt-8 mb-4 leading-relaxed"
          >
            {text}
          </h3>
        )
      }
      // 处理无序列表 - 转换为普通段落，移除星号和减号
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s*/, '').trim()

        elements.push(
          <p
            key={`li${index}`}
            className="text-gray-700 leading-relaxed mb-4 pl-4"
            style={{ borderLeft: '2px solid #666' }}
          >
            • {itemText}
          </p>
        )
      }
      // 处理有序列表 - 保持编号
      else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)$/)
        if (match) {
          elements.push(
            <p
              key={`oli${index}`}
              className="text-gray-700 leading-relaxed mb-4 font-medium"
            >
              {match[1]}. {match[2]}
            </p>
          )
        }
      }
      // 处理引用 - 简化为引用格式
      else if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '').trim()

        elements.push(
          <div
            key={`quote${index}`}
            className="my-6 py-3 px-4 border-l-3 border-gray-400 bg-gray-50 text-gray-600 italic"
          >
            {quoteText}
          </div>
        )
      }
      // 处理普通段落
      else {
        // 清理内容中的Markdown格式符号
        let cleanText = trimmed
          .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
          .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
          .replace(/`(.*?)`/g, '$1') // 移除行内代码标记

        elements.push(
          <p
            key={`p${index}`}
            className="text-gray-800 leading-relaxed mb-5 text-base"
            style={{ textIndent: '2em' }}
          >
            {cleanText}
          </p>
        )
      }

      // 在合适的段落位置插入图片
      if (imagesCount > 0 && imageInsertIndex < imagesCount) {
        // 在第2、4、6段落后插入图片（使用0-based索引）
        const insertAfterParagraphs = [1, 3, 5]

        if (insertAfterParagraphs.includes(index % 6)) {
          const image = images[imageInsertIndex]
          const imageUrl = image.url || image
          const imageDesc = image.description || ''

          elements.push(
            <div key={`img${imageInsertIndex}`} className="my-8 text-center">
              <img
                src={imageUrl}
                alt={imageDesc}
                className="max-w-full h-auto mx-auto rounded"
                style={{
                  maxHeight: '400px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onError={(e) => {
                  console.warn('图片加载失败:', imageUrl)
                  const target = e.currentTarget
                  target.style.display = 'none'
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="text-gray-500 text-sm py-4">
                        [图片加载失败]
                      </div>
                    `
                  }
                }}
              />
              {imageDesc && (
                <p className="text-sm text-gray-600 mt-2 text-center italic">
                  {imageDesc}
                </p>
              )}
            </div>
          )
          imageInsertIndex++
        }
      }
    })

    return <>{elements}</>
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

      await DraftManager.saveToDraft(enhancedArticle as any)
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
                            {topic.decisionStage?.stage && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                {topic.decisionStage.stage}
                              </span>
                            )}
                            {topic.audienceScene?.audience && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {topic.audienceScene.audience}
                              </span>
                            )}
                            {topic.audienceScene?.scene && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                {topic.audienceScene.scene}
                              </span>
                            )}
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

          {/* 爆文选择功能 - 优化版 */}
          {selectedSource === 'insights' && selectedTopic && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 shadow-lg">
              {/* 标题区域 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">对标爆文选择</h2>
                    <p className="text-sm text-gray-600 mt-0.5">选择优质爆文，AI将学习其爆点进行创作</p>
                  </div>
                </div>
                <button
                  onClick={toggleArticleSelection}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center ${
                    showArticleSelection
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-200'
                  }`}
                >
                  {showArticleSelection ? '收起选择' : '展开选择'}
                  <ChevronDown className={`w-4 h-4 ml-1.5 transform transition-transform duration-200 ${showArticleSelection ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* 展开的内容区域 */}
              {showArticleSelection && (
                <div className="space-y-5">
                  {/* 加载状态 */}
                  {loadingArticles && (
                    <div className="text-center py-12 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-orange-500" />
                        </div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">正在分析爆文数据</h3>
                      <p className="text-sm text-gray-600">基于选题智能匹配相关爆文，请稍候...</p>
                      <div className="mt-4 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center justify-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                          分析选题关键词...
                        </p>
                        <p className="flex items-center justify-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                          匹配相关爆文...
                        </p>
                        <p className="flex items-center justify-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                          计算内容相关性...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 空状态 */}
                  {!loadingArticles && relatedArticles.length === 0 && (
                    <div className="text-center py-12 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无相关爆文</h3>
                      <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                        当前选题没有找到相关的爆文数据。请确保：
                      </p>
                      <div className="text-left max-w-md mx-auto mb-6 space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm text-gray-600">已进行选题分析并获得文章数据</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm text-gray-600">选题标题与分析内容相关</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm text-gray-600">分析结果中包含相关文章</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                          href="/analysis"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          前往分析页面
                        </Link>
                        <button
                          onClick={() => fetchRelatedArticles(selectedTopic!)}
                          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          重新匹配
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 文章列表 */}
                  {!loadingArticles && relatedArticles.length > 0 && (
                    <>
                      {/* 统计信息 */}
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                              <span className="text-lg font-bold text-orange-600">{relatedArticles.length}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">找到相关爆文</p>
                              <p className="text-sm text-gray-600">基于选题「{selectedTopic.title}」智能匹配</p>
                            </div>
                          </div>
                          {selectedArticles.length > 0 && (
                            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium text-sm">
                              已选择 {selectedArticles.length} 篇
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 文章卡片列表 */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {relatedArticles.map((article, index) => (
                          <div
                            key={index}
                            onClick={() => toggleArticleSelect(article)}
                            className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedArticles.some(a => a.title === article.title)
                                ? 'border-gradient-to-r from-orange-500 to-red-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg transform scale-[1.02]'
                                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md hover:transform hover:scale-[1.01]'
                            }`}
                          >
                            {/* 选中标记 */}
                            <div className="absolute top-3 right-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedArticles.some(a => a.title === article.title)
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300 group-hover:border-orange-400'
                              }`}>
                                {selectedArticles.some(a => a.title === article.title) && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>

                            <div className="pr-8">
                              {/* 文章标题 */}
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-700 transition-colors">
                                {article.title}
                              </h3>

                              {/* 文章摘要 */}
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                                {article.summary}
                              </p>

                              {/* 数据指标 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center text-orange-600">
                                    <span className="text-lg mr-1">🔥</span>
                                    <span className="font-semibold text-sm">
                                      {article.reads?.toLocaleString() || 'N/A'}
                                    </span>
                                    <span className="text-xs ml-1">阅读</span>
                                  </div>
                                  <div className="flex items-center text-green-600">
                                    <span className="text-lg mr-1">👍</span>
                                    <span className="font-semibold text-sm">
                                      {article.likes?.toLocaleString() || 'N/A'}
                                    </span>
                                    <span className="text-xs ml-1">点赞</span>
                                  </div>
                                  {article.engagementRate && (
                                    <div className="flex items-center text-blue-600">
                                      <span className="text-lg mr-1">📊</span>
                                      <span className="font-semibold text-sm">
                                        {article.engagementRate}
                                      </span>
                                      <span className="text-xs ml-1">互动</span>
                                    </div>
                                  )}
                                </div>

                                {/* 选择提示和操作按钮 */}
                                <div className="flex items-center justify-between">
                                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    selectedArticles.some(a => a.title === article.title)
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-700'
                                  }`}>
                                    {selectedArticles.some(a => a.title === article.title) ? '已选择' : '点击选择'}
                                  </div>

                                  {/* 查看原文按钮 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleArticleContent(article.title)
                                    }}
                                    className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                                      expandedArticle === article.title
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700'
                                    }`}
                                  >
                                    {expandedArticle === article.title ? '收起原文' : '查看原文'}
                                  </button>
                                </div>
                              </div>

                            {/* 原文内容展开区域 */}
                            {expandedArticle === article.title && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">原文内容</h4>
                                <div className="text-xs text-gray-600 leading-relaxed max-h-60 overflow-y-auto">
                                  {article.content ? (
                                    <div className="whitespace-pre-wrap break-words">
                                      {article.content}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 italic">
                                      暂无原文内容
                                    </div>
                                  )}
                                </div>
                                {article.url && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      <span>🔗 查看原文链接</span>
                                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 选择总结 */}
                      {selectedArticles.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <Check className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-1">
                                已选择 {selectedArticles.length} 篇优质爆文
                              </h4>
                              <p className="text-sm text-blue-700 leading-relaxed">
                                AI将深度分析这些爆文的标题技巧、内容结构、情感爆点和用户互动模式，
                                为您创作出更具吸引力和传播力的优质内容
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 操作提示 */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500">
                          💡 提示：选择1-3篇爆文效果最佳，太多选择可能会影响创作方向
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

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

              {/* 创作模式选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  创作模式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCreationMode('reference')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      creationMode === 'reference'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <Copy className="w-5 h-5 mb-1" />
                      <span className="font-medium">对标创作</span>
                      <span className="text-xs mt-1">参考爆文二创改写</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCreationMode('original')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      creationMode === 'original'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <Lightbulb className="w-5 h-5 mb-1" />
                      <span className="font-medium">原创创作</span>
                      <span className="text-xs mt-1">基于灵感深度创作</span>
                    </div>
                  </button>
                </div>

                {/* 原创灵感输入 */}
                {creationMode === 'original' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Edit3 className="w-4 h-4 inline mr-1" />
                      原创灵感
                    </label>
                    <textarea
                      value={originalInspiration}
                      onChange={(e) => setOriginalInspiration(e.target.value)}
                      placeholder="请输入您的原创灵感、观点和想法..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      AI将基于您的原创灵感进行深度创作，融入您的独特观点和思考
                    </p>
                  </div>
                )}

                {/* 对标模式提示 */}
                {creationMode === 'reference' && selectedSource === 'insights' && selectedTopic && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>对标模式</strong>：AI将重点分析选题洞察和您选择的爆文，吸收其爆点和优质内容，进行二次创作改写
                      {selectedArticles.length > 0 && (
                        <span className="block mt-1">已选择 {selectedArticles.length} 篇对标文章作为参考</span>
                      )}
                    </p>
                  </div>
                )}
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
                          backgroundImage: `url(${generatedArticles[currentArticleIndex]?.cover?.url || ''})`,
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
                              {COVER_TEMPLATES.find(t => t.id === generatedArticles[currentArticleIndex]?.cover?.template)?.name || '智能选择'}
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