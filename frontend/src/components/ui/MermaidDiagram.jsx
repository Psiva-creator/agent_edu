import { useState, useEffect, useMemo } from 'react'
import mermaid from 'mermaid'
import { renderMermaidSafe } from '../../utils/mermaidUtils'

// Initialize Mermaid globally
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Inter, sans-serif',
    primaryColor: '#1e1b4b',
    primaryTextColor: '#fff',
    primaryBorderColor: '#818cf8',
    lineColor: '#6366f1',
    secondaryColor: '#1e3a8a',
    tertiaryColor: '#1e293b',
  },
  securityLevel: 'loose',
})

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('')
  const id = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, [])

  useEffect(() => {
    let mounted = true
    const renderChart = async () => {
      try {
        if (!chart) return
        const { svg: renderedSvg } = await renderMermaidSafe(id, chart)
        if (mounted) {
          setSvg(renderedSvg)
        }
      } catch (err) {
        if (mounted) {
          setSvg(`<div style="color: var(--status-error); padding: 16px; border: 1px dashed var(--status-error); border-radius: 8px; text-align: center; background: rgba(var(--error-rgb), 0.05); font-size: 14px;">
            <p style="margin: 0; font-weight: 600;">Unable to render diagram</p>
            <p style="margin: 4px 0 0 0; opacity: 0.8;">The AI generated invalid flowchart syntax.</p>
          </div>`)
        }
      }
    }
    renderChart()
    return () => { mounted = false }
  }, [chart, id])

  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
