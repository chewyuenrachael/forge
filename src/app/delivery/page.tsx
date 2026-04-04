'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Heart, BookOpen, Target } from 'lucide-react'

import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EngagementTracker } from '@/components/delivery/EngagementTracker'
import { NewEngagementModal } from '@/components/delivery/NewEngagementModal'
import { NewPredictionModal } from '@/components/delivery/NewPredictionModal'
import { PredictionAccuracy } from '@/components/delivery/PredictionAccuracy'

import type {
  Engagement,
  Prediction,
  ModelFamily,
  CreateEngagementInput,
  UpdateEngagementInput,
  UpdateMilestoneInput,
  CreateMilestoneInput,
} from '@/types'
import type { PredictionOutcome } from '@/lib/constants'
import type { CreatePredictionInput, PredictionAccuracyReport } from '@/lib/predictions'

const CAPABILITY_IDS = [
  'cap-rlfr',
  'cap-reasoning-theater',
  'cap-alzheimers',
  'cap-rakuten-pii',
  'cap-model-diff',
  'cap-memorization',
  'cap-spd',
  'cap-evo2-tree',
  'cap-interpreting-evo2',
  'cap-reasoning-hood',
]

interface MilestoneRow {
  title: string
  due_date: string
}

const DeliveryPage = (): React.ReactElement => {
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [accuracy, setAccuracy] = useState<PredictionAccuracyReport | null>(null)
  const [modelFamilies, setModelFamilies] = useState<ModelFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [predictionModal, setPredictionModal] = useState<{ engagementId: string } | null>(null)

  // ─── Fetch Functions ───────────────────────────────────────────────

  const fetchEngagements = useCallback(async () => {
    try {
      const res = await fetch('/api/engagements')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data: Engagement[] }
      setEngagements(json.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engagements')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch('/api/predictions')
      if (!res.ok) return
      const json = await res.json() as { data: Prediction[] }
      setPredictions(json.data)
    } catch {
      // Non-critical — predictions will just show as empty
    }
  }, [])

  const fetchAccuracy = useCallback(async () => {
    try {
      const res = await fetch('/api/predictions?accuracy=true')
      if (!res.ok) return
      const json = await res.json() as { data: PredictionAccuracyReport }
      setAccuracy(json.data)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchModelFamilies = useCallback(async () => {
    try {
      const res = await fetch('/api/predictions?meta=model_families')
      if (!res.ok) return
      const json = await res.json() as { data: ModelFamily[] }
      setModelFamilies(json.data)
    } catch {
      // Non-critical — modal will work without model family options
    }
  }, [])

  useEffect(() => {
    void fetchEngagements()
    void fetchPredictions()
    void fetchAccuracy()
    void fetchModelFamilies()
  }, [fetchEngagements, fetchPredictions, fetchAccuracy, fetchModelFamilies])

  // ─── Engagement Mutation Handlers ──────────────────────────────────

  const handleCreateEngagement = useCallback(async (data: CreateEngagementInput, milestones: MilestoneRow[]) => {
    const res = await fetch('/api/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    const json = await res.json() as { data: Engagement }

    // Create initial milestones
    for (const ms of milestones) {
      if (ms.title.trim() && ms.due_date) {
        await fetch(`/api/engagements/${json.data.id}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: ms.title, status: 'upcoming', due_date: ms.due_date }),
        })
      }
    }

    await fetchEngagements()
  }, [fetchEngagements])

  const handleUpdateEngagement = useCallback(async (id: string, data: UpdateEngagementInput) => {
    // Optimistic update
    setEngagements((prev) => prev.map((eng) =>
      eng.id === id ? { ...eng, ...data, status: data.status ?? eng.status } as Engagement : eng
    ))

    try {
      const res = await fetch(`/api/engagements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchEngagements()
    } catch {
      await fetchEngagements() // Revert by re-fetching
    }
  }, [fetchEngagements])

  const handleDeleteEngagement = useCallback(async (id: string) => {
    const eng = engagements.find((e) => e.id === id)
    const message = eng?.status === 'active'
      ? 'This engagement is currently active. Delete anyway?'
      : 'Delete this engagement and all its milestones?'
    if (!window.confirm(message)) return

    setEngagements((prev) => prev.filter((e) => e.id !== id))

    try {
      const res = await fetch(`/api/engagements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    } catch {
      await fetchEngagements()
    }
  }, [engagements, fetchEngagements])

  const handleCreateMilestone = useCallback(async (
    engagementId: string,
    data: Omit<CreateMilestoneInput, 'engagement_id'>
  ) => {
    const res = await fetch(`/api/engagements/${engagementId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create milestone')
    await fetchEngagements()
  }, [fetchEngagements])

  const handleUpdateMilestone = useCallback(async (id: string, data: UpdateMilestoneInput) => {
    // Optimistic update
    setEngagements((prev) => prev.map((eng) => ({
      ...eng,
      milestones: eng.milestones.map((ms) => {
        if (ms.id !== id) return ms
        const updated = { ...ms, ...data } as Engagement['milestones'][number]
        // Auto-set completed_date for optimistic UI
        if (data.status === 'completed' && ms.status !== 'completed') {
          updated.completed_date = new Date().toISOString().slice(0, 10)
        } else if (data.status !== undefined && data.status !== 'completed' && ms.status === 'completed') {
          updated.completed_date = null
        }
        return updated
      }),
    })))

    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update milestone')
      await fetchEngagements()
    } catch {
      await fetchEngagements()
    }
  }, [fetchEngagements])

  const handleDeleteMilestone = useCallback(async (id: string) => {
    if (!window.confirm('Delete this milestone?')) return

    setEngagements((prev) => prev.map((eng) => ({
      ...eng,
      milestones: eng.milestones.filter((ms) => ms.id !== id),
    })))

    try {
      const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchEngagements()
    } catch {
      await fetchEngagements()
    }
  }, [fetchEngagements])

  // ─── Prediction Mutation Handlers ──────────────────────────────────

  const handleCreatePrediction = useCallback(async (data: CreatePredictionInput) => {
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      throw new Error(err.error)
    }
    await Promise.all([fetchPredictions(), fetchAccuracy()])
  }, [fetchPredictions, fetchAccuracy])

  const handleRecordOutcome = useCallback(async (id: string, outcome: PredictionOutcome, notes?: string) => {
    // Optimistic update
    setPredictions((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, outcome, outcome_notes: notes ?? null, outcome_date: new Date().toISOString().slice(0, 10) }
        : p
    ))

    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, outcomeNotes: notes }),
      })
      if (!res.ok) throw new Error('Failed to record outcome')
      await Promise.all([fetchPredictions(), fetchAccuracy()])
    } catch {
      await Promise.all([fetchPredictions(), fetchAccuracy()])
    }
  }, [fetchPredictions, fetchAccuracy])

  // ─── Computed Values ─────────────────────────────────────────────────

  const activeCount = engagements.filter((e) => e.status === 'active').length
  const avgHealth = engagements.length > 0
    ? Math.round(engagements.reduce((sum, e) => sum + e.health_score, 0) / engagements.length)
    : 0
  const totalCapabilities = new Set(engagements.flatMap((e) => e.capabilities_applied)).size

  const modelFamilyNames = new Map(modelFamilies.map((mf) => [mf.id, mf.name]))

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
        <PageContainer>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
            <div className="h-96 rounded-lg bg-elevated animate-pulse" />
          </div>
        </PageContainer>
      </>
    )
  }

  if (error && engagements.length === 0) {
    return (
      <>
        <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
        <PageContainer>
          <Card>
            <div className="text-center py-8">
              <p className="text-[#8A2020] text-sm font-medium">Failed to load delivery data</p>
              <p className="text-text-secondary text-xs mt-1 mb-4">{error}</p>
              <Button variant="secondary" onClick={() => { setLoading(true); void fetchEngagements() }}>
                Retry
              </Button>
            </div>
          </Card>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header title="Research Delivery Hub" subtitle="Engagement tracking and partner communication" />
      <PageContainer>
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              value={activeCount}
              label="Active Engagements"
              icon={<Activity size={18} />}
            />
            <MetricCard
              value={avgHealth}
              label="Average Health Score"
              icon={<Heart size={18} />}
              mono
            />
            <MetricCard
              value={totalCapabilities}
              label="Capabilities Deployed"
              icon={<BookOpen size={18} />}
            />
            {accuracy ? (
              <PredictionAccuracy accuracy={accuracy} compact />
            ) : (
              <MetricCard
                value="—"
                label="Prediction Accuracy"
                icon={<Target size={18} />}
              />
            )}
          </div>

          {/* Engagement Tracker */}
          <EngagementTracker
            engagements={engagements}
            predictions={predictions}
            accuracy={accuracy}
            onUpdateEngagement={handleUpdateEngagement}
            onDeleteEngagement={handleDeleteEngagement}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onCreateMilestone={handleCreateMilestone}
            onCreateEngagement={() => setShowModal(true)}
            onCreatePrediction={(engagementId) => setPredictionModal({ engagementId })}
            onRecordOutcome={handleRecordOutcome}
          />

          {/* Prediction Accuracy Dashboard */}
          {accuracy && predictions.length > 0 && (
            <PredictionAccuracy
              accuracy={accuracy}
              modelFamilyNames={modelFamilyNames}
            />
          )}
        </div>
      </PageContainer>

      {/* New Engagement Modal */}
      <NewEngagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateEngagement}
        availableCapabilities={CAPABILITY_IDS}
      />

      {/* New Prediction Modal */}
      {predictionModal && (
        <NewPredictionModal
          isOpen={true}
          onClose={() => setPredictionModal(null)}
          onSubmit={handleCreatePrediction}
          engagementId={predictionModal.engagementId}
          modelFamilies={modelFamilies}
        />
      )}
    </>
  )
}

export default DeliveryPage
