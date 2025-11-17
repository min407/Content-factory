import { WeChatArticleApiResponse, WeChatArticleSearchParams } from '@/types/wechat-api'
import { ApiProvider } from '@/types/api-config'

/**
 * 获取微信搜索API配置
 * @param userId 用户ID，如果未提供则使用默认用户
 */
async function getWechatSearchConfig(userId?: string): Promise<{ apiKey: string; apiBase: string }> {
  try {
    // 动态导入混合存储系统
    const { HybridUserConfigStorage } = await import('@/lib/data-storage-hybrid')

    // 使用提供的用户ID或默认用户ID
    const targetUserId = userId || 'user_1'

    console.log('🔍 [微信搜索API] 获取用户配置:', { userId: targetUserId })

    // 获取用户配置
    const configs = await HybridUserConfigStorage.getUserConfigs(targetUserId)

    console.log('📋 [微信搜索API] 获取到的配置数量:', configs.length)

    // 查找微信搜索配置
    const wechatSearchConfig = configs.find(config =>
      config.provider === 'wechat_search' ||
      config.name?.includes('微信搜索')
    )

    console.log('🔍 [微信搜索API] 查找到的微信搜索配置:', {
      found: !!wechatSearchConfig,
      provider: wechatSearchConfig?.provider,
      name: wechatSearchConfig?.name,
      hasApiKey: !!wechatSearchConfig?.apiKey,
      isConfigured: wechatSearchConfig?.isConfigured
    })

    if (!wechatSearchConfig || !wechatSearchConfig.apiKey) {
      throw new Error('微信搜索API密钥未配置，请在设置中配置API密钥')
    }

    return {
      apiKey: wechatSearchConfig.apiKey,
      apiBase: wechatSearchConfig.apiBase || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
    }
  } catch (error) {
    console.error('❌ [微信搜索API] 获取配置失败:', error)
    throw new Error('微信搜索API密钥未配置，请在设置中配置API密钥')
  }
}

/**
 * 搜索公众号文章
 * @param params 搜索参数
 * @param userId 用户ID，可选
 * @returns Promise<WeChatArticleApiResponse>
 */
export async function searchWeChatArticles(
  params: Omit<WeChatArticleSearchParams, 'key'>,
  userId?: string
): Promise<WeChatArticleApiResponse> {
  const config = await getWechatSearchConfig(userId)

  const requestBody: WeChatArticleSearchParams = {
    kw: params.kw,
    sort_type: params.sort_type || 1,
    mode: params.mode || 1,
    period: params.period || 7,
    page: params.page || 1,
    key: config.apiKey,
    any_kw: params.any_kw || '',
    ex_kw: params.ex_kw || '',
    verifycode: params.verifycode || '',
    type: params.type || 1,
  }

  try {
    console.log('🔍 [微信搜索API] 开始搜索文章:', {
      keyword: params.kw,
      page: params.page,
      apiBase: config.apiBase,
      userId: userId || 'default'
    })

    const response = await fetch(config.apiBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WeChatArticleApiResponse = await response.json()

    // 检查API返回的状态码（成功时code为0）
    if (data.code !== 0) {
      throw new Error(data.msg || 'API请求失败')
    }

    console.log('✅ [微信搜索API] 搜索成功，返回数据:', {
      total: data.data?.total || 0,
      currentCount: data.data?.list?.length || 0,
      userId: userId || 'default'
    })

    return data
  } catch (error) {
    console.error('❌ [微信搜索API] 搜索公众号文章失败:', error)
    throw error
  }
}

/**
 * 批量搜索多页文章
 * @param keyword 关键词
 * @param totalPages 总页数
 * @param userId 用户ID，可选
 * @returns Promise<WeChatArticleApiResponse[]>
 */
export async function searchMultiplePages(
  keyword: string,
  totalPages: number = 1,
  userId?: string
): Promise<WeChatArticleApiResponse[]> {
  console.log('📄 [微信搜索API] 开始批量搜索:', {
    keyword,
    totalPages,
    userId: userId || 'default'
  })

  const promises: Promise<WeChatArticleApiResponse>[] = []

  for (let page = 1; page <= totalPages; page++) {
    promises.push(
      searchWeChatArticles({
        kw: keyword,
        page,
      }, userId)
    )
  }

  try {
    const results = await Promise.all(promises)
    console.log('✅ [微信搜索API] 批量搜索完成，共', results.length, '页')
    return results
  } catch (error) {
    console.error('❌ [微信搜索API] 批量搜索失败:', error)
    throw error
  }
}
