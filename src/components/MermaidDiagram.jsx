import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../context/ThemeContext';

let counter = 0;

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

export default function MermaidDiagram({ chart, caption }) {
  const ref = useRef(null);
  const { dark } = useTheme();
  const [uid] = useState(() => `mermaid_${++counter}`);

  useEffect(() => {
    if (!ref.current || !chart) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? 'dark' : 'default',
      securityLevel: 'loose',
      themeVariables: dark
        ? { primaryColor: '#1c1c1e', primaryTextColor: '#f5f5f7', lineColor: '#48484a' }
        : {},
    });

    const renderChart = async () => {
      try {
        ref.current.innerHTML = '';
        const renderId = `${uid}_${Date.now()}`;
        const { svg } = await mermaid.render(renderId, chart);
        ref.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        ref.current.innerHTML = '<span style="color:var(--accent-red);font-size:0.8rem">Diagram render error</span>';
      }
    };

    renderChart();
  }, [chart, dark, uid]);

  return (
    <figure className="mermaid-wrap">
      <div ref={ref} />
      {caption && <figcaption className="mermaid-caption">{caption}</figcaption>}
    </figure>
  );
}
