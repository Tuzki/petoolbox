import type { PageMessages } from '../en/pages';

export const pageMessages = {
  home: {
    title: 'PE Toolbox',
    description: '电力电子设计工具、浏览器端计算器、设计流程与工程笔记。',
    h1: '电力电子设计工具',
    intro: '面向电力电子工程师的浏览器端计算器、设计流程与工程笔记。',
    actionsLabel: '首页操作',
    exploreTools: '查看工具',
    readArticles: '阅读文章',
    featuredToolsTitle: '可用工具',
    viewAllTools: '查看全部工具 →',
    latestTitle: '最新文章',
    latestLabel: '工程文章',
    latestArticleTitle: '英伟达 800V 电源体系',
    latestArticleDescription: '一篇面向工程师的架构解读，讨论高压机柜供电、48V 中间母线与 AI 服务器板级供电。',
    viewAllArticles: '查看全部文章 →',
    whyTitle: '为什么做 PE Toolbox',
    values: [
      { title: '浏览器端', text: '浏览器端工具，无需安装。' },
      { title: '假设透明', text: '工程假设透明可查。' },
      { title: '面向实用流程', text: '面向真实电力电子设计流程。' }
    ]
  },
  categories: {
    tools: { title: '工程计算工具', description: '用于快速设计校核的电力电子工程计算工具。', intro: 'PE Toolbox 将提供实用的电路和功率级计算工具，用于快速工程校核。' },
    'topology-designers': { title: '拓扑设计工具', description: 'PE Toolbox 规划中的电源变换器拓扑设计工作流。', intro: '这里将汇集 Buck、Boost、Boost PFC、Flyback 和 LLC 等常用电源拓扑的设计工作流。' },
    magnetics: { title: '磁性元件', description: '用于电力电子电感和变压器的磁性元件设计工具。', intro: '磁性元件工具将覆盖电力电子变换器中的电感和变压器设计流程。' },
    control: { title: '控制设计', description: '规划中的电源变换器控制环路设计工作流。', intro: '控制设计工具聚焦常见变换器族的环路整形工作流。' },
    simulation: { title: '仿真', description: 'PE Toolbox 规划中的 PULSE 仿真资源。', intro: '仿真页面将介绍 PULSE 的原理图输入、求解和波形查看流程。' }
  },
  about: {
    title: '关于',
    description: '关于 PE Toolbox 及其实用电力电子工程工作流定位。',
    h1: '关于 PE Toolbox',
    paragraphs: [
      'PE Toolbox 是面向电力电子工程师的实用设计工具、计算器、控制工作流和仿真资源集合。',
      '项目目标是把工程验证前移，缩短从规格定义到可工作的设计之间的时间。'
    ],
    scopeLabel: '当前范围',
    scope: ['拓扑设计', '工程计算', '磁性元件', '控制', 'PULSE 仿真']
  },
  feedback: {
    title: '反馈',
    description: 'PE Toolbox 关于计算问题、工程假设、边界条件和后续电力电子设计工具的反馈说明。',
    h1: '反馈',
    paragraphs: [
      'PE Toolbox 仍处于早期公开版本。如果你发现计算问题、边界条件不清楚、假设说明不足，或者希望增加某个电力电子设计工具，欢迎通过后续公布的联系渠道反馈。',
      '有效的工程反馈最好包括：工具名称、输入参数、期望结果、实际结果，以及简短说明。'
    ]
  },
  articles: {
    title: '技术文章',
    description: 'PE Toolbox 的工程文章和设计指南。',
    categoryFallback: '工程文章',
    tocLabel: '本文目录',
    categories: {
      'converter-design': '变换器设计',
      'engineering-articles': '工程文章'
    },
    empty: '暂无已发布文章。',
    related: '相关文章',
    editorial: 'PE Toolbox 编辑部',
    published: '发布',
    updated: '更新'
  },
  notFound: {
    title: '页面未找到',
    description: '请求的 PE Toolbox 页面不存在。',
    h1: '页面未找到',
    text: '你请求的页面不可用。',
    action: '返回首页'
  }
} as const satisfies PageMessages;
