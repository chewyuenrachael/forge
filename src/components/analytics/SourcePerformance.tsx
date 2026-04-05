'use client'

import { type FC, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ArrowUpDown } from 'lucide-react'
import type { ConversionBySignalType, ConversionByCategory } from '@/lib/analytics'

interface SourcePerformanceProps {
  bySignalType: ConversionBySignalType[]
  byCategory: ConversionByCategory[]
}

type SignalSortKey = 'totalPipelineValue' | 'conversionRate' | 'signalsDetected' | 'avgDealSize'
type CategorySortKey = 'avgDealSize' | 'meetingRate' | 'responseRate' | 'prospectsContacted'

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  regulatory: 'Regulatory',
  competitor: 'Competitor',
  prospect: 'Prospect',
  conference: 'Conference',
  research: 'Research',
  incident: 'Incident',
}

const CATEGORY_LABELS: Record<string, string> = {
  data_sovereign_enterprise: 'Data Sovereign',
  ai_native_startup: 'AI Native',
  cost_optimizer: 'Cost Optimizer',
  research_institution: 'Research',
  model_customization_platform: 'Model Custom.',
  sovereign_ai_initiative: 'Sovereign AI',
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  if (value === 0) return '\u2014'
  return `$${value}`
}

function getPerformanceClass(value: number, max: number, min: number): string {
  if (max === min) return ''
  if (value === max) return 'bg-green-500/5'
  if (value === min && min < max) return 'bg-red-500/5'
  return ''
}

export const SourcePerformance: FC<SourcePerformanceProps> = ({ bySignalType, byCategory }) => {
  const [signalSort, setSignalSort] = useState<SignalSortKey>('totalPipelineValue')
  const [categorySort, setCategorySort] = useState<CategorySortKey>('avgDealSize')

  const sortedSignals = [...bySignalType].sort((a, b) => b[signalSort] - a[signalSort])
  const sortedCategories = [...byCategory].sort((a, b) => b[categorySort] - a[categorySort])

  const maxConversion = Math.max(...bySignalType.map((d) => d.conversionRate), 1)
  const signalPipelineValues = bySignalType.map((d) => d.totalPipelineValue).filter((v) => v > 0)
  const maxSignalPipeline = Math.max(...signalPipelineValues, 0)
  const minSignalPipeline = signalPipelineValues.length > 1 ? Math.min(...signalPipelineValues) : 0

  const categoryDealSizes = byCategory.map((d) => d.avgDealSize).filter((v) => v > 0)
  const maxCategoryDeal = Math.max(...categoryDealSizes, 0)
  const minCategoryDeal = categoryDealSizes.length > 1 ? Math.min(...categoryDealSizes) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Signal Type Performance */}
      <Card header="Performance by Signal Source">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                  Source
                </th>
                <SortableHeader
                  label="Signals"
                  sortKey="signalsDetected"
                  activeKey={signalSort}
                  onSort={setSignalSort}
                />
                <SortableHeader
                  label="Out\u2192Mtg"
                  sortKey="conversionRate"
                  activeKey={signalSort}
                  onSort={setSignalSort}
                />
                <SortableHeader
                  label="Avg Deal"
                  sortKey="avgDealSize"
                  activeKey={signalSort}
                  onSort={setSignalSort}
                  align="right"
                />
                <SortableHeader
                  label="Pipeline"
                  sortKey="totalPipelineValue"
                  activeKey={signalSort}
                  onSort={setSignalSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {sortedSignals.map((row) => (
                <tr
                  key={row.signalType}
                  className={`border-b border-border-subtle ${getPerformanceClass(row.totalPipelineValue, maxSignalPipeline, minSignalPipeline)}`}
                >
                  <td className="px-3 py-2.5">
                    <span className="text-sm text-text-primary">
                      {SIGNAL_TYPE_LABELS[row.signalType] ?? row.signalType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-sm text-text-primary">{row.signalsDetected}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-text-primary w-10">
                        {row.conversionRate}%
                      </span>
                      <div className="flex-1 h-2 bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-amber rounded-full transition-all"
                          style={{ width: `${Math.min(100, (row.conversionRate / maxConversion) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-sm text-text-primary">
                      {formatCurrency(row.avgDealSize)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-sm text-text-primary">
                      {formatCurrency(row.totalPipelineValue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Category Performance */}
      <Card header="Performance by Customer Category">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-secondary font-medium">
                  Category
                </th>
                <SortableHeader
                  label="Contacted"
                  sortKey="prospectsContacted"
                  activeKey={categorySort}
                  onSort={setCategorySort}
                />
                <SortableHeader
                  label="Resp %"
                  sortKey="responseRate"
                  activeKey={categorySort}
                  onSort={setCategorySort}
                />
                <SortableHeader
                  label="Mtg %"
                  sortKey="meetingRate"
                  activeKey={categorySort}
                  onSort={setCategorySort}
                />
                <SortableHeader
                  label="Avg Deal"
                  sortKey="avgDealSize"
                  activeKey={categorySort}
                  onSort={setCategorySort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((row) => (
                <tr
                  key={row.category}
                  className={`border-b border-border-subtle ${getPerformanceClass(row.avgDealSize, maxCategoryDeal, minCategoryDeal)}`}
                >
                  <td className="px-3 py-2.5">
                    <span className="text-sm text-text-primary">
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-sm text-text-primary">{row.prospectsContacted}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-sm text-text-primary">{row.responseRate}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-sm text-text-primary">{row.meetingRate}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-sm text-text-primary">
                      {formatCurrency(row.avgDealSize)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Sortable Header ────────────────────────────────────────────────

interface SortableHeaderProps<K extends string> {
  label: string
  sortKey: K
  activeKey: K
  onSort: (key: K) => void
  align?: 'left' | 'right'
}

function SortableHeader<K extends string>({
  label,
  sortKey,
  activeKey,
  onSort,
  align = 'left',
}: SortableHeaderProps<K>): JSX.Element {
  return (
    <th
      className={`px-3 py-2 text-xs uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-text-primary ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${activeKey === sortKey ? 'text-accent-amber' : 'text-text-secondary'}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </span>
    </th>
  )
}
