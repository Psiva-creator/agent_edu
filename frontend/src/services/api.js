import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

// ── Career Intelligence Report (main analysis endpoint) ──
// Backend: POST /api/v1/report → CareerReportRequest → CareerReportResponse
export const analyzeProfile = async (profile) => {
  const res = await api.post('/report', {
    name: profile.name || 'User',
    current_role: profile.current_role || profile.degree || 'Student',
    target_role: profile.target_role || profile.career_goal || 'Software Engineer',
    skills: profile.skills || [],
    experience_years: parseInt(profile.experience_years || profile.experience) || 0,
    education: profile.education || (profile.degree ? `${profile.degree} ${profile.branch || ''}`.trim() : null),
    location: profile.location || null,
  })
  return res.data
}

// ── Job Search (query params) ──
// Backend: GET /api/v1/jobs?query=...&location=...
export const searchJobs = async (query = '', location = '') => {
  const res = await api.get('/jobs', { params: { query, location } })
  return res.data
}

// ── Career Roadmap ──
// Backend: POST /api/v1/roadmap → RoadmapRequest → RoadmapResponse
export const generateRoadmap = async (data) => {
  const res = await api.post('/roadmap', {
    current_role: data.current_role || 'Student',
    target_role: data.target_role || 'Software Engineer',
    skill_gaps: data.skill_gaps || [],
    hours_per_week: data.hours_per_week || 10,
    deadline_weeks: data.deadline_weeks || 10,
    skills: data.skills || [],
  })
  return res.data
}

// ── Resume Analysis (JSON body) ──
// Backend: POST /api/v1/resume/analyze → ResumeAnalysisRequest → ResumeAnalysisResponse
export const analyzeResumeText = async (data) => {
  const res = await api.post('/resume/analyze', {
    resume_text: data.resume_text,
    target_role: data.target_role || 'Software Engineer',
  })
  return res.data
}

// ── Resume File Upload ──
export const uploadResume = async (formData) => {
  const res = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// ── Export Resume (PDF) ──
export const exportResumePdf = async (resumeData) => {
  const res = await api.post('/resume/export/pdf', resumeData, {
    responseType: 'blob'
  })
  return res.data
}

// ── Enhance Project Description ──
export const enhanceProjectDescription = async (description) => {
  const res = await api.post('/resume/enhance-project', { description })
  return res.data
}

// ── Mentor Advice ──
// Backend: POST /api/v1/mentor → MentorQuestionRequest → MentorQuestionResponse
export const askMentor = async (data) => {
  const res = await api.post('/mentor', {
    question: data.question || data,
    career_context: data.context || data.career_context || null,
  })
  return res.data
}

// ── Resources ──
export const getResources = async () => {
  const res = await api.get('/resources')
  return res.data
}

export const getSkillResources = async (skill) => {
  const res = await api.get(`/resources/${encodeURIComponent(skill)}`)
  return res.data
}

// ── Report PDF ──
export const getReportPdf = async () => {
  const res = await api.get('/report/pdf', { responseType: 'blob' })
  return res.data
}

// ── Report HTML ──
export const getReportHtml = async () => {
  const res = await api.get('/report/html', { responseType: 'text' })
  return res.data
}

// ── Health Check ──
export const healthCheck = async () => {
  const res = await axios.get('/health')
  return res.data
}

// ── Interview Simulator ──
export const generateInterviewQuestion = async (data) => {
  const res = await api.post('/interview/question', data)
  return res.data
}

export const evaluateInterviewAnswer = async (data) => {
  const res = await api.post('/interview/evaluate', data)
  return res.data
}

export const getInterviewFinalScore = async (data) => {
  const res = await api.post('/interview/final-score', data)
  return res.data
}

// ── Skills Dashboard ──
export const analyzeSkills = async (data) => {
  const res = await api.post('/skills/analyze', data)
  return res.data
}

export default api
