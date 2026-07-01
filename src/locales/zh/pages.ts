import type { PageMessages } from '../en/pages';

export const pageMessages = {
  home: {
    title: 'PE Toolbox',
    description: '电力电子设计工具、工程计算、控制工作流和仿真资源。',
    eyebrow: '电力电子设计工具',
    h1: '更快完成电源变换器设计。',
    intro: '为电力电子工程师提供拓扑设计、工程计算、磁性元件、控制环路和仿真工具。',
    explore: '浏览下方工具 ↓',
    directoryEyebrow: '工具目录',
    directoryTitle: '把电力电子工作流集中到一个入口。',
    whyEyebrow: '为什么使用 PE Toolbox？',
    whyTitle: '聚焦实际工程设计。',
    values: [
      { title: '面向电力电子', text: '围绕变换器设计、磁性元件、控制和仿真构建。' },
      { title: '无需注册', text: '直接在浏览器中使用工具。' },
      { title: '公式和假设透明', text: '每个工具说明模型、单位和适用边界。' },
      { title: '开放仿真生态', text: 'PULSE 将设计流程与仿真连接起来。' }
    ],
    latestEyebrow: '最新文章',
    latestTitle: '工程笔记和设计指南。',
    viewAllArticles: '查看全部文章 →'
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
  articles: {
    title: '技术文章',
    description: 'PE Toolbox 的工程文章和设计指南。',
    categoryFallback: '工程文章',
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
