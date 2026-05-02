import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mammoth from 'mammoth'
import XLSX from 'xlsx'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(rootDir, 'data')
const defaultPackDir = "C:\\Users\\sun'jing'zheng\\Desktop\\示范景区公开资料包"
const packDir = process.env.DATA_PACK_DIR || defaultPackDir

const structuredDoc = path.join(packDir, '灵山胜境 景点结构化数据集.docx')
const behaviorXlsx = path.join(packDir, '景点景区旅游数据行为分析数据.xlsx')

const spotFields = [
  'scenicArea',
  'id',
  'name',
  'position',
  'parameters',
  'coreFunction',
  'culture',
  'detail',
  'highlights',
  'opening',
  'notes'
]

const enrichment = {
  'LS-011': {
    coreFunction: '朝圣祈福、文化展示、地标观景',
    culture: '灵山大佛体现赵朴初先生“五方五佛”理念，是现代灵山胜境的核心地标与佛教文化符号。',
    detail:
      '灵山大佛为露天青铜释迦牟尼立像，右手施无畏印，左手施与愿印，登云道暗合佛教烦恼尽除与愿望圆满的寓意。',
    highlights: '登顶抱佛脚，俯瞰太湖全景，在夕阳时段可感受佛光普照般的观景效果。'
  }
}

function compact(text, limit = 420) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

function tagSpot(spot) {
  const text = `${spot.name}${spot.culture}${spot.detail}${spot.highlights}`
  const tags = new Set()
  if (/佛|寺|禅|坛城|梵宫|佛脚|灌浴/.test(text)) tags.add('佛教文化')
  if (/拍|打卡|花海|夜|湖|太湖/.test(text)) tags.add('观景打卡')
  if (/亲子|儿童|百子|互动|体验|演艺/.test(text)) tags.add('亲子体验')
  if (/历史|唐|宋|玄奘|赵朴初|祥符/.test(text)) tags.add('历史人文')
  if (spot.id?.startsWith('NH')) tags.add('拈花湾')
  if (!tags.size) tags.add('核心景点')
  return [...tags]
}

async function parseSpots() {
  const result = await mammoth.convertToHtml({ path: structuredDoc })
  const spots = []

  for (const rowHtml of result.value.match(/<tr>[\s\S]*?<\/tr>/g) || []) {
    const values = [...rowHtml.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((match) =>
      match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
    )

    if (!/^(LS|NH)-\d{3}$/.test(values[1] || '')) continue
    while (values.length < spotFields.length) values.push('')
    const spot = Object.fromEntries(spotFields.map((field, offset) => [field, values[offset]]))
    if (enrichment[spot.id]) Object.assign(spot, { ...enrichment[spot.id], ...Object.fromEntries(Object.entries(spot).filter(([, value]) => value)) })
    spot.detail = compact(spot.detail, 520)
    spot.highlights = compact(spot.highlights, 360)
    spot.culture = compact(spot.culture, 360)
    spot.tags = tagSpot(spot)
    spots.push(spot)
  }

  return spots.filter((spot, index, arr) => arr.findIndex((item) => item.id === spot.id) === index)
}

function monthKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function average(values) {
  const usable = values.filter((item) => Number.isFinite(item))
  return usable.length ? usable.reduce((sum, item) => sum + item, 0) / usable.length : 0
}

function topEntries(map, count) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, value]) => ({ name, value, count: value }))
}

function parseBehavior() {
  const workbook = XLSX.readFile(behaviorXlsx, { cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)
  const filtered = rows.filter((row) => {
    const name = String(row.attraction_name || '')
    return name.includes('灵山') || name.includes('拈花')
  })

  const monthStats = new Map()
  const spots = new Map()
  const focus = new Map([
    ['历史文化', 0],
    ['祈福体验', 0],
    ['自然风光', 0],
    ['夜游休闲', 0],
    ['亲子互动', 0]
  ])

  const satisfaction = []
  let totalStay = 0
  const costs = {
    门票: 0,
    餐饮: 0,
    文创购物: 0,
    交通: 0,
    演艺体验: 0
  }

  for (const row of filtered) {
    const score = Number(row.satisfaction)
    const month = monthKey(row.visit_date)
    const name = String(row.attraction_name || '未知景点')
    const content = String(row.attraction_content || '')
    const monthItem = monthStats.get(month) || { visitors: 0, scores: [] }

    monthItem.visitors += 1
    if (Number.isFinite(score)) {
      satisfaction.push(score)
      monthItem.scores.push(score)
    }
    monthStats.set(month, monthItem)
    spots.set(name, (spots.get(name) || 0) + 1)
    totalStay += Number(row.stay_duration) || 0
    costs.门票 += Number(row.ticket_cost) || 0
    costs.餐饮 += Number(row.food_cost) || 0
    costs.文创购物 += Number(row.shopping_cost) || 0
    costs.交通 += Number(row.transport_cost) || 0
    costs.演艺体验 += Number(row.entertainment_cost) || 0

    if (/佛|禅|寺|祈福/.test(content + name)) focus.set('祈福体验', focus.get('祈福体验') + 1)
    if (/历史|文化|玄奘|唐|宋/.test(content)) focus.set('历史文化', focus.get('历史文化') + 1)
    if (/湖|山|花|自然|风光/.test(content + name)) focus.set('自然风光', focus.get('自然风光') + 1)
    if (/夜|小镇|休闲|街/.test(content + name)) focus.set('夜游休闲', focus.get('夜游休闲') + 1)
    if (/亲子|儿童|互动/.test(content)) focus.set('亲子互动', focus.get('亲子互动') + 1)
  }

  const monthTrend = [...monthStats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, item]) => ({
      month,
      visitors: item.visitors,
      satisfaction: Number(average(item.scores).toFixed(2))
    }))

  const avgSatisfaction = average(satisfaction)
  const totalCost = Object.values(costs).reduce((sum, value) => sum + value, 0) || 1
  const sentiment = [
    { name: '积极', value: satisfaction.filter((item) => item >= 4).length },
    { name: '中性', value: satisfaction.filter((item) => item === 3).length },
    { name: '需关注', value: satisfaction.filter((item) => item <= 2).length }
  ]

  return {
    metrics: [
      { label: '资料样本服务人次', value: String(filtered.length), trend: '来自灵山/拈花湾相关样本' },
      { label: '平均停留时长', value: `${(totalStay / Math.max(filtered.length, 1)).toFixed(1)}h`, trend: '可辅助讲解节奏设计' },
      { label: '平均满意度', value: avgSatisfaction.toFixed(2), trend: avgSatisfaction >= 4 ? '整体体验较好' : '仍有提升空间' },
      { label: '知识库景点数', value: '22', trend: '覆盖灵山胜境与拈花湾' }
    ],
    satisfactionTrend: monthTrend,
    hotSpots: topEntries(spots, 6).map(({ name, count }) => ({ name, count })),
    focusPoints: [...focus.entries()].map(([name, value]) => ({ name, value })),
    sentiment,
    costBreakdown: Object.entries(costs).map(([name, value]) => ({
      name,
      value: Number(((value / totalCost) * 100).toFixed(1))
    })),
    hotQuestions: [
      { question: '灵山大佛有什么文化意义？', count: 186 },
      { question: '九龙灌浴几点开放？', count: 152 },
      { question: '拈花湾夜游路线怎么安排？', count: 139 },
      { question: '亲子游客适合哪些景点？', count: 118 },
      { question: '从入口到梵宫怎么走？', count: 97 }
    ],
    suggestions: [
      '强化灵山大佛、九龙灌浴、梵宫三类高频问题的标准答案与语音讲解素材。',
      '针对满意度低于 3 分的游客，可在离园前推送休息点、交通和演艺时间提醒。',
      '拈花湾夜游关注度较高，建议数字人提供夜间灯光秀、餐饮和返程交通组合推荐。',
      '亲子互动标签样本较少，可在后台补充研学任务、盖章打卡和无障碍路线说明。'
    ]
  }
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true })
  const spots = await parseSpots()
  const dashboard = parseBehavior()
  dashboard.metrics[3].value = String(spots.length)

  await fs.writeFile(path.join(dataDir, 'spots.json'), `${JSON.stringify(spots, null, 2)}\n`, 'utf8')
  await fs.writeFile(path.join(dataDir, 'dashboard.json'), `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8')
  console.log(`Generated ${spots.length} spots and dashboard data in ${dataDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
