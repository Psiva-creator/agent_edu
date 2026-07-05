import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Globe2 } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

export default function CompanyGrid({ companies }) {
  if (!companies || companies.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="widget-header">
        <Building2 size={20} className="text-primary" />
        <h3>Top Hiring Companies</h3>
      </div>
      
      <div className="company-grid">
        {companies.map((company, idx) => (
          <motion.div 
            key={idx} 
            className="company-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + (idx * 0.05) }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="company-header">
              <div className="company-logo-placeholder">
                {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="company-title">
                <h4>{company.name}</h4>
                <span className="company-status">
                  <CheckCircle2 size={12} className="text-success" />
                  {company.hiring_status || 'Actively Hiring'}
                </span>
              </div>
            </div>
            
            <div className="company-details">
              {company.remote_percent !== undefined && (
                <div className="company-detail-item">
                  <Globe2 size={14} />
                  <span>{company.remote_percent}% Remote</span>
                </div>
              )}
            </div>

            {company.tech_stack && company.tech_stack.length > 0 && (
              <div className="company-tech">
                {company.tech_stack.slice(0, 3).map((tech, i) => (
                  <Badge key={i} variant="outline" size="sm">{tech}</Badge>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
