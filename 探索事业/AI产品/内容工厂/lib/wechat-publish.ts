import {
  WechatAccount,
  WechatAccountsResponse,
  WechatPublishResponse,
  PublishParams,
  PublishResult
} from '@/types/wechat-publish'
import { ApiProvider } from '@/types/api-config'

/**
 * 获取微信发布API配置
 * @param userId 用户ID，如果未提供则使用默认用户
 */
export async function getWechatPublishConfig(userId?: string): Promise<{ apiKey: string; apiBase: string }> {
  try {
    // 动态导入混合存储系统
    const { HybridUserConfigStorage } = await import('@/lib/data-storage-hybrid')

    // 使用提供的用户ID或默认用户ID
    const targetUserId = userId || 'user_1'

    console.log('🔍 [微信发布API] 获取用户配置:', { userId: targetUserId })

    // 获取用户配置
    const configs = await HybridUserConfigStorage.getUserConfigs(targetUserId)

    console.log('📋 [微信发布API] 获取到的配置数量:', configs.length)

    // 查找微信发布配置
    const wechatPublishConfig = configs.find(config =>
      config.provider === 'wechat_publish' ||
      config.name?.includes('微信发布') ||
      config.name?.includes('微信公众号发布')
    )

    console.log('🔍 [微信发布API] 查找到的微信发布配置:', {
      found: !!wechatPublishConfig,
      provider: wechatPublishConfig?.provider,
      name: wechatPublishConfig?.name,
      hasApiKey: !!wechatPublishConfig?.apiKey,
      isConfigured: wechatPublishConfig?.isConfigured
    })

    if (!wechatPublishConfig || !wechatPublishConfig.apiKey) {
      // 如果没有找到配置，使用默认配置（向后兼容）
      console.log('⚠️ [微信发布API] 未找到用户配置，使用默认配置')
      return {
        apiKey: 'xhs_ece2ac77bf86495442d51095ac9ffcc1',
        apiBase: 'https://wx.limyai.com/api/openapi'
      }
    }

    return {
      apiKey: wechatPublishConfig.apiKey,
      apiBase: wechatPublishConfig.apiBase || 'https://wx.limyai.com/api/openapi'
    }
  } catch (error) {
    console.error('❌ [微信发布API] 获取配置失败:', error)
    // 出错时使用默认配置
    return {
      apiKey: 'xhs_ece2ac77bf86495442d51095ac9ffcc1',
      apiBase: 'https://wx.limyai.com/api/openapi'
    }
  }
}

/**
 * 获取公众号列表
 * @param userId 用户ID，可选
 * @returns Promise<WechatAccount[]>
 */
export async function getWechatAccounts(userId?: string): Promise<WechatAccount[]> {
  const config = await getWechatPublishConfig(userId)

  try {
    console.log('📡 [微信发布API] 获取公众号列表...', {
      apiBase: config.apiBase,
      userId: userId || 'default'
    })

    const response = await fetch(`${config.apiBase}/wechat-accounts`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WechatAccountsResponse = await response.json()

    if (!data.success) {
      throw new Error('获取公众号列表失败')
    }

    console.log('✅ [微信发布API] 获取公众号列表成功:', {
      count: data.data.accounts.length,
      userId: userId || 'default'
    })

    return data.data.accounts
  } catch (error) {
    console.error('❌ [微信发布API] 获取公众号列表失败:', error)
    throw error
  }
}

/**
 * 发布文章到公众号
 * @param params 发布参数
 * @param userId 用户ID，可选
 * @returns Promise<PublishResult>
 */
export async function publishToWechat(params: PublishParams, userId?: string): Promise<PublishResult> {
  const config = await getWechatPublishConfig(userId)

  try {
    console.log('📤 [微信发布API] 开始发布文章...', {
      draftId: params.draftId,
      wechatAppid: params.wechatAppid,
      articleType: params.articleType,
      userId: userId || 'default'
    })

    const response = await fetch(`${config.apiBase}/wechat-publish`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
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

    console.log('✅ [微信发布API] 文章发布成功:', {
      publicationId: data.data.publicationId,
      status: data.data.status,
      userId: userId || 'default'
    })

    return data.data
  } catch (error) {
    console.error('❌ [微信发布API] 发布文章失败:', error)
    throw error
  }
}

/**
 * 获取发布状态（轮询用）
 * @param publicationId 发布ID
 * @param userId 用户ID，可选
 * @returns Promise<PublishResult>
 */
export async function getPublishStatus(publicationId: string, userId?: string): Promise<PublishResult> {
  const config = await getWechatPublishConfig(userId)

  try {
    const response = await fetch(`${config.apiBase}/wechat-publish/status`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
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