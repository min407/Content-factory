/**
 * 数据同步服务
 * 负责分析页面和创作页面之间的数据同步
 */

import { TopicInsight, TopicWithHistory } from '@/types/ai-analysis'

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 从分析页面获取最新的选题数据
 */
export function syncTopicsFromAnalysis(): TopicWithHistory[] {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return []
  }

  try {
    // 优先获取用户选中的选题
    const selectedTopicsData = localStorage.getItem('selected-topics')
    if (selectedTopicsData) {
      const selectedTopics = JSON.parse(selectedTopicsData)

      // 转换为带历史信息的选题
      let topics: TopicWithHistory[] = selectedTopics.map((topicData: any, index: number) => {
        const insight = topicData.insight || topicData // 兼容直接保存洞察数据的情况

        return {
          id: insight.id || `selected-${generateId()}-${index}`,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          tags: insight.tags || [],
          keywords: insight.keywords || [],
          createdAt: new Date(insight.timestamp || Date.now()),
          source: 'selected-analysis',
          sourceAnalysis: `selected-${insight.timestamp || Date.now()}`,
          // 添加洞察特有字段 - 安全访问
          decisionStage: insight.decisionStage,
          audienceScene: insight.audienceScene,
          demandPainPoint: insight.demandPainPoint,
          customFields: insight.customFields || {}
        }
      })

      // 只返回最近10个选题
      topics = topics
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)

      console.log(`从选中选题同步了 ${topics.length} 个选题（最多显示10个）`)
      return topics
    }

    // 如果没有选中选题，则回退到所有洞察（保持兼容性）
    const analysisData = localStorage.getItem('ai-analysis-results')
    if (!analysisData) {
      console.log('未找到分析数据和选中选题')
      return []
    }

    const parsed = JSON.parse(analysisData)
    const insights = parsed.insights || []

    // 转换为带历史信息的选题
    let topics: TopicWithHistory[] = insights.map((insight: TopicInsight, index: number) => ({
      ...insight,
      id: `topic-${generateId()}-${index}`,
      createdAt: new Date(parsed.analysisTime || Date.now()),
      sourceAnalysis: `analysis-${parsed.analysisTime || Date.now()}`
    }))

    // 只返回最近10个选题
    topics = topics
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)

    console.log(`从所有洞察同步了 ${topics.length} 个选题（最多显示10个）`)
    return topics
  } catch (error) {
    console.error('同步选题数据失败:', error)
    return []
  }
}

/**
 * 获取本地存储的选题历史（按时间倒序）
 */
export function getLocalTopicHistory(): TopicWithHistory[] {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const topicsData = localStorage.getItem('topic-history')
    if (!topicsData) return []

    const topics = JSON.parse(topicsData)

    // 修复日期反序列化问题
    let processedTopics = topics.map((topic: any) => ({
      ...topic,
      createdAt: new Date(topic.createdAt)
    }))

    // 按时间倒序排列并只保留最近10个
    processedTopics = processedTopics
      .sort((a: TopicWithHistory, b: TopicWithHistory) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      )
      .slice(0, 10)

    return processedTopics
  } catch (error) {
    console.error('获取选题历史失败:', error)
    return []
  }
}

/**
 * 保存选题到本地历史
 */
export function saveTopicsToLocal(topics: TopicWithHistory[]): void {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return
  }

  try {
    // 合并现有历史和新数据
    const existingTopics = getLocalTopicHistory()
    const allTopics = [...topics, ...existingTopics]

    // 去重（基于title和description）
    const uniqueTopics = allTopics.filter((topic, index, arr) =>
      arr.findIndex(t => t.title === topic.title && t.description === topic.description) === index
    )

    // 按时间倒序排列并只保留最近10个
    const sortedTopics = uniqueTopics
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)

    localStorage.setItem('topic-history', JSON.stringify(sortedTopics))
    console.log(`保存了 ${sortedTopics.length} 个选题到历史记录（最多保留10个）`)
  } catch (error) {
    console.error('保存选题历史失败:', error)
  }
}

/**
 * 合并同步数据和历史数据
 */
export function mergeTopicsWithHistory(): TopicWithHistory[] {
  const syncTopics = syncTopicsFromAnalysis()
  const historyTopics = getLocalTopicHistory()

  // 合并并去重
  const allTopics = [...syncTopics, ...historyTopics]
  const uniqueTopics = allTopics.filter((topic, index, arr) =>
    arr.findIndex(t => t.title === topic.title && t.description === topic.description) === index
  )

  // 按时间倒序排列并只保留最近10个
  const sortedTopics = uniqueTopics
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)

  // 保存合并后的数据
  saveTopicsToLocal(sortedTopics)

  return sortedTopics
}

/**
 * 设置实时数据同步监听器
 */
export function setupDataSyncListener(callback: (topics: TopicWithHistory[]) => void): () => void {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return () => {} // 返回空的清理函数
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'ai-analysis-results') {
      console.log('检测到分析页面数据更新，同步选题...')
      const mergedTopics = mergeTopicsWithHistory()
      callback(mergedTopics)
    }
  }

  // 监听storage事件
  window.addEventListener('storage', handleStorageChange)

  // 定期检查更新（每10秒，提高响应速度）
  const intervalId = setInterval(() => {
    const currentAnalysisData = localStorage.getItem('ai-analysis-results')
    if (currentAnalysisData) {
      try {
        const parsed = JSON.parse(currentAnalysisData)
        const lastSyncTime = localStorage.getItem('last-sync-time')

        // 如果有新的分析数据且距离上次同步超过1分钟，则重新同步
        if (!lastSyncTime || (parsed.analysisTime && parseInt(lastSyncTime) < parsed.analysisTime)) {
          console.log('定期检查发现新数据，开始同步...')
          const mergedTopics = mergeTopicsWithHistory()
          callback(mergedTopics)
          localStorage.setItem('last-sync-time', Date.now().toString())
        }
      } catch (error) {
        console.error('解析分析数据失败:', error)
      }
    }
  }, 10000)

  // 返回清理函数
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    clearInterval(intervalId)
  }
}

/**
 * 手动刷新选题数据
 */
export function refreshTopicsData(): TopicWithHistory[] {
  console.log('手动刷新选题数据...')

  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return []
  }

  // 强制更新同步时间戳
  localStorage.setItem('last-sync-time', Date.now().toString())

  // 重新合并数据（已包含限制10个的逻辑）
  const mergedTopics = mergeTopicsWithHistory()

  // 触发一个自定义事件来强制更新所有监听器
  window.dispatchEvent(new CustomEvent('topics-data-refreshed', {
    detail: { topics: mergedTopics, timestamp: Date.now() }
  }))

  console.log('手动刷新完成，返回', mergedTopics.length, '个选题（最多显示10个）')
  return mergedTopics
}

/**
 * 清理过期的选题历史（保留7天）
 */
export function cleanupExpiredTopics(): void {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return
  }

  try {
    const topics = getLocalTopicHistory()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const validTopics = topics.filter(topic =>
      new Date(topic.createdAt) > sevenDaysAgo
    )

    if (validTopics.length < topics.length) {
      localStorage.setItem('topic-history', JSON.stringify(validTopics))
      console.log(`清理了 ${topics.length - validTopics.length} 个过期选题`)
    }
  } catch (error) {
    console.error('清理过期选题失败:', error)
  }
}

/**
 * 获取最后同步时间
 */
export function getLastSyncTime(): Date | null {
  // 检查是否在客户端环境
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const lastSyncTime = localStorage.getItem('last-sync-time')
    return lastSyncTime ? new Date(parseInt(lastSyncTime)) : null
  } catch (error) {
    console.error('获取最后同步时间失败:', error)
    return null
  }
}

/**
 * 检查是否有新的分析数据
 */
export function hasNewAnalysisData(): boolean {
  try {
    const analysisData = localStorage.getItem('ai-analysis-results')
    if (!analysisData) return false

    const parsed = JSON.parse(analysisData)
    const lastSyncTime = getLastSyncTime()

    if (!lastSyncTime) return true

    return parsed.analysisTime ? parsed.analysisTime > lastSyncTime.getTime() : false
  } catch (error) {
    console.error('检查新分析数据失败:', error)
    return false
  }
}