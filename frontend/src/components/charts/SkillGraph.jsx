import { useMemo } from 'react'
import MermaidDiagram from '../ui/MermaidDiagram'

export default function SkillGraph({ skills, targetRole }) {
  const chartCode = useMemo(() => {
    if (!skills || skills.length === 0) return ''

    let code = `graph TD\n`
    code += `  %% Nodes\n`
    code += `  Target["${targetRole}"]:::target\n`

    skills.forEach(s => {
      const id = s.name.replace(/[^a-zA-Z0-9]/g, '')
      const style = s.is_gap ? 'gap' : 'current'
      code += `  ${id}["${s.name}"]:::${style}\n`
    })

    code += `\n  %% Edges\n`
    skills.forEach(s => {
      const id = s.name.replace(/[^a-zA-Z0-9]/g, '')
      
      // Connect to target role based on demand
      if (s.market_demand >= 80) {
        code += `  ${id} == High Demand ==> Target\n`
      } else {
        code += `  ${id} --> Target\n`
      }

      // Connect to related skills
      s.related_skills.forEach(rs => {
        const matchingSkill = skills.find(xs => xs.name.toLowerCase() === rs.toLowerCase())
        if (matchingSkill) {
          const rsId = matchingSkill.name.replace(/[^a-zA-Z0-9]/g, '')
          code += `  ${id} -.-> ${rsId}\n`
        }
      })
    })

    code += `\n  %% Styles\n`
    code += `  classDef target fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;\n`
    code += `  classDef current fill:#1e3a8a,stroke:#3b82f6,stroke-width:1px,color:#fff;\n`
    code += `  classDef gap fill:#7f1d1d,stroke:#ef4444,stroke-width:1px,color:#fff;\n`

    return code
  }, [skills, targetRole])

  if (!chartCode) return null

  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)' }}>
      <MermaidDiagram chart={chartCode} />
    </div>
  )
}
