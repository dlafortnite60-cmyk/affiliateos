'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseCSV, exportTemplateCSV, type ImportSource, type ParsedCampaignRow } from '@/lib/csv'
import { Button, Alert } from '@/components/ui/index'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageHeader } from '@/components/ui/index'
import { calcMetrics, fmt$ } from '@/lib/metrics'
import type { Platform } from '@/types'

const SOURCES: { value: ImportSource; label: string; desc: string }[] = [
  { value: 'generic',  label: 'Generic / Our Template', desc: 'Use our standard CSV template' },
  { value: 'meta',     label: 'Meta Ads Manager',       desc: 'Export from Meta Ads Manager → Campaigns → Export' },
  { value: 'tiktok',   label: 'TikTok Ads',             desc: 'Export from TikTok Ads Manager → Reports → Export' },
  { value: 'keitaro',  label: 'Keitaro Tracker',        desc: 'Export campaign report from Keitaro dashboard' },
]

const PLATFORMS: Platform[] = ['Meta Ads', 'TikTok Ads', 'Native Ads', 'Google Ads']

export default function ImportPage() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [source, setSource]       = useState<ImportSource>('generic')
  const [platform, setPlatform]   = useState<Platform>('Meta Ads')
  const [rows, setRows]           = useState<ParsedCampaignRow[]>([])
  const [errors, setErrors]       = useState<string[]>([])
  const [status, setStatus]       = useState<'idle' | 'parsed' | 'importing' | 'done'>('idle')
  const [importedCount, setImportedCount] = useState(0)
  const [selectedRows, setSelectedRows]   = useState<Set<number>>(new Set())

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('idle'); setRows([]); setErrors([])
    const result = await parseCSV(file, source, platform)
    setRows(result.rows)
    setErrors(result.errors)
    setSelectedRows(new Set(result.rows.map((_, i) => i)))
    setStatus('parsed')
  }

  async function handleImport() {
    if (!rows.length) return
    setStatus('importing')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const toInsert = rows
        .filter((_, i) => selectedRows.has(i))
        .map(row => ({
          user_id:       user.id,
          date:          row.date,
          platform:      row.platform ?? platform,
          campaign_name: row.campaign_name,
          adset_name:    row.adset_name,
          ad_name:       row.ad_name,
          geo:           row.geo,
          spend:         row.spend,
          impressions:   row.impressions,
          clicks:        row.clicks,
          leads:         row.leads,
          sales:         row.sales,
          revenue:       row.revenue,
          notes:         row.notes,
          source:        row.source,
        }))

      // Batch in chunks of 100
      let inserted = 0
      for (let i = 0; i < toInsert.length; i += 100) {
        const chunk = toInsert.slice(i, i + 100)
        const { error } = await supabase.from('campaigns').insert(chunk)
        if (error) throw error
        inserted += chunk.length
      }
      setImportedCount(inserted)
      setStatus('done')
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : 'Import failed'])
      setStatus('parsed')
    }
  }

  function toggleRow(i: number) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const visibleRows = rows.slice(0, 100)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0d1117]">
        <PageHeader
          title="CSV Import"
          description="Import campaign data from Meta Ads, TikTok, Keitaro, or our template"
        />

        <div className="p-6 max-w-5xl space-y-6">
          {status === 'done' ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-lg font-semibold text-gray-100 mb-1">Import Complete</h2>
              <p className="text-gray-400 text-sm mb-6">{importedCount} campaigns imported successfully.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => router.push('/campaigns')}>View Campaigns</Button>
                <Button onClick={() => { setStatus('idle'); setRows([]); if(fileRef.current) fileRef.current.value=''; }}>Import More</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Source */}
              <div className="card p-5">
                <div className="text-sm font-semibold text-gray-200 mb-4">① Select Data Source</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SOURCES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setSource(s.value)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        source === s.value
                          ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                          : 'border-[#30363d] bg-[#161b22] text-gray-400 hover:border-[#484f58]'
                      }`}
                    >
                      <div className="font-medium text-xs mb-0.5">{s.label}</div>
                      <div className="text-[11px] text-gray-500">{s.desc}</div>
                    </button>
                  ))}
                </div>

                {(source === 'generic' || source === 'keitaro') && (
                  <div className="mt-3">
                    <label className="form-label">Default Platform (if not in CSV)</label>
                    <select className="form-input !w-48" value={platform} onChange={e => setPlatform(e.target.value as Platform)}>
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 2: Upload */}
              <div className="card p-5">
                <div className="text-sm font-semibold text-gray-200 mb-4">② Upload CSV File</div>
                <div className="flex items-center gap-4">
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
                    className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                  <button
                    type="button"
                    onClick={exportTemplateCSV}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    ↓ Download template
                  </button>
                </div>

                {errors.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {errors.slice(0,5).map((e, i) => (
                      <div key={i} className="text-xs text-yellow-400 bg-yellow-900/20 px-3 py-1.5 rounded">{e}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Preview */}
              {status === 'parsed' && rows.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-200">③ Preview & Import</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {selectedRows.size} of {rows.length} rows selected
                        {rows.length > 100 && ` (showing first 100)`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedRows(new Set(rows.map((_, i) => i)))}
                        className="text-xs text-blue-400 hover:text-blue-300">Select all</button>
                      <button onClick={() => setSelectedRows(new Set())}
                        className="text-xs text-gray-500 hover:text-gray-300">Deselect all</button>
                      <Button variant="primary" size="sm" onClick={handleImport} disabled={selectedRows.size === 0}>
                        ⬆ Import {selectedRows.size} rows
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#30363d]">
                          <th className="px-3 py-2 text-left"></th>
                          <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">Platform</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">Campaign</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider">GEO</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">Spend</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">Clicks</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">Sales</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">Revenue</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">Profit</th>
                          <th className="px-3 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row, i) => {
                          const profit = row.revenue - row.spend
                          const roi    = row.spend > 0 ? ((profit / row.spend) * 100).toFixed(1) : '0'
                          const sel    = selectedRows.has(i)
                          return (
                            <tr key={i}
                              onClick={() => toggleRow(i)}
                              className={`border-b border-[#21262d] cursor-pointer transition-colors ${sel ? 'hover:bg-[#1c2128]' : 'opacity-40 hover:opacity-70'}`}
                            >
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={sel} onChange={() => toggleRow(i)}
                                  className="accent-blue-500" onClick={e => e.stopPropagation()} />
                              </td>
                              <td className="px-3 py-2 font-mono">{row.date}</td>
                              <td className="px-3 py-2 text-blue-400">{row.platform ?? '—'}</td>
                              <td className="px-3 py-2 max-w-[160px] truncate">{row.campaign_name || '—'}</td>
                              <td className="px-3 py-2 font-semibold">{row.geo || '—'}</td>
                              <td className="px-3 py-2 text-right">{fmt$(row.spend)}</td>
                              <td className="px-3 py-2 text-right text-gray-400">{row.clicks.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right text-gray-400">{row.sales}</td>
                              <td className="px-3 py-2 text-right text-green-400">{fmt$(row.revenue)}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt$(profit)}</td>
                              <td className={`px-3 py-2 text-right font-bold ${+roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {status === 'parsed' && rows.length === 0 && (
                <Alert type="warning" message="No valid rows found. Check that the file matches the selected source format." />
              )}
            </>
          )}

          {/* Instructions */}
          <div className="card p-5">
            <div className="text-sm font-semibold text-gray-200 mb-3">📖 Import Guide</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400 leading-relaxed">
              <div>
                <div className="font-semibold text-gray-300 mb-2">Supported Sources</div>
                <ul className="space-y-1">
                  <li><span className="text-blue-400">Meta Ads Manager</span> — export from Campaigns view, date range report</li>
                  <li><span className="text-blue-400">TikTok Ads Manager</span> — Custom Report → Campaign/Ad Group level</li>
                  <li><span className="text-blue-400">Keitaro</span> — Reports → Campaign report → Export CSV</li>
                  <li><span className="text-blue-400">Generic</span> — download our template, fill in and upload</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-gray-300 mb-2">Tips</div>
                <ul className="space-y-1">
                  <li>Dates are auto-detected (MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD)</li>
                  <li>After import, link campaigns to Offers/Funnels on the edit page</li>
                  <li>Duplicate rows are NOT automatically deduplicated — check your date range</li>
                  <li>Coming soon: direct API connections for Meta, TikTok, Google Ads</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
