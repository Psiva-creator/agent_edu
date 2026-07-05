import axios from 'axios'
import {
  mockCareerAnalysis,
  mockRoadmap,
  mockJobs,
  mockResume,
} from './mockData'

// Base API client for communicating with the FastAPI backend
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

/**
 * Helper: try the real API first, fall back to mock data on error.
 */
async function withMockFallback(apiCall, mockData) {
  try {
    return await apiCall()
  } catch (err) {
    console.warn('[API] Backend unavailable, using mock data:', err.message)
    // Simulate network delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return mockData
  }
}

// --- Career Report (main analysis endpoint) ---
// Backend: POST /api/v1/report → CareerReportRequest → CareerReportResponse
export const analyzeCareer = async (data) => {
  return withMockFallback(async () => {
    const response = await api.post('/report', {
      name: data.name || data.current_role || 'User',
      current_role: data.current_role,
      target_role: data.target_role,
      skills: data.skills || [],
      experience_years: data.experience_years || 0,
      education: data.education || null,
      location: data.location || null,
    })
    return response.data
  }, mockCareerAnalysis)
}

// --- Job Search ---
// Backend: GET /api/v1/jobs?query=...&location=...
export const searchJobs = async (params) => {
  return withMockFallback(async () => {
    const response = await api.get('/jobs', { params })
    return response.data
  }, mockJobs)
}

// --- Roadmap ---
// Backend: POST /api/v1/roadmap → RoadmapRequest → RoadmapResponse
export const getRoadmap = async (data) => {
  return withMockFallback(async () => {
    const response = await api.post('/roadmap', {
      current_role: data.current_role || 'Student',
      target_role: data.target_role || 'Software Engineer',
      skill_gaps: data.skill_gaps || [],
      hours_per_week: data.hours_per_week || 10,
      deadline_weeks: data.deadline_weeks || 10,
      skills: data.skills || [],
    })
    return response.data
  }, mockRoadmap)
}

// --- Resume Analysis ---
// Backend: POST /api/v1/resume/analyze → ResumeAnalysisRequest (JSON) → ResumeAnalysisResponse
export const analyzeResume = async (data) => {
  return withMockFallback(async () => {
    const response = await api.post('/resume/analyze', {
      resume_text: data.resume_text,
      target_role: data.target_role || 'Software Engineer',
    })
    return response.data
  }, mockResume)
}

// --- Resources ---
// Backend: GET /api/v1/resources → ResourceListResponse
export const getResources = async () => {
  return withMockFallback(async () => {
    const response = await api.get('/resources')
    return response.data
  }, { skills: [], total: 0 })
}

// Backend: GET /api/v1/resources/{skill} → ResourceSearchResponse
export const getSkillResources = async (skill) => {
  return withMockFallback(async () => {
    const response = await api.get(`/resources/${encodeURIComponent(skill)}`)
    return response.data
  }, { found: false, query: skill })
}

// --- Report HTML/PDF ---
// Backend: GET /api/v1/report/html
export const getReportHtml = async () => {
  const response = await api.get('/report/html', { responseType: 'text' })
  return response.data
}

// Backend: GET /api/v1/report/pdf
export const getReportPdf = async () => {
  const response = await api.get('/report/pdf', { responseType: 'blob' })
  return response.data
}

// --- Mentor Q&A ---
// Backend: POST /api/v1/mentor → MentorQuestionRequest → MentorQuestionResponse
export const askMentor = async (question, careerContext = null) => {
  return withMockFallback(async () => {
    const response = await api.post('/mentor', {
      question,
      career_context: careerContext,
    })
    return response.data
  }, { answer: "Consistency is key to mastering new technologies! Keep practicing daily." })
}

export default api

