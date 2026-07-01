import type { ToolMessages } from '../en/tools';

export const toolMessages = {
  categories: {
    all: '全部',
    topology: '拓扑',
    calculators: '计算',
    magnetics: '磁性元件',
    control: '控制',
    simulation: '仿真'
  },
  items: {
    'buck-converter-designer': { title: 'Buck 变换器设计工具', description: '设计功率级，估算元件取值，并检查电压和电流应力。' },
    'boost-converter-designer': { title: 'Boost 变换器设计工具', description: '规划 Boost 变换器运行点、元件范围和半导体应力。' },
    'boost-pfc-designer': { title: 'Boost PFC 设计工具', description: '梳理用于输入电流整形和功率级尺寸估算的 Boost PFC 设计假设。' },
    'flyback-converter-designer': { title: 'Flyback 变换器设计工具', description: '估算反激电源的变压器匝比、开关应力和运行范围。' },
    'llc-resonant-converter-designer': { title: 'LLC 谐振变换器设计工具', description: '基于轨迹引导 ODE 分析，在输入电压和负载角点上搜索 LLC 谐振腔候选设计。' },
    'rc-time-constant-calculator': { title: 'RC 时间常数计算器', description: '计算滤波、延时、软启动网络和采样电路中的 RC 时间常数。' },
    'voltage-divider-calculator': { title: '分压器计算器', description: '估算反馈网络中的分压比、输出电压和电阻取值。' },
    'voltage-sensing-adc-scaling': { title: '电压采样与 ADC 换算', description: '选择实用的高压采样分压器，并计算 ADC 换算、分辨率、电流和应力。' },
    'sensing-rc-filter-designer': { title: '采样 RC 滤波器设计工具', description: '为电压、电流和温度采样信号链设计一阶 RC 滤波器。' },
    'shunt-current-sensing-evaluator': { title: '分流电阻电流采样评估器', description: '评估电流采样中的分流电阻组损耗、电流采样放大器输出摆幅和 ADC 量程占用。' },
    'buck-inductor-ripple-calculator': { title: 'Buck 电感纹波计算器', description: '根据电压、电感、占空比和开关频率估算 Buck 电感纹波电流。' },
    'rc-snubber-calculator': { title: 'RC 吸收电路计算器', description: '基于实测振铃频率和电路假设估算阻尼网络取值。' },
    'rcd-snubber-calculator': { title: 'RCD 吸收电路计算器', description: '估算漏感能量吸收设计中的钳位和损耗范围。' },
    'output-capacitor-calculator': { title: '输出电容计算器', description: '用于输出纹波和电容选择流程的占位工具。' },
    'magnetics-designer': { title: '磁性元件设计工具', description: '梳理功率磁性元件的磁芯面积、磁通密度、匝数和绕组假设。' },
    'buck-control-loop-designer': { title: 'Buck 控制环路设计工具', description: '基于对象模型、补偿目标和交越频率规划 Buck 变换器环路。' },
    'boost-control-loop-designer': { title: 'Boost 控制环路设计工具', description: '在考虑右半平面零点限制的前提下规划 Boost 补偿。' },
    'boost-pfc-control-loop-designer': { title: 'Boost PFC 控制环路设计工具', description: '协调 Boost PFC 的电流环和电压环设计假设。' },
    'flyback-control-loop-designer': { title: 'Flyback 控制环路设计工具', description: '根据对象行为和隔离反馈假设估算反激环路整形约束。' },
    'llc-control-loop-designer': { title: 'LLC 控制环路设计工具', description: '整理 LLC 频率调制范围和负载条件下的控制设计假设。' },
    pulse: { title: 'PULSE', description: '面向电力电子的事件驱动分段线性仿真生态。' }
  }
} as const satisfies ToolMessages;
