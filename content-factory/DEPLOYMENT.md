# 生产环境部署指南

## 环境变量配置

在Vercel Dashboard中需要配置以下环境变量：

### API 密钥配置

```
# OpenRouter AI 模型配置
OPENAI_API_KEY=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
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet

# 微信公众号搜索API配置
NEXT_PUBLIC_XIAOHONGSHU_SEARCH_API_KEY=JZL134dc4c7b7886079
NEXT_PUBLIC_XIAOHONGSHU_SEARCH_API_BASE=https://www.dajiala.com/fbmain/monitor/v3/kw_search

# 硅基流动 AI生图配置
SILICONFLOW_API_KEY=sk-vikxdjnhqciuhqevdvpvirsccidnkpckrehyuupklsxsihup
SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1/images/generations
SILICONFLOW_MODEL=Kwai-Kolors/Kolors

# 微信公众号发布API配置
WECHAT_API_KEY=xhs_ece2ac77bf86495442d51095ac9ffcc1
WECHAT_API_BASE=https://wx.limyai.com/api/openapi
```

### 系统配置

```
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

## 默认用户账号

生产环境预配置了以下用户账号：

1. **管理员账号**
   - 邮箱: admin@example.com
   - 用户名: admin
   - 密码: admin123

2. **真实用户账号**
   - 邮箱: liuzmid@gmail.com
   - 用户名: 卷儿哥
   - 密码: test123

## 部署步骤

1. 推送代码到GitHub主分支
2. Vercel会自动触发部署
3. 在Vercel Dashboard中配置环境变量
4. 重新部署以确保环境变量生效

## 功能验证清单

- [ ] 用户登录功能
- [ ] API配置管理
- [ ] 微信搜索功能
- [ ] 微信发布功能
- [ ] AI分析功能
- [ ] 内容创作功能

## 故障排除

### 常见问题

1. **API配置未生效**
   - 检查Vercel环境变量是否正确配置
   - 重新部署应用

2. **用户无法登录**
   - 确认使用的是预配置的邮箱和密码
   - 检查浏览器控制台错误信息

3. **微信API调用失败**
   - 验证API密钥是否有效
   - 检查API调用次数限制

## 监控和维护

- 定期检查API密钥有效性
- 监控API调用次数和费用
- 备份用户数据（重要配置）