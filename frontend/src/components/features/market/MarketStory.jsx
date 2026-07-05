import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import Card from '../../ui/Card';

export default function MarketStory({ data }) {
  if (!data || !data.narrative) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full bg-[var(--bg-modifier-hover)] border-[var(--border)]">
        <div className="widget-header mb-4">
          <BookOpen size={20} className="text-[var(--text-primary)]" />
          <h3>The Market Story</h3>
        </div>
        
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-sm leading-loose text-secondary first-letter:text-3xl first-letter:font-bold first-letter:text-[var(--accent-primary)] first-letter:mr-1 first-letter:float-left">
            {data.narrative}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
