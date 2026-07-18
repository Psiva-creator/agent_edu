import React, { createContext, useState, useEffect, useCallback } from 'react';
import { analyzeResumeText, analyzeProfile, generateRoadmap, searchJobs } from '../services/api';
import { transformReportToMemory } from '../utils/profileTransformer';

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

  const syncActiveResumeState = useCallback(async (resumeText, targetRole, profileSuggestion = null) => {
    // 1. Analyze Resume text
    const analysis = await analyzeResumeText({
      resume_text: resumeText,
      target_role: targetRole || memory.personal_info?.target_role || 'Software Engineer'
    });

    // 2. Analyze Profile
    const payload = {
      name: profileSuggestion?.name || memory.personal_info?.name || 'Resume Candidate',
      current_role: profileSuggestion?.current_role || memory.personal_info?.current_role || 'Candidate',
      target_role: targetRole || profileSuggestion?.target_role || memory.personal_info?.target_role || analysis.target_role || 'Software Engineer',
      skills: analysis.extracted_skills || [],
      experience_years: profileSuggestion?.experience_years !== undefined ? profileSuggestion.experience_years : (memory.personal_info?.experience_years || analysis.experience_years || 0),
      education: profileSuggestion?.education || memory.personal_info?.education || '',
      location: profileSuggestion?.location || memory.personal_info?.location || '',
    };
    
    const reportResult = await analyzeProfile(payload);
    reportResult.resume_analysis = analysis;
    reportResult.resume_text = resumeText;
    reportResult.resume_score = analysis.score || 85;
    reportResult.ats_score = analysis.score || 80;
    reportResult.strengths = analysis.strengths || [];
    reportResult.weaknesses = analysis.improvements || [];

    // 3. Generate Roadmap
    const skillGaps = reportResult.skill_gaps || reportResult.missing_skills || [];
    try {
      const roadmapRes = await generateRoadmap({
        current_role: reportResult.current_role || 'Candidate',
        target_role: reportResult.target_role,
        skill_gaps: skillGaps,
        hours_per_week: 10,
        deadline_weeks: 12,
        skills: reportResult.skills || []
      });
      reportResult.roadmap = roadmapRes;
    } catch (e) {
      console.error("Roadmap sync failed:", e);
    }

    // 4. Match Jobs
    try {
      const jobsRes = await searchJobs(reportResult.target_role, reportResult.location || '');
      reportResult.jobs = jobsRes;
    } catch (e) {
      console.error("Jobs sync failed:", e);
    }

    // 5. Update Memory State
    const newMemory = transformReportToMemory(reportResult);
    setMemory(newMemory);

    return {
      newMemory,
      profileSuggestion
    };
  }, [memory]);

  const value = {
    memory,
    updateMemory,
    clearMemory,
    updatePersonalInfo,
    updateResumeIntelligence,
    updateCareerAnalysis,
    addInterviewSession,
    updateSkillIntelligence,
    syncActiveResumeState,
  };

  return (
    <CareerMemoryContext.Provider value={value}>
      {children}
    </CareerMemoryContext.Provider>
  );
}
