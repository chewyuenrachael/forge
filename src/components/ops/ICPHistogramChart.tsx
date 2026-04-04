'use client'

// Default export required by next/dynamic for lazy loading
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ICPScore } from '@/types'

interface ICPHistogramChartProps {
  scores: ICPScore[]
}

interface BucketData {
  range: string
  count: number
  label: string
}

const BUCKET_COLORS: Record<string, string> = {
  '0-20': '#8A8A9A',
  '21-40': '#8A8A9A',
  '41-60': '#B8860B',
  '61-80': '#5B8A3C',
  '81-100': '#3D6B35',
}

function ICPHistogramChart({ scores }: ICPHistogramChartProps): React.ReactElement {
  const buckets: BucketData[] = [
    { range: '0-20', count: 0, label: 'Low' },
    { range: '21-40', count: 0, label: 'Low' },
    { range: '41-60', count: 0, label: 'Medium' },
    { range: '61-80', count: 0, label: 'High' },
    { range: '81-100', count: 0, label: 'Critical' },
  ]

  for (const score of scores) {
    const c = score.composite
    if (c <= 20) buckets[0]!.count++
    else if (c <= 40) buckets[1]!.count++
    else if (c <= 60) buckets[2]!.count++
    else if (c <= 80) buckets[3]!.count++
    else buckets[4]!.count++
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={buckets} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
        <XAxis
          dataKey="range"
          tick={{ fill: '#8888A0', fontSize: 11 }}
          axisLine={{ stroke: '#2A2A3A' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8888A0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A1A25',
            border: '1px solid #2A2A3A',
            borderRadius: '6px',
            color: '#E8E8F0',
            fontSize: '12px',
          }}
          formatter={(value) => [`${String(value)} prospects`, 'Count']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {buckets.map((bucket) => (
            <Cell key={bucket.range} fill={BUCKET_COLORS[bucket.range] ?? '#8A8A9A'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// eslint-disable-next-line import/no-default-export -- required by next/dynamic
export default ICPHistogramChart
