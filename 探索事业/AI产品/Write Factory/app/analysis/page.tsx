'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Search,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageSquare,
  BarChart3,
  Loader2,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
  Target,
  Award,
  Zap,
  Hash,
  Clock,
  PenTool,
  AlertCircle,
  Settings,
  ExternalLink,
  History,
  Trash2,
  ChevronDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { fetchArticles, formatArticlesForAnalysis, analyzeArticles } from '@/lib/api'
import { saveSearchHistory, getSearchHistory, clearSearchHistory } from '@/lib/history'

// 阅读量分布的固定数据，用于图表展示
const chartData = [
  { name: '0-1k', value: 12 },
  { name: '1k-5k', value: 34 },
  { name: '5k-10k', value: 45 },
  { name: '10k-20k', value: 38 },
  { name: '20k+', value: 27 },
]

export default function AnalysisPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [keyword, setKeyword] = useState('')

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [articleCount, setArticleCount] = useState<string | number>(1)
  const [customCount, setCustomCount] = useState('')
  const [formattedData, setFormattedData] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)

  // 加载搜索历史
  useEffect(() => {
    const loadHistory = () => {
      const history = getSearchHistory()
      setSearchHistory(history)
    }
    loadHistory()
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHistoryDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.history-dropdown')) {
          setShowHistoryDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistoryDropdown])

  const handleAnalysis = async () => {
    if (!keyword.trim()) return

    // 检查API Key是否配置
    if (!user?.apiKey) {
      setError('请先在设置中配置您的API Key')
      return
    }

    setIsAnalyzing(true)
    setProgress(0)
    setShowResult(false)
    setError(null)
    setAnalysisResult(null)
    setFormattedData([])

    try {
      // 模拟分析进度
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // 确定要采集的文章数量
      let finalCount: number
      if (articleCount === 'custom') {
        finalCount = parseInt(customCount) || 5
      } else {
        finalCount = parseInt(String(articleCount)) || 1
      }

      // 调用API获取文章数据
      const response = await fetchArticles({
        kw: keyword.trim(),
        period: 7,  // 获取7天内的文章
        sort_type: 1,  // 按最新排序
        mode: 1,  // 精确匹配
      })

      clearInterval(progressInterval)

      // 调试输出：打印API返回的完整数据结构
      console.log('API完整返回数据:', response)
      console.log('数据结构检查:', {
        hasData: !!response.data,
        dataLength: response.data?.length,
        dataType: typeof response.data,
        sampleItem: response.data?.[0]
      })

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // 根据选择的数量截取文章数据
        const limitedData = response.data.slice(0, finalCount)
        console.log(`截取前${finalCount}篇文章数据:`, limitedData.length)

        // 先格式化文章数据，再进行分析
        const formattedDataResult = formatArticlesForAnalysis(limitedData)
        console.log('格式化后的文章数据:', formattedDataResult)
        setFormattedData(formattedDataResult)

        const analysisData = analyzeArticles(formattedDataResult)
        console.log('分析结果:', analysisData)
        setAnalysisResult(analysisData)

        // 保存搜索历史
        saveSearchHistory(analysisData, keyword.trim(), finalCount, response.total || 0)

        // 更新历史记录状态
        const updatedHistory = getSearchHistory()
        setSearchHistory(updatedHistory)

        // 完成进度
        setProgress(100)
        setTimeout(() => {
          setIsAnalyzing(false)
          setShowResult(true)
        }, 500)
      } else {
        console.error('数据检查失败:', {
          response,
          hasData: !!response.data,
          isArray: Array.isArray(response.data),
          length: response.data?.length
        })
        throw new Error('未找到相关文章，请尝试其他关键词')
      }
    } catch (err) {
      console.error('分析失败:', err)
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试')
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  // 如果未登录，显示加载状态
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
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">选题分析</h1>
          <p className="text-gray-500 mt-1">输入关键词，AI智能分析公众号文章，生成选题洞察报告</p>
        </div>
        <div className="relative history-dropdown">
          <button
            onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">历史记录</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* 历史记录下拉菜单 */}
          {showHistoryDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">搜索历史</h3>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('确定要清空所有历史记录吗？')) {
                          clearSearchHistory()
                          setSearchHistory([])
                          setShowHistoryDropdown(false)
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      清空
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchHistory.length > 0 ? (
                  searchHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer"
                      onClick={() => {
                        setKeyword(item.keyword)
                        setArticleCount(item.articleCount)
                        setShowHistoryDropdown(false)
                        // 可以选择自动开始分析
                        // handleAnalysis()
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">{item.keyword}</h4>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {item.articleCount}篇
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 space-x-3">
                            <span>{item.searchTimeStr}</span>
                            <span>找到 {item.totalFound.toLocaleString()} 篇</span>
                          </div>
                          {item.stats.totalArticles > 0 && (
                            <div className="flex items-center mt-2 text-xs text-gray-600 space-x-3">
                              <span>均阅: {(item.stats.avgReads || 0).toLocaleString()}</span>
                              <span>均赞: {(item.stats.avgLikes || 0).toLocaleString()}</span>
                              <span>互动率: {item.stats.avgEngagement || '0%'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">暂无搜索历史</p>
                    <p className="text-xs mt-1">开始搜索后历史记录会显示在这里</p>
                  </div>
                )}
              </div>
              {searchHistory.length > 10 && (
                <div className="p-3 border-t border-gray-100 text-center">
                  <button
                    onClick={() => {
                      setShowHistoryDropdown(false)
                      setShowHistory(true)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    查看全部 {searchHistory.length} 条记录
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="space-y-4">
          {/* 关键词输入 */}
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入关键词，如：营销、内容运营、私域流量..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalysis()}
                />
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>热门关键词：</span>
                {['AI创作', '私域运营', '内容营销', '用户增长'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setKeyword(tag)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAnalysis}
              disabled={!keyword || isAnalyzing}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 flex-shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>开始分析</span>
                </>
              )}
            </button>
          </div>

          {/* 文章数量选择 */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">采集数量：</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setArticleCount(1);
                  setCustomCount('');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1篇
              </button>
              <button
                onClick={() => {
                  setArticleCount(5);
                  setCustomCount('');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 5
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                5篇
              </button>
              <button
                onClick={() => {
                  setArticleCount(10);
                  setCustomCount('');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 10
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                10篇
              </button>
              <button
                onClick={() => {
                  setArticleCount(20);
                  setCustomCount('');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 20
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                20篇
              </button>
              <button
                onClick={() => {
                  setArticleCount(50);
                  setCustomCount('');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 50
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                50篇
              </button>
              <button
                onClick={() => setArticleCount('custom')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  articleCount === 'custom'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                自定义
              </button>
              {articleCount === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                    placeholder="输入数量"
                    min="1"
                    max="100"
                    className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">篇</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {articleCount === 'custom'
                ? `将采集 ${customCount || 5} 篇文章`
                : `将采集 ${articleCount} 篇文章`
              }
            </div>
          </div>
        </div>
      </div>

      {/* 分析进度 */}
      {isAnalyzing && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">分析进度</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className={`flex items-center text-sm ${progress >= 20 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${progress >= 20 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {progress >= 20 && <span className="text-white text-xs">✓</span>}
              </div>
              正在获取公众号文章...
            </div>
            <div className={`flex items-center text-sm ${progress >= 50 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${progress >= 50 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {progress >= 50 && <span className="text-white text-xs">✓</span>}
              </div>
              AI分析文章内容...
            </div>
            <div className={`flex items-center text-sm ${progress >= 80 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${progress >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {progress >= 80 && <span className="text-white text-xs">✓</span>}
              </div>
              生成选题洞察...
            </div>
            <div className={`flex items-center text-sm ${progress >= 100 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full mr-2 flex items-center justify-center ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}>
                {progress >= 100 && <span className="text-white text-xs">✓</span>}
              </div>
              报告生成完成
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">分析失败</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {showResult && analysisResult && (
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">分析文章数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analysisResult.stats?.totalArticles || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">平均阅读量</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{(analysisResult.stats?.avgReads || 0).toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">平均点赞数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{(analysisResult.stats?.avgLikes || 0).toLocaleString()}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">平均互动率</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analysisResult.stats?.avgEngagement || '0%'}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 点赞TOP5 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  点赞量TOP5
                </h2>
              </div>
              <div className="space-y-3">
                {analysisResult.topLikesArticles.length > 0 ? (
                  analysisResult.topLikesArticles.map((article: any, index: number) => {
                    // 获取原始文章数据中的链接
                    const originalArticle = formattedData.find(a => a.title === article.title);
                    const articleUrl = originalArticle?.url || originalArticle?.shortLink;

                    return (
                      <div key={index} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                <span className="text-lg font-bold text-yellow-500 mr-2 flex-shrink-0">#{index + 1}</span>
                                <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{article.title}</h3>
                              </div>
                              {articleUrl && (
                                <a
                                  href={articleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                                  title="查看原文"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {(article.reads || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Heart className="w-4 h-4 mr-1 text-red-500" />
                                {(article.likes || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                                {article.engagement || '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无数据</p>
                )}
              </div>
            </div>

            {/* 互动率TOP5 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" />
                  互动率TOP5
                </h2>
              </div>
              <div className="space-y-3">
                {analysisResult.topEngagementArticles.length > 0 ? (
                  analysisResult.topEngagementArticles.map((article: any, index: number) => {
                    // 获取原始文章数据中的链接
                    const originalArticle = formattedData.find(a => a.title === article.title);
                    const articleUrl = originalArticle?.url || originalArticle?.shortLink;

                    return (
                      <div key={index} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                <span className="text-lg font-bold text-purple-500 mr-2 flex-shrink-0">#{index + 1}</span>
                                <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{article.title}</h3>
                              </div>
                              {articleUrl && (
                                <a
                                  href={articleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                                  title="查看原文"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {(article.reads || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Heart className="w-4 h-4 mr-1 text-red-500" />
                                {(article.likes || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center text-purple-600 font-semibold">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {article.engagement || '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无数据</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 高频词云 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Hash className="w-5 h-5 mr-2 text-blue-500" />
                  高频词云
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.wordCloud.length > 0 ? (
                  analysisResult.wordCloud.map((item: any, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                      style={{ fontSize: `${10 + item.size / 4}px` }}
                    >
                      {item.word}
                      <span className="ml-1 text-xs opacity-60">({item.count})</span>
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">暂无数据</p>
                )}
              </div>
            </div>

            {/* 阅读量分布 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
                  阅读量分布
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 时间分布 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  发布时间分布
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { time: '08:00-10:00', percent: 85, count: 23 },
                  { time: '10:00-12:00', percent: 65, count: 18 },
                  { time: '14:00-16:00', percent: 45, count: 12 },
                  { time: '18:00-20:00', percent: 92, count: 25 },
                  { time: '20:00-22:00', percent: 78, count: 21 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">{item.time}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 选题洞察 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                选题洞察
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => console.log('分析结果数据:', analysisResult)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新生成
                </button>
                <button
                  onClick={() => {
                    if (analysisResult) {
                      console.table(analysisResult.topLikesArticles.slice(0, 3));
                      console.table(analysisResult.wordCloud.slice(0, 10));
                    }
                  }}
                  className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
                >
                  <Target className="w-4 h-4 mr-2" />
                  查看数据
                </button>
                <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  下载报告
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.insights.length > 0 ? (
                analysisResult.insights.map((insight: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                        <div className="mt-2 flex items-center">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 mr-2">置信度：</span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <span className="ml-2 font-semibold text-blue-600">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  暂无洞察数据
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleAnalysis}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                重新分析
              </button>
              <Link href="/create" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center">
                <PenTool className="w-5 h-5 mr-2" />
                基于洞察创作
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}