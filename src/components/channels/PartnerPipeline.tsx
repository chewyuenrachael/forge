import { type FC, useMemo } from 'react'
import { ArrowRight } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import type { ChannelPartner } from '@/types'

interface PartnerPipelineProps {
  partners: ChannelPartner[]
}

interface StageInfo {
  key: ChannelPartner['relationship_status']
  label: string
  color: string
  bgColor: string
}

const STAGES: StageInfo[] = [
  { key: 'cold', label: 'Cold', color: '#5C5A50', bgColor: '#E8E4D9' },
  { key: 'warm_intro', label: 'Warm Intro', color: '#8A6B20', bgColor: '#EDE0C8' },
  { key: 'active_conversation', label: 'Active Conv.', color: '#3A5A80', bgColor: '#D4E0ED' },
  { key: 'partnership_signed', label: 'Signed', color: '#3D6B35', bgColor: '#D4E7D0' },
  { key: 'certified', label: 'Certified', color: '#5A3D80', bgColor: '#E4D8ED' },
]

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

export const PartnerPipeline: FC<PartnerPipelineProps> = ({ partners }) => {
  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const stagePartners = partners.filter((p) => p.relationship_status === stage.key)
      const totalRevenue = stagePartners.reduce((sum, p) => sum + p.estimated_annual_revenue, 0)
      return { ...stage, count: stagePartners.length, totalRevenue }
    })
  }, [partners])

  return (
    <Card header="Partnership Pipeline">
      <div className="flex items-stretch gap-1">
        {stageData.map((stage, i) => (
          <div key={stage.key} className="flex items-stretch flex-1">
            <div
              className="flex-1 rounded-md p-3 text-center"
              style={{ backgroundColor: stage.bgColor }}
            >
              <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: stage.color }}>
                {stage.label}
              </div>
              <div className="text-2xl font-semibold font-mono mb-1" style={{ color: stage.color }}>
                {stage.count}
              </div>
              <div className="text-xs font-mono" style={{ color: stage.color, opacity: 0.7 }}>
                {formatCurrency(stage.totalRevenue)}
              </div>
            </div>
            {i < stageData.length - 1 && (
              <div className="flex items-center px-0.5 text-text-tertiary">
                <ArrowRight size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
