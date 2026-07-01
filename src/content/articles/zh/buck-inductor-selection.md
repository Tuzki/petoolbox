---
title: "如何为 Buck 变换器选择电感"
articleId: "buck-inductor-selection"
description: "面向 Buck 变换器的实用电感选择方法，覆盖电感量、纹波电流、饱和电流和电流额定值。"
category: "converter-design"
primaryTool: "buck-inductor-ripple-calculator"
relatedTools:
  - "output-capacitor-calculator"
  - "buck-converter-designer"
publishedAt: 2026-06-27
updatedAt: 2026-06-27
draft: false
---

选择 Buck 电感通常从纹波电流开始，然后检查电流极限、损耗、尺寸和温升。本文保留核心方法，作为后续完整设计说明的基础。

<figure class="buck-diagram" aria-label="简化 Buck 变换器功率级">
  <svg viewBox="0 0 680 220" role="img" aria-labelledby="buck-diagram-title">
    <title id="buck-diagram-title">简化 Buck 变换器功率级</title>
    <line x1="48" y1="80" x2="136" y2="80" />
    <rect x="136" y="48" width="58" height="64" rx="3" />
    <line x1="194" y1="80" x2="282" y2="80" />
    <path d="M282 80c12-32 36-32 48 0s36 32 48 0 36-32 48 0" />
    <line x1="426" y1="80" x2="574" y2="80" />
    <line x1="500" y1="80" x2="500" y2="150" />
    <line x1="474" y1="150" x2="526" y2="150" />
    <line x1="482" y1="164" x2="518" y2="164" />
    <line x1="574" y1="80" x2="574" y2="150" />
    <rect x="552" y="150" width="44" height="18" rx="2" />
    <line x1="48" y1="168" x2="620" y2="168" />
    <text x="48" y="58">VIN</text>
    <text x="139" y="39">SW</text>
    <text x="330" y="54">L</text>
    <text x="486" y="194">COUT</text>
    <text x="552" y="194">LOAD</text>
    <text x="575" y="58">VOUT</text>
  </svg>
</figure>

## 从纹波电流开始

电感纹波电流通常选为满载输出电流的一部分。常见初值范围是 20% 到 40%，随后再结合瞬态响应、损耗和可采购器件进行校核。

### Buck 电感纹波公式

<div class="formula-scroll">
  <p class="formula">Delta I<sub>L</sub> = (V<sub>OUT</sub> x (V<sub>IN</sub> - V<sub>OUT</sub>)) / (L x f<sub>SW</sub> x V<sub>IN</sub>)</p>
</div>

这个连续导通近似适合用于第一轮电感候选值估算。

## 关键参数

<div class="table-scroll">
  <table>
    <thead>
      <tr>
        <th>参数</th>
        <th>需要检查</th>
        <th>工程备注</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>电感量</td>
        <td>纹波电流目标</td>
        <td>更大的电感量会降低纹波，但会减慢电流斜率。</td>
      </tr>
      <tr>
        <td>饱和电流</td>
        <td>电感峰值电流</td>
        <td>需要高于最坏工况峰值电流并留有裕量。</td>
      </tr>
      <tr>
        <td>RMS 电流额定值</td>
        <td>热应力</td>
        <td>按预期板温检查额定值。</td>
      </tr>
      <tr>
        <td>DCR</td>
        <td>导通损耗</td>
        <td>更低 DCR 有利于效率，但可能增加尺寸。</td>
      </tr>
    </tbody>
  </table>
</div>

## 简单示例

假设 VIN = 24 V，VOUT = 5 V，开关频率 = 400 kHz，L = 10 uH。

代入上式：

<div class="formula-scroll">
  <p class="formula">Delta I<sub>L</sub> = (5 x (24 - 5)) / (10 uH x 400 kHz x 24) = 0.99 A</p>
</div>

对于 3 A 输出轨，这约等于 33% 纹波电流，是很多紧凑 Buck 设计的合理起点。

> **设计提示：** 需要在输入电压、负载瞬态、电流限制容差和温度范围内检查电感峰值电流。不同磁芯材料的饱和特性可能是渐进的，也可能很陡。

## 选择电流额定值

峰值电流可近似为输出电流加半个纹波电流。很多 Buck 设计中 RMS 电流接近负载电流，但热验证仍然重要，因为 DCR 损耗会随温度升高而增加。

### 发布前需要确认

- 电感饱和电流高于峰值电流并留有裕量。
- RMS 电流额定值覆盖目标板温。
- 在选定纹波电流和开关频率下，磁芯损耗可接受。
- 控制环路在选定输出滤波器下保持稳定。

## 结论

先确定纹波电流目标并计算电感量，再结合饱和电流、RMS 额定值、DCR、磁芯损耗、封装尺寸和热裕量选择真实器件。关联的工具条目后续会成为第一轮尺寸估算计算器。

## 相关工具

当 Buck 电感纹波计算器可用时，可通过侧栏或移动端工具卡片打开。
