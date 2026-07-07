export function transformReportToMemory(report) {
  if (!report) return null;

  return {
    isActive: true,
    lastUpdated: new Date().toISOString(),
    personal_info: {
      name: report.name || '',
      current_role: report.current_role || '',
      target_role: report.target_role || '',
      location: report.location || '',
      experience_years: report.experience_years || 0,
      education: report.education || '',
      resume_text: report.resume_text || '',
    },
    resume_intelligence: {
      skills: report.skills || [],
      missing_skills: report.skill_gaps || report.missing_skills || [],
      strengths: report.strengths || [],
      weaknesses: report.weaknesses || [],
      resume_score: report.resume_score || 0,
      ats_score: report.ats_score || 0,
      readiness_score: report.readiness_score || 0,
      certifications: report.certifications || [],
      projects: report.projects || [],
      raw_analysis: report.resume_analysis || null,
    },
    career_analysis: {
      roadmap: report.roadmap || null,
      jobs: report.jobs || null,
      market_insights: report.market_data || report.market_insights || null,
      mentor_context: report.mentor_advice || report.mentor_context || '',
      recommended_roles: report.target_roles || [],
      salary_estimate: report.expected_salary || null,
    },
    raw_report: report,
  };
}
