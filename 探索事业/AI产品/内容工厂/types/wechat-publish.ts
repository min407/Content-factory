// 公众号发布相关类型定义

export interface WechatAccount {
  /** 公众号名称 */
  name: string
  /** 公众号AppID */
  wechatAppid: string
  /** 公众号原始ID */
  username: string
  /** 公众号头像URL */
  avatar: string
  /** 公众号类型 */
  type: 'subscription' | 'service'
  /** 是否认证 */
  verified: boolean
  /** 状态 */
  status: 'active' | 'revoked'
  /** 最后授权时间 */
  lastAuthTime: string
  /** 创建时间 */
  createdAt: string
}

export interface PublishParams {
  /** 公众号AppID */
  wechatAppid: string
  /** 文章标题 */
  title: string
  /** 文章内容 */
  content: string
  /** 文章摘要 */
  summary?: string
  /** 封面图URL */
  coverImage?: string
  /** 作者名称 */
  author?: string
  /** 内容格式 */
  contentFormat?: 'markdown' | 'html'
  /** 文章类型 */
  articleType: 'news' | 'newspic'
}

export interface PublishResult {
  /** 发布ID */
  publicationId: string
  /** 素材ID */
  materialId: string
  /** 微信媒体ID */
  mediaId: string
  /** 发布状态 */
  status: 'published' | 'pending' | 'failed'
  /** 消息 */
  message: string
  /** 错误信息（如果有） */
  error?: string
  /** 错误码（如果有） */
  errorCode?: string
}

export interface WechatAccountsResponse {
  success: boolean
  data: {
    accounts: WechatAccount[]
    total: number
  }
}

export interface WechatPublishResponse {
  success: boolean
  data?: PublishResult
  error?: string
  code?: string
  message?: string
}

// 发布状态枚举
export const PublishStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const

export type PublishStatusType = typeof PublishStatus[keyof typeof PublishStatus]

// 文章类型配置
export const ArticleTypeConfig = {
  news: {
    label: '公众号文章',
    description: '支持Markdown和HTML格式，适合长文发布'
  },
  newspic: {
    label: '小绿书（图文）',
    description: '以图片为主，纯文本描述，最多1000字'
  }
} as const