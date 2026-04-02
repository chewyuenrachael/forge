import { type FC } from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export const Tabs: FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-border-subtle">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-accent-amber text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
