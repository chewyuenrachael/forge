'use client'

import { type FC } from 'react'
import { useRouter } from 'next/navigation'

import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import type { CustomerCategoryDef } from '@/types'
import type { CustomerCategory } from '@/lib/constants'

interface CategoryBreakdownProps {
  categories: CustomerCategoryDef[]
  pipelineByCategory: { category: CustomerCategory; count: number; totalValue: number }[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

const COLUMNS = [
  { key: 'name', label: 'Category' },
  { key: 'priority', label: 'Priority', align: 'right' as const, mono: true },
  { key: 'prospects', label: 'Prospects', align: 'right' as const, mono: true },
  { key: 'pipelineValue', label: 'Pipeline Value', align: 'right' as const, mono: true },
  { key: 'avgDeal', label: 'Avg Deal Range', align: 'right' as const, mono: true },
  { key: 'salesCycle', label: 'Sales Cycle', align: 'right' as const, mono: true },
]

export const CategoryBreakdown: FC<CategoryBreakdownProps> = ({ categories, pipelineByCategory }) => {
  const router = useRouter()
  const categoryMap = new Map(pipelineByCategory.map((c) => [c.category, c]))

  const rows = [...categories]
    .map((cat) => {
      const pipeline = categoryMap.get(cat.id)
      return {
        id: cat.id,
        name: cat.name,
        priority: cat.priority_rank,
        prospects: pipeline?.count ?? 0,
        pipelineValue: formatCurrency(pipeline?.totalValue ?? 0),
        avgDeal: `${formatCurrency(cat.avg_deal_size.low)}-${formatCurrency(cat.avg_deal_size.high)}`,
        salesCycle: `${cat.sales_cycle_days.low}-${cat.sales_cycle_days.high}d`,
        _sortValue: pipeline?.totalValue ?? 0,
      }
    })
    .sort((a, b) => b._sortValue - a._sortValue)

  function handleRowClick(row: Record<string, string | number | boolean | null | undefined>): void {
    const categoryId = row['id'] as string
    router.push(`/prospects?category=${categoryId}`)
  }

  return (
    <Card header="Category Breakdown">
      <Table columns={COLUMNS} data={rows} onRowClick={handleRowClick} />
    </Card>
  )
}
