'use client'

import { type FC } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { CustomerCategoryDef } from '@/types'
import type { CustomerCategory } from '@/lib/constants'

interface TAMAnalysisProps {
  categories: CustomerCategoryDef[]
  pipelineByCategory: { category: CustomerCategory; count: number; totalValue: number }[]
}

const ESTIMATED_ADDRESSABLE = 100

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

function borderClass(rank: number): string {
  if (rank === 1) return 'border-[#C45A3C]'
  if (rank <= 3) return 'border-border-default'
  return 'border-border-subtle'
}

export const TAMAnalysis: FC<TAMAnalysisProps> = ({ categories, pipelineByCategory }) => {
  const categoryMap = new Map(pipelineByCategory.map((c) => [c.category, c]))
  const sorted = [...categories].sort((a, b) => a.priority_rank - b.priority_rank)

  const totalValue = pipelineByCategory.reduce((sum, c) => sum + c.totalValue, 0)
  const totalProspects = pipelineByCategory.reduce((sum, c) => sum + c.count, 0)
  const activeCategories = pipelineByCategory.filter((c) => c.count > 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((cat) => {
          const pipeline = categoryMap.get(cat.id)
          const count = pipeline?.count ?? 0
          const value = pipeline?.totalValue ?? 0
          const penetration = Math.min((count / ESTIMATED_ADDRESSABLE) * 100, 100)

          return (
            <div
              key={cat.id}
              className={`rounded-lg border bg-surface p-4 ${borderClass(cat.priority_rank)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
                <Badge variant={cat.priority_rank === 1 ? 'amber' : 'gray'} size="sm">
                  #{cat.priority_rank}
                </Badge>
              </div>

              <p className="text-xs text-text-secondary italic mb-3 line-clamp-2">
                {cat.goodfire_value_prop}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                <div>
                  <span className="text-text-tertiary">In Pipeline</span>
                  <span className="ml-1 font-mono text-text-primary">{count}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Pipeline Value</span>
                  <span className="ml-1 font-mono text-text-primary">{formatCurrency(value)}</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Avg Deal</span>
                  <span className="ml-1 font-mono text-text-primary">
                    {formatCurrency(cat.avg_deal_size.low)}-{formatCurrency(cat.avg_deal_size.high)}
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary">Sales Cycle</span>
                  <span className="ml-1 font-mono text-text-primary">
                    {cat.sales_cycle_days.low}-{cat.sales_cycle_days.high}d
                  </span>
                </div>
              </div>

              {cat.regulatory_tailwinds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {cat.regulatory_tailwinds.map((tw) => (
                    <Badge key={tw} variant="gray" size="sm">{tw}</Badge>
                  ))}
                </div>
              )}

              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C45A3C] transition-all duration-500"
                  style={{ width: `${penetration}%` }}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                {count} / ~{ESTIMATED_ADDRESSABLE} addressable
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-text-secondary font-medium">
            Total Addressable Pipeline:
          </span>
          <span className="font-mono text-sm font-semibold text-[#C45A3C]">
            {formatCurrency(totalValue)}
          </span>
          <span className="text-xs text-text-secondary">
            across {totalProspects} prospects in {activeCategories} categories
          </span>
        </div>
        <Link href="/models" className="inline-flex items-center gap-1 text-xs text-[#C45A3C] hover:underline">
          Model Coverage <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  )
}
