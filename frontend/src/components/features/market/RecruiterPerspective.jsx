import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Quote } from 'lucide-react';
import Card from '../../ui/Card';

export default function RecruiterPerspective({ data }) {
  if (!data || !data.perspective) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="col-span-full">
      <Card padding="lg" className="h-full bg-gradient-to-r from-[rgba(var(--accent-primary-rgb),0.05)] to-[var(--bg-card)] border-l-4 border-l-[var(--accent-primary)]">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-full bg-[var(--bg-modifier-hover)] border border-[var(--border)] shadow-inner">
            <Briefcase size={24} className="text-secondary" />
          </div>
          <div className="flex-1 relative">
            <Quote size={40} className="absolute -top-4 -left-4 text-[var(--accent-primary)] opacity-10" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-3">Recruiter Perspective</h3>
            <p className="text-lg md:text-xl font-medium leading-relaxed text-[var(--text-primary)] italic">
              "{data.perspective}"
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
