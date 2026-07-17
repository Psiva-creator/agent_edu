import mermaid from 'mermaid';

export function sanitizeMermaid(input) {
  if (!input) return '';
  let code = String(input).trim();

  // 1. Extract from markdown code fences if present
  const mermaidRegex = /```(?:mermaid)?\s*([\s\S]*?)```/;
  const match = code.match(mermaidRegex);
  if (match) {
    code = match[1];
  } else {
    // 2. If no code fence, strip AI conversational prefix/suffix by finding the first valid keyword
    const startKeywords = [
      'flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 
      'stateDiagram', 'stateDiagram-v2', 'gantt', 'journey', 'pie', 'erDiagram'
    ];
    let minIndex = -1;
    for (const kw of startKeywords) {
      const idx = code.indexOf(kw);
      if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
        minIndex = idx;
      }
    }
    if (minIndex !== -1) {
      code = code.substring(minIndex);
    }
  }

  code = code.trim();

  // 3. Ensure it starts with a valid declaration
  const validStart = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|gantt|journey|pie|erDiagram)/i;
  if (!validStart.test(code)) {
    code = 'flowchart TD\n' + code;
  }

  // 4. Line by line sanitization
  const lines = code.split('\n');
  const sanitizedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Fix invalid arrows (e.g., -> or ---> becomes -->)
    // Only apply if it looks like a graph/flowchart edge
    line = line.replace(/([^-\s])\s*-{1,4}>\s*([^-\s])/g, '$1 --> $2');
    
    // Remove typical HTML tags that break Mermaid 11+
    line = line.replace(/<\/?(div|span|br|p|b|i|strong|em)[^>]*>/gi, ' ');

    // Strip problematic characters in labels if not properly escaped,
    // For simplicity, we just strip backticks which often break things
    line = line.replace(/`/g, '');
    
    sanitizedLines.push(line);
  }
  
  return sanitizedLines.join('\n');
}

export async function renderMermaidSafe(id, code) {
  if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
    console.debug("Mermaid source:", code);
  }
  
  let sanitizedCode = sanitizeMermaid(code);
  
  try {
    // Mermaid 11+ async parse
    await mermaid.parse(sanitizedCode);
  } catch (err) {
    if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
      console.debug("Mermaid parse error on sanitized code:", err);
      console.debug("Attempting fallback sanitization...");
    }
    
    // Fallback: Extremely aggressive sanitization for flowcharts
    if (sanitizedCode.startsWith('flowchart') || sanitizedCode.startsWith('graph')) {
      const lines = sanitizedCode.split('\n');
      const fixedLines = lines.map(line => {
        if (line.includes('-->')) return line; // complex to fix edges, leave them
        // Remove quotes around node IDs
        let l = line.replace(/"/g, '');
        // Replace node ID spaces with underscores (before the bracket)
        const bracketMatch = l.match(/^([^\[\(\{]+)([\[\(\{].*)$/);
        if (bracketMatch) {
          const rawId = bracketMatch[1];
          const rest = bracketMatch[2];
          const cleanId = rawId.replace(/[^a-zA-Z0-9_]/g, '');
          return `${cleanId}${rest}`;
        }
        return l;
      });
      sanitizedCode = fixedLines.join('\n');
      
      try {
        await mermaid.parse(sanitizedCode);
      } catch (fallbackErr) {
        if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
          console.error("Mermaid strict parse error:", fallbackErr);
        }
        throw fallbackErr;
      }
    } else {
      throw err;
    }
  }

  return await mermaid.render(id, sanitizedCode);
}
