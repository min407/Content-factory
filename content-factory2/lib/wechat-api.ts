import { WeChatArticleApiResponse, WeChatArticleSearchParams } from '@/types/wechat-api'
import { ApiConfigManager } from './api-config'
import { ApiProvider } from '@/types/api-config'

/**
 * 获取微信搜索API配置
 */
function getWechatSearchConfig() {
  const apiKey = ApiConfigManager.getApiKey(ApiProvider.WECHAT_SEARCH)
  const apiBase = ApiConfigManager.getApiBase(ApiProvider.WECHAT_SEARCH)

  if (!apiKey) {
    throw new Error('微信搜索API密钥未配置，请在设置中配置API密钥')
  }

  return {
    apiKey,
    apiBase: apiBase || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
  }
}

/**
 * 搜索公众号文章
 * @param params 搜索参数
 * @returns Promise<WeChatArticleApiResponse>
 */
export async function searchWeChatArticles(
  params: Omit<WeChatArticleSearchParams, 'key'>
): Promise<WeChatArticleApiResponse> {
  const config = getWechatSearchConfig()

  if (!config.apiKey) {
    throw new Error('微信搜索API密钥未配置，请在设置中配置API密钥')
  }

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

    return data
  } catch (error) {
    console.error('搜索公众号文章失败:', error)
    throw error
  }
}

/**
 * 批量搜索多页文章
 * @param keyword 关键词
 * @param totalPages 总页数
 * @returns Promise<WeChatArticleApiResponse[]>
 */
export async function searchMultiplePages(
  keyword: string,
  totalPages: number = 1
): Promise<WeChatArticleApiResponse[]> {
  const promises: Promise<WeChatArticleApiResponse>[] = []

  for (let page = 1; page <= totalPages; page++) {
    promises.push(
      searchWeChatArticles({
        kw: keyword,
        page,
      })
    )
  }

  return Promise.all(promises)
}
