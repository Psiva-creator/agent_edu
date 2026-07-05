import React from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Cloud, Zap } from 'lucide-react';

export default function CareerWeather({ condition }) {
  if (!condition) return null;

  const weatherConfig = {
    'Sunny': { icon: Sun, color: 'text-warning', bg: 'bg-warning', desc: 'Clear skies, abundant opportunities' },
    'Cloudy': { icon: Cloud, color: 'text-secondary', bg: 'bg-secondary', desc: 'Slight cooling, stay competitive' },
    'Storm': { icon: CloudRain, color: 'text-error', bg: 'bg-error', desc: 'Turbulent market, high competition' },
    'Booming': { icon: Zap, color: 'text-accent', bg: 'bg-accent', desc: 'Explosive growth, high demand' }
  };

  // Find a match or default to Sunny
  const normalizedCondition = Object.keys(weatherConfig).find(k => condition.toLowerCase().includes(k.toLowerCase())) || 'Sunny';
  const config = weatherConfig[normalizedCondition];
  const Icon = config.icon;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-opacity-10 mb-3 ${config.color.replace('text-', 'bg-')}`}>
        <Icon size={32} className={config.color} />
      </div>
      <h4 className="text-sm font-bold uppercase tracking-wider">{normalizedCondition}</h4>
      <p className="text-xs text-secondary text-center mt-1 max-w-[120px]">{config.desc}</p>
    </motion.div>
  );
}
