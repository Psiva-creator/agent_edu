import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CareerMemoryContext = createContext(null);

export function CareerMemoryProvider({ children }) {
  // Initialize from sessionStorage if available to persist across reloads
  const [memory, setMemory] = useState(() => {
    try {
      const stored = sessionStorage.getItem('careerMemory');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse career memory', e);
    }
    
    // Default initial empty state
    return {
      isActive: false,
      lastUpdated: null,
      personal_info: {
        name: '',
        current_role: '',
        target_role: '',
        location: '',
        experience_years: 0,
        education: '',
      },
      resume_intelligence: {
        skills: [],
        missing_skills: [],
        strengths: [],
        weaknesses: [],
        resume_score: 0,
        ats_score: 0,
        readiness_score: 0,
        certifications: [],
        projects: [],
      },
      career_analysis: {
        roadmap: null,
        jobs: null,
        market_insights: null,
        mentor_context: '',
        recommended_roles: [],
        salary_estimate: null,
      },
      raw_report: null, // The raw /api/v1/report response for fallback
      interview_history: [], // Stores completed interview sessions
      skill_intelligence: null, // Stores deep analytics on skills
    };
  });

  // Sync to sessionStorage whenever memory changes
  useEffect(() => {
    sessionStorage.setItem('careerMemory', JSON.stringify(memory));
  }, [memory]);

  const updateMemory = useCallback((updates) => {
    setMemory((prev) => ({
      ...prev,
      ...updates,
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const clearMemory = useCallback(() => {
    sessionStorage.removeItem('careerMemory');
    sessionStorage.removeItem('analysisResult'); // Clear old manual data
    sessionStorage.removeItem('analysisFormData');
    
    setMemory({
      isActive: false,
      lastUpdated: null,
      personal_info: {
        name: '', current_role: '', target_role: '', location: '', experience_years: 0, education: '',
      },
      resume_intelligence: {
        skills: [], missing_skills: [], strengths: [], weaknesses: [], resume_score: 0, ats_score: 0, readiness_score: 0, certifications: [], projects: [],
      },
      career_analysis: {
        roadmap: null, jobs: null, market_insights: null, mentor_context: '', recommended_roles: [], salary_estimate: null,
      },
      raw_report: null,
      interview_history: [],
      skill_intelligence: null,
    });
  }, []);

  // Update specific sub-sections to avoid overwriting everything
  const updatePersonalInfo = useCallback((info) => {
    setMemory((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, ...info },
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const updateResumeIntelligence = useCallback((intel) => {
    setMemory((prev) => ({
      ...prev,
      resume_intelligence: { ...prev.resume_intelligence, ...intel },
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const updateCareerAnalysis = useCallback((analysis) => {
    setMemory((prev) => ({
      ...prev,
      career_analysis: { ...prev.career_analysis, ...analysis },
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const addInterviewSession = useCallback((session) => {
    setMemory((prev) => ({
      ...prev,
      interview_history: [
        { ...session, date: new Date().toISOString() },
        ...(prev.interview_history || []),
      ].slice(0, 20), // keep last 20 sessions
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const updateSkillIntelligence = useCallback((data) => {
    setMemory((prev) => ({
      ...prev,
      skill_intelligence: data,
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const value = {
    memory,
    updateMemory,
    clearMemory,
    updatePersonalInfo,
    updateResumeIntelligence,
    updateCareerAnalysis,
    addInterviewSession,
    updateSkillIntelligence,
  };

  return (
    <CareerMemoryContext.Provider value={value}>
      {children}
    </CareerMemoryContext.Provider>
  );
}
