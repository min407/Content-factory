// API响应类型定义
export interface ArticleSearchResponse {
  code: number;
  cost_money: number;
  cut_words: string;
  data: ArticleData[];
  data_number: number;
  msg: string;
  page: number;
  remain_money: number;
  total: number;
  total_page: number;
  [property: string]: any;
}

export interface ArticleData {
  /**
   * 封面
   */
  avatar: string;
  /**
   * 分类
   */
  classify: string;
  /**
   * 正文
   */
  content: string;
  /**
   * 原始id
   */
  ghid: string;
  /**
   * 发布地址
   */
  ip_wording: string;
  /**
   * 是否原创
   */
  is_original: number;
  /**
   * 再看数
   */
  looking: number;
  /**
   * 点赞数
   */
  praise: number;
  /**
   * 发布时间
   */
  publish_time: number;
  publish_time_str: string;
  /**
   * 阅读数
   */
  read: number;
  /**
   * 文章原始短链接
   */
  short_link: string;
  /**
   * 文章标题
   */
  title: string;
  /**
   * 更新时间
   */
  update_time: number;
  update_time_str: string;
  /**
   * 文章长连接
   */
  url: string;
  /**
   * wxid
   */
  wx_id: string;
  /**
   * 公众号名字
   */
  wx_name: string;
  [property: string]: any;
}

// API请求参数类型定义
export interface ArticleSearchParams {
  kw: string;              // 关键词
  sort_type?: number;      // 排序类型 1-最新 2-最热
  mode?: number;           // 模式 1-精确 2-模糊
  period?: number;         // 时间范围（天） 1,7,30,90
  page?: number;           // 页码
  key: string;             // API密钥
  any_kw?: string;         // 任意关键词
  ex_kw?: string;          // 排除关键词
  verifycode?: string;     // 验证码
  type?: number;           // 类型 1-文章 2-视频
}