import Papa from 'papaparse'
import type { Campaign, Platform } from '@/types'

// ============================================================
// EXPORT
// ============================================================
export function exportCampaignsCSV(campaigns: Campaign[]) {
  const headers = [
    'Date','Platform','Campaign','AdSet','Ad','GEO',
    'Offer','Spend','Impressions','Clicks','Leads','Sales','Revenue',
    'CTR%','CPC','CPM','CVR%','CPA','Profit','ROI%','EPC'
  ]
  const rows = campaigns.map(c => {
    const profit = c.revenue - c.spend
    const roi    = c.spend > 0 ? ((c.revenue - c.spend) / c.spend * 100).toFixed(1) : '0'
    return [
      c.date, c.platform, c.campaign_name, c.adset_name, c.ad_name, c.geo,
      c.offer?.name ?? '',
      c.spend, c.impressions, c.clicks, c.leads, c.sales, c.revenue,
      c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0,
      c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : 0,
      c.impressions > 0 ? ((c.spend / c.impressions) * 1000).toFixed(2) : 0,
      c.clicks > 0 ? ((c.sales / c.clicks) * 100).toFixed(2) : 0,
      c.sales > 0 ? (c.spend / c.sales).toFixed(2) : 0,
      profit.toFixed(2), roi,
      c.clicks > 0 ? (c.revenue / c.clicks).toFixed(3) : 0,
    ]
  })
  const csv = Papa.unparse({ fields: headers, data: rows })
  downloadCSV(csv, 'affiliateos_campaigns.csv')
}

export function exportTemplateCSV() {
  const headers = ['date','platform','campaign_name','adset_name','ad_name','geo','spend','impressions','clicks','leads','sales','revenue','notes']
  const example = ['2025-05-01','Meta Ads','US_OfferName_EN_V1','Interest_Health_25-45','UGC_Hook1','US','250.00','45000','1200','80','15','825.00','Test campaign']
  const csv = Papa.unparse({ fields: headers, data: [example] })
  downloadCSV(csv, 'affiliateos_import_template.csv')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// IMPORT — Column Mappings per source
// ============================================================

// Each source maps its column names → our canonical field names
const COLUMN_MAPS: Record<string, Record<string, string>> = {
  // Our own template / generic
  generic: {
    date: 'date', platform: 'platform', campaign_name: 'campaign_name',
    adset_name: 'adset_name', ad_name: 'ad_name', geo: 'geo',
    spend: 'spend', impressions: 'impressions', clicks: 'clicks',
    leads: 'leads', sales: 'sales', revenue: 'revenue', notes: 'notes',
  },
  // Meta Ads Manager CSV export
  meta: {
    'reporting starts': 'date',
    'campaign name': 'campaign_name',
    'ad set name': 'adset_name',
    'ad name': 'ad_name',
    'amount spent (usd)': 'spend',
    'impressions': 'impressions',
    'link clicks': 'clicks',
    'leads': 'leads',
    'purchases': 'sales',
    'purchase roas (return on ad spend)': '_roas',  // handled specially
    'website purchases conversion value': 'revenue',
  },
  // TikTok Ads CSV export
  tiktok: {
    'date': 'date',
    'campaign name': 'campaign_name',
    'ad group name': 'adset_name',
    'ad name': 'ad_name',
    'cost': 'spend',
    'impressions': 'impressions',
    'clicks': 'clicks',
    'conversions': 'sales',
    'total complete payment': 'revenue',
    'country code': 'geo',
  },
  // Keitaro tracker CSV
  keitaro: {
    'date': 'date',
    'campaign': 'campaign_name',
    'country': 'geo',
    'clicks': 'clicks',
    'unique clicks': 'clicks',
    'leads': 'leads',
    'sales': 'sales',
    'revenue': 'revenue',
    'cost': 'spend',
  },
}

export type ImportSource = keyof typeof COLUMN_MAPS

export interface ParsedCampaignRow {
  date:          string
  platform:      Platform | null
  campaign_name: string
  adset_name:    string
  ad_name:       string
  geo:           string
  spend:         number
  impressions:   number
  clicks:        number
  leads:         number
  sales:         number
  revenue:       number
  notes:         string
  source:        ImportSource
}

export interface ImportResult {
  rows:   ParsedCampaignRow[]
  errors: string[]
}

export function parseCSV(
  file: File,
  source: ImportSource = 'generic',
  defaultPlatform: Platform | null = null
): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
      complete: (results) => {
        const map    = COLUMN_MAPS[source] ?? COLUMN_MAPS.generic
        const errors: string[] = []
        const rows: ParsedCampaignRow[] = []

        ;(results.data as Record<string, string>[]).forEach((raw, i) => {
          // Remap columns
          const row: Record<string, string> = {}
          for (const [src, dst] of Object.entries(map)) {
            const val = raw[src]
            if (val !== undefined && dst !== '_roas') row[dst] = val
          }

          const date = normaliseDate(row.date ?? '')
          if (!date) {
            errors.push(`Row ${i + 2}: invalid or missing date "${row.date ?? ''}"`)
            return
          }

          // For Meta: calculate revenue from ROAS × spend if revenue missing
          let revenue = parseFloat(row.revenue ?? '0') || 0
          if (!revenue && raw['_roas'] && row.spend) {
            revenue = parseFloat(raw['_roas']) * (parseFloat(row.spend) || 0)
          }

          rows.push({
            date,
            platform:      (row.platform as Platform) ?? defaultPlatform,
            campaign_name: row.campaign_name ?? '',
            adset_name:    row.adset_name ?? '',
            ad_name:       row.ad_name ?? '',
            geo:           (row.geo ?? '').toUpperCase().slice(0, 3),
            spend:         parseFloat(row.spend ?? '0') || 0,
            impressions:   parseInt(row.impressions ?? '0', 10) || 0,
            clicks:        parseInt(row.clicks ?? '0', 10) || 0,
            leads:         parseInt(row.leads ?? '0', 10) || 0,
            sales:         parseInt(row.sales ?? '0', 10) || 0,
            revenue,
            notes:         row.notes ?? '',
            source,
          })
        })

        resolve({ rows, errors })
      },
      error: (err: Error) => {
        resolve({ rows: [], errors: [err.message] })
      },
    })
  })
}

// Normalise various date formats → YYYY-MM-DD
function normaliseDate(raw: string): string | null {
  if (!raw) return null
  const clean = raw.trim()
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  // MM/DD/YYYY
  const mdy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`
  // DD.MM.YYYY
  const dmy = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  // Try native Date parse as fallback
  const d = new Date(clean)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}
