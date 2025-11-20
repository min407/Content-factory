import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET - 根据选题关键词搜索相关文章
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400 }
      )
    }

    const db = getDb()

    // 搜索历史记录中包含关键词的文章
    const stmt = db.prepare(`
      SELECT
        id,
        keyword,
        platform,
        timestamp,
        result_count as resultCount,
        articles_data as articlesData,
        created_at as createdAt
      FROM search_history
      WHERE (
        keyword LIKE ? OR
        articles_data LIKE ? OR
        api_response LIKE ?
      )
      AND platform = 'wechat'
      ORDER BY timestamp DESC
      LIMIT ?
    `)

    const searchPattern = `%${keyword}%`
    const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit)

    // 解析文章数据并提取相关文章
    let allArticles: any[] = []

    rows.forEach((row: any) => {
      try {
        const articlesData = row.articlesData ? JSON.parse(row.articlesData) : null
        if (articlesData && Array.isArray(articlesData)) {
          // 过滤出与关键词相关的文章
          const relatedArticles = articlesData.filter((article: any) => {
            const title = (article.title || '').toLowerCase()
            const summary = (article.summary || '').toLowerCase()
            const searchLower = keyword.toLowerCase()

            return title.includes(searchLower) ||
                   summary.includes(searchLower) ||
                   article.digest?.toLowerCase().includes(searchLower) ||
                   article.content?.toLowerCase().includes(searchLower)
          })

          // 为每篇文章添加搜索信息
          relatedArticles.forEach((article: any) => {
            allArticles.push({
              ...article,
              searchKeyword: row.keyword,
              searchTimestamp: row.timestamp,
              searchId: row.id
            })
          })
        }
      } catch (error) {
        console.error('解析文章数据失败:', error)
      }
    })

    // 去重并按阅读量排序
    const uniqueArticles = allArticles.filter((article, index, self) =>
      index === self.findIndex((a) => a.title === article.title)
    )

    const sortedArticles = uniqueArticles.sort((a, b) => {
      const readsA = parseInt(a.reads || '0')
      const readsB = parseInt(b.reads || '0')
      return readsB - readsA
    })

    return NextResponse.json({
      success: true,
      articles: sortedArticles.slice(0, limit), // 限制返回数量
      total: sortedArticles.length,
      keyword: keyword
    })

  } catch (error) {
    console.error('搜索相关文章失败:', error)
    return NextResponse.json(
      {
        error: '搜索相关文章失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}