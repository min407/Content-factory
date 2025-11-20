#!/bin/bash

echo "🚀 内容工厂一键部署脚本"
echo "========================"

# 检查是否已登录GitHub
if ! git config --global user.name; then
    echo "❌ 请先配置Git用户信息:"
    echo "git config --global user.name '您的姓名'"
    echo "git config --global user.email '您的邮箱'"
    exit 1
fi

echo "✅ Git配置检查完成"

# 提交当前更改
echo "📝 提交代码更改..."
git add .
git commit -m "部署准备：更新项目配置和README文件" || echo "没有新的更改需要提交"

# 推送到GitHub
echo "📤 推送代码到GitHub..."
git push origin main

echo ""
echo "🎉 代码推送完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 访问: https://vercel.com"
echo "2. 用GitHub账户登录"
echo "3. 点击 'New Project'"
echo "4. 选择 'min407/Content-factory' 仓库"
echo "5. 点击 'Deploy'"
echo ""
echo "🔗 环境变量配置："
echo "请复制以下环境变量到Vercel项目中："
echo ""
echo "OPENAI_API_KEY=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"
echo "OPENAI_API_BASE=https://openrouter.ai/api/v1"
echo "OPENAI_MODEL=openai/gpt-4o"
echo "NEXT_PUBLIC_XIAOHONGSHU_SEARCH_API_KEY=JZL134dc4c7b7886079"
echo "NEXT_PUBLIC_XIAOHONGSHU_SEARCH_API_BASE=https://www.dajiala.com/fbmain/monitor/v3/xhs"
echo "SILICONFLOW_API_KEY=sk-vikxdjnhqciuhqevdvpvirsccidnkpckrehyuupklsxsihup"
echo "SILICONFLOW_API_BASE=https://api.siliconflow.cn/v1/images/generations"
echo "SILICONFLOW_MODEL=Kwai-Kolors/Kolors"
echo "WECHAT_API_KEY=xhs_ece2ac77bf86495442d51095ac9ffcc1"
echo "WECHAT_API_BASE=https://wx.limyai.com/api/openapi"
echo ""
echo "💡 部署完成后，您的网站地址将是："
echo "https://content-factory-v2.vercel.app"
echo ""
echo "🎯 部署过程中遇到问题，请联系技术支持！"