/**
 * CareerScoreEngine
 * ═════════════════
 * Premium Career Match Score Engine component.
 * Displays the comprehensive AI-computed career match score with:
 *  - Animated circular score ring
 *  - Animated count-up score
 *  - Color-coded zones (Red/Orange/Blue/Green)
 *  - Component breakdown bars
 *  - Confidence meter
 *  - Strengths, Missing Skills, Growth Potential
 *  - "What increases this score?" section
 *  - Improve Score Suggestions
 *  - Auto-updates when resume is re-analyzed
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Target, ChevronDown, ChevronUp,
  Zap, Award, AlertCircle, Rocket, BarChart3,
  CheckCircle2, XCircle, Info, Sparkles, Star,
  Brain, ArrowUpRight,
} from 'lucide-react'
import ScoreRing from '../ui/ScoreRing'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import useCareerScore from '../../hooks/useCareerScore'
import './CareerScoreEngine.css'

// ─── Animation variants ───────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
}

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }

const barVariant = {
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
}

// ─── Sub-components ────────────────────────────────────────────

function BreakdownBar({ label, value, color, weight }) {
  return (
    <div className="cse-bar">
      <div className="cse-bar__header">
        <span className="cse-bar__label">{label}</span>
        <div className="cse-bar__meta">
          <span className="cse-bar__weight">{Math.round(weight * 100)}% weight</span>
          <span className="cse-bar__value" style={{ color }}>{Math.round(value)}</span>
        </div>
      </div>
      <div className="cse-bar__track">
        <motion.div
          className="cse-bar__fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </div>
    </div>
  )
}

function ConfidenceMeter({ confidence }) {
  const color = confidence >= 80 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444'
  const label = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low'
  return (
    <div className="cse-confidence">
      <div className="cse-confidence__header">
        <Brain size={13} />
        <span>Score Confidence</span>
        <span className="cse-confidence__label" style={{ color }}>{label} ({confidence}%)</span>
      </div>
      <div className="cse-confidence__track">
        <motion.div
          className="cse-confidence__fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        />
      </div>
      {confidence < 70 && (
        <p className="cse-confidence__hint">
          <Info size={11} /> Analyze your resume in the Resume tab to improve accuracy.
        </p>
      )}
    </div>
  )
}

function GrowthMeter({ potential, learningCurve, gap, color }) {
  return (
    <div className="cse-growth">
      <div className="cse-growth__header">
        <Rocket size={15} style={{ color }} />
        <span>Growth Potential</span>
        <span className="cse-growth__pace" style={{ color }}>{learningCurve} Growth</span>
      </div>
      <div className="cse-growth__track">
        <motion.div
          className="cse-growth__fill"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${potential}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        />
      </div>
      <p className="cse-growth__desc">
        With focused effort, you can close the <strong>{gap}-point gap</strong> to reach 100.
      </p>
    </div>
  )
}

function WhatIncreasesScore({ suggestions, color }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="cse-what">
      <button
        className="cse-what__toggle"
        onClick={() => setOpen(o => !o)}
        style={{ '--zone-color': color }}
      >
        <div className="cse-what__toggle-left">
          <Sparkles size={15} style={{ color }} />
          <span>What increases this score?</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="cse-what__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cse-what__grid">
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  className="cse-what__item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <span className="cse-what__icon">{s.icon}</span>
                  <div>
                    <p className="cse-what__title">{s.title}</p>
                    <p className="cse-what__desc">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────

export default function CareerScoreEngine() {
  const scoreData = useCareerScore()

  if (!scoreData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No analysis yet"
        description="Run a career analysis to see your Career Match Score."
        action={{ label: 'Start Analysis', href: '/analyze' }}
      />
    )
  }

  const {
    score, confidence, scoreColor, scoreLabel, scoreZone,
    components, missingSkills, missingPenalty,
    strengths, suggestions, improveSuggestions,
    growthPotential, learningCurve, gap,
    experienceYears, hasResume, targetRole,
  } = scoreData

  const componentEntries = Object.entries(components)

  return (
    <motion.div
      className={`cse cse--${scoreZone}`}
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* ── Hero: Score Ring + Summary ─────────────────────── */}
      <motion.div className="cse-hero" variants={fadeUp}>
        {/* Zone badge */}
        <div className="cse-hero__zone-badge" style={{ color: scoreColor, borderColor: `${scoreColor}33`, background: `${scoreColor}11` }}>
          <Star size={11} fill={scoreColor} />
          <span>{scoreLabel}</span>
        </div>

        {/* Ring */}
        <div className="cse-hero__ring-wrap">
          <div className="cse-hero__ring-glow" style={{ background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)` }} />
          <ScoreRing
            score={score}
            size={200}
            strokeWidth={16}
            label="MATCH SCORE"
            subLabel={scoreLabel}
            showLabel={true}
            animated={true}
          />
        </div>

        {/* Target role */}
        <p className="cse-hero__target">
          <Target size={13} />
          vs. <strong>{targetRole}</strong>
        </p>

        {/* Confidence */}
        <ConfidenceMeter confidence={confidence} />
      </motion.div>

      {/* ── Score Components Breakdown ─────────────────────── */}
      <motion.div className="cse-section" variants={fadeUp}>
        <div className="cse-section__header">
          <BarChart3 size={16} style={{ color: scoreColor }} />
          <h3>Score Breakdown</h3>
          {missingPenalty > 0 && (
            <span className="cse-penalty">
              <AlertCircle size={12} />
              -{missingPenalty}pt missing skills penalty
            </span>
          )}
        </div>
        <div className="cse-bars">
          {componentEntries.map(([key, comp]) => (
            <BreakdownBar
              key={key}
              label={comp.label}
              value={comp.value}
              weight={comp.weight}
              color={
                comp.value >= 75 ? '#22c55e' :
                comp.value >= 50 ? '#6366f1' :
                comp.value >= 25 ? '#f59e0b' :
                '#ef4444'
              }
            />
          ))}
        </div>
      </motion.div>

      {/* ── Strengths ──────────────────────────────────────── */}
      {strengths.length > 0 && (
        <motion.div className="cse-section" variants={fadeUp}>
          <div className="cse-section__header">
            <Award size={16} style={{ color: '#22c55e' }} />
            <h3>Your Strengths</h3>
          </div>
          <div className="cse-tags">
            {strengths.map((s, i) => (
              <motion.div
                key={i}
                className="cse-strength-tag"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                <span>{s}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Missing Skills ─────────────────────────────────── */}
      {missingSkills.length > 0 && (
        <motion.div className="cse-section" variants={fadeUp}>
          <div className="cse-section__header">
            <XCircle size={16} style={{ color: '#ef4444' }} />
            <h3>Missing Skills</h3>
            <span className="cse-section__count" style={{ background: '#ef444422', color: '#ef4444' }}>
              {missingSkills.length}
            </span>
          </div>
          <div className="cse-tags">
            {missingSkills.map((skill, i) => (
              <motion.div
                key={i}
                className="cse-missing-tag"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <span>{skill}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Growth Potential ───────────────────────────────── */}
      <motion.div className="cse-section" variants={fadeUp}>
        <GrowthMeter
          potential={growthPotential}
          learningCurve={learningCurve}
          gap={gap}
          color={scoreColor}
        />
      </motion.div>

      {/* ── What Increases Score ───────────────────────────── */}
      {suggestions.length > 0 && (
        <motion.div className="cse-section" variants={fadeUp}>
          <WhatIncreasesScore suggestions={suggestions} color={scoreColor} />
        </motion.div>
      )}

      {/* ── Improve Score Suggestions ──────────────────────── */}
      {improveSuggestions.length > 0 && (
        <motion.div className="cse-section" variants={fadeUp}>
          <div className="cse-section__header">
            <Zap size={16} style={{ color: '#f59e0b' }} />
            <h3>Improve Your Score</h3>
          </div>
          <ol className="cse-suggestions">
            {improveSuggestions.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="cse-suggestions__num" style={{ color: scoreColor }}>{i + 1}</span>
                <span>{s}</span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* ── Resume tip if no resume analyzed ─────────────────── */}
      {!hasResume && (
        <motion.div className="cse-tip" variants={fadeUp}>
          <Info size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
          <p>
            <strong>Boost accuracy:</strong> Analyze your resume in the{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'resume' })) }}>
              Resume tab
            </a>{' '}
            to unlock ATS, Skills, Projects, and Certifications signals.
          </p>
          <ArrowUpRight size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
        </motion.div>
      )}
    </motion.div>
  )
}
