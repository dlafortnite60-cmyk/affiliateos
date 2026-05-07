'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { fmt$, fmtNum } from '@/lib/metrics'
import type { PerformerRow } from '@/types'

interface DailyData {
  date:    string
  spend:   number
  revenue: number
  profit:  number
}

// ─── Spend / Revenue / Profit bar chart ──────────────────────
export function SpendRevenueChart({ data }: { data: DailyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis dataKey="date" tick={{ fill: '#6e7681', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => '$'+v} />
        <Tooltip
          contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#8b949e' }}
          formatter={(v: number) => [fmt$(v)]}
        />
        <Legend
          iconType="square" iconSize={10}
          formatter={(v) => <span style={{ color: '#8b949e', fontSize: 11 }}>{v}</span>}
        />
        <Bar dataKey="spend"   name="Spend"   fill="#1f6feb" radius={[2,2,0,0]} />
        <Bar dataKey="revenue" name="Revenue" fill="#238636" radius={[2,2,0,0]} />
        <Bar dataKey="profit"  name="Profit"  fill="#3fb950" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── ROI trend line ───────────────────────────────────────────
export function ROILineChart({ data }: { data: { date: string; roi: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis dataKey="date" tick={{ fill: '#6e7681', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v+'%'} />
        <Tooltip
          contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => [v.toFixed(1) + '%', 'ROI']}
        />
        <Line type="monotone" dataKey="roi" stroke="#58a6ff" strokeWidth={2} dot={{ fill: '#58a6ff', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Platform ROI bar chart ────────────────────────────────────
export function PlatformROIChart({ data }: { data: PerformerRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#6e7681', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v+'%'} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} tickLine={false} axisLine={false} width={90} />
        <Tooltip
          contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => [v.toFixed(1) + '%', 'ROI']}
        />
        <Bar dataKey="roi" radius={[0,4,4,0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.roi >= 0 ? '#3fb950' : '#f85149'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Top performers mini table ─────────────────────────────────
export function TopPerformersTable({ title, rows }: { title: string; rows: PerformerRow[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[#30363d]">
        <div className="text-sm font-semibold text-gray-200">{title}</div>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-gray-500">No data yet</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-[#21262d]">Name</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-[#21262d]">Profit</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-[#21262d]">ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0,5).map((row, i) => (
              <tr key={i} className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d]">
                <td className="px-4 py-2.5 text-sm text-gray-300 max-w-[140px] truncate">{row.name}</td>
                <td className={`px-4 py-2.5 text-sm text-right font-medium ${row.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt$(row.profit)}</td>
                <td className={`px-4 py-2.5 text-sm text-right font-semibold ${row.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{row.roi.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
