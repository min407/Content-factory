import {
  WechatAccount,
  WechatAccountsResponse,
  WechatPublishResponse,
  PublishParams,
  PublishResult
} from '@/types/wechat-publish'

// API配置
const API_BASE = 'https://wx.limyai.com/api/openapi'
const API_KEY = 'xhs_ece2ac77bf86495442d51095ac9ffcc1'

/**
 * 获取公众号列表
 * @returns Promise<WechatAccount[]>
 */
export async function getWechatAccounts(): Promise<WechatAccount[]> {
  try {
    const response = await fetch(`${API_BASE}/wechat-accounts`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WechatAccountsResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || '获取公众号列表失败')
    }

    return data.data.accounts
  } catch (error) {
    console.error('获取公众号列表失败:', error)
    throw error
  }
}

/**
 * 发布文章到公众号
 * @param params 发布参数
 * @returns Promise<PublishResult>
 */
export async function publishToWechat(params: PublishParams): Promise<PublishResult> {
  try {
    const response = await fetch(`${API_BASE}/wechat-publish`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WechatPublishResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || '发布失败')
    }

    if (!data.data) {
      throw new Error('发布响应数据异常')
    }

    return data.data
  } catch (error) {
    console.error('发布文章失败:', error)
    throw error
  }
}

/**
 * 获取发布状态（轮询用）
 * @param publicationId 发布ID
 * @returns Promise<PublishResult>
 */
export async function getPublishStatus(publicationId: string): Promise<PublishResult> {
  try {
    const response = await fetch(`${API_BASE}/wechat-publish/status`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicationId })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WechatPublishResponse = await response.json()

    if (!data.success) {
      throw new Error(data.error || '获取发布状态失败')
    }

    if (!data.data) {
      throw new Error('状态响应数据异常')
    }

    return data.data
  } catch (error) {
    console.error('获取发布状态失败:', error)
    throw error
  }
}

/**
 * 验证发布参数
 * @param params 发布参数
 * @returns 验证结果
 */
export function validatePublishParams(params: PublishParams): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!params.wechatAppid) {
    errors.push('请选择要发布的公众号')
  }

  if (!params.title || params.title.trim().length === 0) {
    errors.push('文章标题不能为空')
  }

  if (params.title && params.title.length > 64) {
    errors.push('文章标题不能超过64个字符')
  }

  if (!params.content || params.content.trim().length === 0) {
    errors.push('文章内容不能为空')
  }

  if (params.summary && params.summary.length > 120) {
    errors.push('文章摘要不能超过120个字符')
  }

  // 小绿书特殊验证
  if (params.articleType === 'newspic') {
    // 检查是否包含图片
    const imageRegex = /!\[.*?\]\(.*?\)/g
    const images = params.content.match(imageRegex) || []

    if (images.length === 0) {
      errors.push('小绿书发布必须包含至少1张图片')
    }

    if (images.length > 20) {
      errors.push('小绿书发布最多支持20张图片')
    }

    // 检查文字长度（移除图片标记后的纯文本）
    const plainText = params.content.replace(imageRegex, '').trim()
    if (plainText.length > 1000) {
      errors.push('小绿书文字内容不能超过1000个字符')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 格式化发布参数
 * @param draft 草稿数据
 * @param wechatAppid 公众号AppID
 * @param articleType 文章类型
 * @returns 格式化后的发布参数
 */
export function formatPublishParams(
  draft: any,
  wechatAppid: string,
  articleType: 'news' | 'newspic'
): PublishParams {
  const params: PublishParams = {
    wechatAppid,
    title: draft.title,
    content: draft.content,
    articleType,
    contentFormat: 'markdown'
  }

  // 添加摘要（如果没有提供，使用内容前100字符）
  if (!params.summary && draft.content) {
    const plainText = draft.content
      .replace(/[#*`>]/g, '') // 移除markdown符号
      .replace(/\n+/g, ' ') // 换行符转为空格
      .trim()

    params.summary = plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '')
  }

  // 设置封面图（使用第一张图片）
  if (!params.coverImage && draft.images && draft.images.length > 0) {
    params.coverImage = draft.images[0].url || draft.images[0]
  }

  // 设置作者（可选）
  if (draft.author) {
    params.author = draft.author
  }

  return params
}