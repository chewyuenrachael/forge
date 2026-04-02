import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'

const OpsPage = () => {
  return (
    <>
      <Header title="Operations" subtitle="Pipeline, revenue, and engagement health" />
      <PageContainer>
        <div className="text-text-secondary">Operations Dashboard — pipeline view, revenue metrics, and engagement health.</div>
      </PageContainer>
    </>
  )
}

export default OpsPage
