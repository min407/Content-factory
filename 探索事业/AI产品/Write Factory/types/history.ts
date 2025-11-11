// 搜索历史记录类型定义
export interface SearchHistory {
  id: string
  keyword: string
  articleCount: number
  totalFound: number
  searchTime: number
  searchTimeStr: string
  stats: {
    totalArticles: number
    avgReads: number
    avgLikes: number
    avgEngagement: string
  }
  topLikesArticles: Array<{
    title: string
    likes: number
    reads: number
    engagement: string
  }>
  topEngagementArticles: Array<{
    title: string
    likes: number
    reads: number
    engagement: string
  }>
  insights: Array<{
    title: string
    description: string
    confidence: number
  }>
}