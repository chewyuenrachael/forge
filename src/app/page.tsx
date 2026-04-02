import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'

const OverviewPage = () => {
  return (
    <>
      <Header title="Overview" subtitle="Goodfire Commercial Intelligence" />
      <PageContainer>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-display text-3xl font-semibold text-text-primary">10</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">Capabilities</div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-display text-3xl font-semibold text-text-primary">4</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">Active Engagements</div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-display text-3xl font-semibold text-text-primary">10</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">Active Signals</div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="font-display text-3xl font-semibold text-accent-amber font-mono">123d</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-text-secondary font-medium">Until EU AI Act</div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

export default OverviewPage
