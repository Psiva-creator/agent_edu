import { useState, useEffect, useMemo } from 'react'
import mermaid from 'mermaid'

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
        const { svg: renderedSvg } = await mermaid.render(id, chart)
        if (mounted) {
          setSvg(renderedSvg)
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (mounted) {
          setSvg(`<div style="color: #ef4444; padding: 16px;">Failed to render diagram</div>`)
        }
      }
    }
    renderChart()
    return () => { mounted = false }
  }, [chart, id])

  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
