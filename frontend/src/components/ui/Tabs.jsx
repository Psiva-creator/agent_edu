import { cn } from '../../utils/helpers'
import './Tabs.css'

export default function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <nav className={cn('tabs', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={cn('tabs__tab', activeTab === tab.id && 'tabs__tab--active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <tab.icon size={16} />}
          <span className="tabs__label">{tab.label}</span>
          {tab.count !== undefined && (
            <span className="tabs__count">{tab.count}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
