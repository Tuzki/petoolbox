import type { NavigationMessages } from '../en/navigation';

export const navigationMessages = {
  items: {
    'topology-designers': '拓扑设计工具',
    'engineering-calculators': '工程计算工具',
    magnetics: '磁性元件',
    control: '控制设计',
    simulation: '仿真',
    articles: '技术文章'
  },
  sections: {
    'non-isolated': '非隔离',
    'ac-dc': 'AC-DC',
    isolated: '隔离',
    resonant: '谐振',
    'basic-circuits': '基础电路',
    'power-stage': '功率级',
    protection: '保护'
  },
  viewAll: '查看全部',
  toggleMenu: '打开或关闭导航菜单',
  toggleSection: '展开'
} as const satisfies NavigationMessages;
