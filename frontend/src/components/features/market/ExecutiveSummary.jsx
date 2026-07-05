import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import Card from '../../ui/Card';

export default function ExecutiveSummary({ summary }) {
  if (!summary) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="col-span-full">
      <Card padding="lg" className="executive-summary-card">
        <div className="widget-header mb-4">
          <BookOpen size={20} className="text-primary" />
          <h3>AI Executive Summary</h3>
        </div>
        
        <p className="summary-overview">{summary.overview}</p>
        
        <div className="summary-grid mt-6">
          {summary.key_strengths && summary.key_strengths.length > 0 && (
            <div className="summary-column strengths">
              <h4 className="flex items-center text-success mb-3 gap-2">
                <CheckCircle size={16} /> Market Strengths
              </h4>
              <ul>
                {summary.key_strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          
          {summary.key_weaknesses && summary.key_weaknesses.length > 0 && (
            <div className="summary-column weaknesses">
              <h4 className="flex items-center text-error mb-3 gap-2">
                <XCircle size={16} /> Market Risks
              </h4>
              <ul>
                {summary.key_weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
