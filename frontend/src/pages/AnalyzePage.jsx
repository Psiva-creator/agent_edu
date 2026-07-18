import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles, User, Code, Compass, CheckCircle, Upload, FileText, AlertTriangle, Loader } from 'lucide-react'
import { 
  uploadResume, reparseResumeText, getProfile,
  startAnalysisJob, retryAnalysisJob, getAnalysisJobStatus
} from '../services/api'
import { supabase } from '../lib/supabase'
import { useCareerMemory } from '../hooks/useCareerMemory'
import { transformReportToMemory } from '../utils/profileTransformer'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import TextArea from '../components/ui/TextArea'
import StepIndicator from '../components/ui/StepIndicator'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import './AnalyzePage.css'

const STEPS = ['Mode', 'Personal Info', 'Skills & Interests', 'Career Goals', 'Review']

const PIPELINE_STAGES = [
  { id: 'upload', label: 'Resume Uploaded & Extracted' },
  { id: 'analyze', label: 'Resume Analyzed (ATS & Skills)' },
  { id: 'report', label: 'Career Intelligence Generated' },
  { id: 'roadmap', label: 'Personalized Roadmap Created' },
  { id: 'jobs', label: 'Market Jobs Matched' },
  { id: 'mentor', label: 'AI Mentor Initialized' },
  { id: 'memory', label: 'Career Memory Saved' }
]

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(null) // 'upload' or 'manual'
  const [file, setFile] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [activeJob, setActiveJob] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  
  const [form, setForm] = useState({
    name: '', age: '', degree: '', branch: '', cgpa: '',
    current_role: '', target_role: '',
    skills: [], interests: [], preferred_domain: '',
    career_goal: '', experience_years: '0',
    education: '', location: '',
  })
  
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [errors, setErrors] = useState({})
  
  const { updateMemory, clearMemory } = useCareerMemory()
  const fileInputRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const pollingStartTimeRef = useRef(0)

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const addTag = (field, value, setInput) => {
    const v = value.trim()
    if (v && !form[field].includes(v)) update(field, [...form[field], v])
    setInput('')
  }

  const removeTag = (field, val) => {
    update(field, form[field].filter(s => s !== val))
  }

  const handleTagKey = (e, field, value, setInput) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(field, value, setInput)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return;
    
    if (selected.size > 8 * 1024 * 1024) {
      setGlobalError('File size exceeds 8MB limit. Please upload a smaller file.')
      setFile(null)
      return;
    }
    
    const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = selected.name.toLowerCase().split('.').pop();
    if (validTypes.includes(selected.type) || ['pdf', 'txt', 'png', 'jpg', 'jpeg', 'docx'].includes(ext)) {
      setFile(selected)
      setGlobalError(null)
      setExtractedData(null)
    } else {
      setGlobalError('Unsupported file format. Please upload PDF, DOCX, TXT, PNG, or JPG.')
      setFile(null)
    }
  }
  
  const handleLoadSample = () => {
    const sampleText = `John Doe\njohndoe@email.com | San Francisco, CA\n\nSUMMARY\nSoftware Engineer with 4 years of experience building scalable web applications. Proficient in React, Node.js, and Python.\n\nEXPERIENCE\nFrontend Developer, Tech Corp\n2020 - Present\n- Built modern React applications improving user engagement by 30%\n- Optimized Webpack build times by 50%\n- Collaborated with UX team to redesign main dashboard\n\nJunior Developer, Web Solutions Inc.\n2018 - 2020\n- Developed RESTful APIs using Node.js and Express\n- Migrated legacy frontend to Vue.js\n\nEDUCATION\nB.S. Computer Science, University of California\n2014 - 2018\n\nSKILLS\nReact, JavaScript, Python, Node.js, HTML, CSS, SQL`

    const sampleFile = new File([sampleText], 'sample_resume.txt', { type: 'text/plain' })
    setFile(sampleFile)
    setGlobalError(null)
    setExtractedData(null)
  }

  const handleExtractOnly = async () => {
    if (!file) return;
    setIsExtracting(true);
    setGlobalError(null);
    try {
      const res = await uploadResume(file);
      if (res.confidence === 'low' && (!res.text || !res.text.trim())) {
        setGlobalError(res.warning || "We couldn't read this file automatically. You can enter your details manually.");
        setMode('manual');
        setFile(null);
      } else {
        setExtractedData(res);
        if (res.structured) {
          setForm(prev => ({
            ...prev,
            name: res.structured.name || prev.name,
            current_role: res.structured.current_role || prev.current_role,
            target_role: res.structured.target_role || prev.target_role,
            skills: res.structured.skills || res.structured.extracted_skills || prev.skills,
            experience_years: res.structured.experience_years !== undefined ? String(res.structured.experience_years) : prev.experience_years,
            education: res.structured.education || prev.education,
          }));
        }
      }
    } catch (err) {
      setGlobalError(err.message || 'Failed to upload and extract resume.');
    } finally {
      setIsExtracting(false);
    }
  }

  const validateStep = () => {
    const e = {}
    if (step === 0 && !mode) return false
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Name is required'
      if (!form.current_role.trim()) e.current_role = 'Current role is required'
    }
    if (step === 3) {
      if (!form.target_role.trim()) e.target_role = 'Target role is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { 
    if (validateStep()) {
      if (step === 0 && mode === 'upload' && file) {
        if (!extractedData) {
          handleExtractOnly();
        } else {
          handlePipelineSubmit();
        }
      } else {
        setStep(s => Math.min(s + 1, 4))
      }
    } 
  }
  
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = (jobId) => {
    stopPolling();
    pollingStartTimeRef.current = Date.now();
    
    pollIntervalRef.current = setInterval(async () => {
      const elapsed = (Date.now() - pollingStartTimeRef.current) / 1000;
      if (elapsed > 90) {
        stopPolling();
        setGlobalError("Analysis is taking longer than expected. Please retry.");
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            await supabase
              .from('analysis_jobs')
              .update({
                status: 'failed',
                error_message: 'Analysis is taking longer than expected. Please retry.',
                updated_at: new Date().toISOString()
              })
              .eq('id', jobId);
          }
        } catch (err) {
          console.error("Failed to update timeout status in Supabase", err);
        }
        return;
      }
      
      try {
        const job = await getAnalysisJobStatus(jobId);
        if (!job) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from('analysis_jobs')
            .upsert({
              id: job.id,
              user_id: session.user.id,
              status: job.status,
              current_step: job.current_step,
              error_message: job.error_message || null,
              result: job.result || null,
              created_at: job.created_at,
              updated_at: new Date().toISOString(),
              completed_at: job.completed_at || null
            });
        }
        
        setActiveJob(job);
        
        if (job.status === 'completed') {
          stopPolling();
          const memoryData = transformReportToMemory(job.result);
          clearMemory();
          updateMemory(memoryData);
          navigate('/dashboard', { replace: true });
        } else if (job.status === 'failed') {
          stopPolling();
          setGlobalError(job.error_message || "Pipeline failed. Please try again.");
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 2500);
  };

  useEffect(() => {
    let active = true;
    
    const checkExistingJobAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setInitialLoading(false);
          return;
        }
        
        const { data: job } = await supabase
          .from('analysis_jobs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (job) {
          setActiveJob(job);
          
          if (job.status === 'completed') {
            const memoryData = transformReportToMemory(job.result);
            clearMemory();
            updateMemory(memoryData);
            navigate('/dashboard', { replace: true });
            return;
          } else if (job.status === 'pending' || job.status === 'processing') {
            setIsProcessing(true);
            startPolling(job.id);
          } else if (job.status === 'failed') {
            setGlobalError(job.error_message || "Analysis failed. Please retry.");
            setStep(4);
          }
        }
        
        const profileData = await getProfile();
        if (profileData && active) {
          setForm(prev => ({
            ...prev,
            name: profileData.name || prev.name,
            education: profileData.education || prev.education,
            current_role: profileData.current_role || prev.current_role,
            target_role: profileData.target_role || prev.target_role,
            skills: profileData.skills || prev.skills,
            location: profileData.location || prev.location,
            experience_years: profileData.experience_years !== undefined ? String(profileData.experience_years) : prev.experience_years
          }));
        }
      } catch (err) {
        console.error("Error on page load:", err);
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    };
    
    checkExistingJobAndProfile();
    
    return () => {
      active = false;
      stopPolling();
    };
  }, []);

  const handlePipelineSubmit = async () => {
    if (mode === 'manual' && !validateStep()) return;
    
    setIsStarting(true);
    setGlobalError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("User session not found. Please log in.");
      }
      
      const targetRole = mode === 'upload' ? (extractedData?.structured?.target_role || form.target_role || "Software Engineer") : form.target_role;
      if (!targetRole || !targetRole.trim()) {
        throw new Error("Target role is required to run the career analysis.");
      }
      
      let resumeText = "";
      if (mode === 'upload') {
        resumeText = extractedData?.text;
        if (!resumeText || !resumeText.trim()) {
          throw new Error("Resume text is empty. Please check the extracted text.");
        }
        try {
          await reparseResumeText(resumeText);
        } catch (e) {
          console.warn("Reparse failed, continuing with raw text", e);
        }
      }
      
      const formPayload = {
        name: form.name.trim() || session.user.user_metadata?.full_name || "Candidate",
        current_role: form.current_role.trim() || (mode === 'upload' ? "Candidate" : ""),
        target_role: targetRole.trim(),
        skills: form.skills,
        experience_years: parseInt(form.experience_years) || 0,
        education: form.education || (form.degree ? `${form.degree} ${form.branch || ''}`.trim() : ""),
        location: form.location || ""
      };
      
      const job = await startAnalysisJob(mode, resumeText, formPayload);
      if (!job || !job.id) {
        throw new Error("Failed to initialize analysis job on the server.");
      }
      
      const { error: insertErr } = await supabase
        .from('analysis_jobs')
        .upsert({
          id: job.id,
          user_id: session.user.id,
          status: job.status,
          current_step: job.current_step,
          error_message: job.error_message || null,
          result: job.result || null,
          created_at: job.created_at,
          updated_at: new Date().toISOString()
        });
        
      if (insertErr) {
        throw new Error(`Failed to save job to Supabase: ${insertErr.message}`);
      }
      
      setActiveJob(job);
      setIsStarting(false);
      setIsProcessing(true);
      startPolling(job.id);
      
    } catch (err) {
      console.error("Failed to start analysis:", err);
      setGlobalError(err.message || "Failed to start analysis. Please try again.");
      setIsStarting(false);
    }
  };

  const handleRetrySubmit = async () => {
    if (!activeJob?.id) return;
    
    setIsStarting(true);
    setGlobalError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("User session not found. Please log in.");
      }
      
      const targetRole = mode === 'upload' ? (extractedData?.structured?.target_role || form.target_role || "Software Engineer") : form.target_role;
      if (!targetRole || !targetRole.trim()) {
        throw new Error("Target role is required to run the career analysis.");
      }
      
      let resumeText = "";
      if (mode === 'upload') {
        resumeText = extractedData?.text;
        if (!resumeText || !resumeText.trim()) {
          throw new Error("Resume text is empty. Please check the extracted text.");
        }
      }
      
      const formPayload = {
        name: form.name.trim() || session.user.user_metadata?.full_name || "Candidate",
        current_role: form.current_role.trim() || (mode === 'upload' ? "Candidate" : ""),
        target_role: targetRole.trim(),
        skills: form.skills,
        experience_years: parseInt(form.experience_years) || 0,
        education: form.education || (form.degree ? `${form.degree} ${form.branch || ''}`.trim() : ""),
        location: form.location || ""
      };
      
      const job = await retryAnalysisJob(activeJob.id, mode, resumeText, formPayload);
      if (!job || !job.id) {
        throw new Error("Failed to restart analysis job on the server.");
      }
      
      const { error: updateErr } = await supabase
        .from('analysis_jobs')
        .upsert({
          id: job.id,
          user_id: session.user.id,
          status: job.status,
          current_step: job.current_step,
          error_message: null,
          result: null,
          created_at: job.created_at,
          updated_at: new Date().toISOString()
        });
        
      if (updateErr) {
        throw new Error(`Failed to update job status in Supabase: ${updateErr.message}`);
      }
      
      setActiveJob(job);
      setIsStarting(false);
      setIsProcessing(true);
      startPolling(job.id);
      
    } catch (err) {
      console.error("Failed to retry analysis:", err);
      setGlobalError(err.message || "Failed to retry analysis. Please try again.");
      setIsStarting(false);
    }
  };

  const getProgressStatus = (currentStep, stageId, overallStatus, mode) => {
    if (overallStatus === 'completed') return 'success';
    
    if (mode === 'manual' && (stageId === 'upload' || stageId === 'analyze')) {
      return 'success';
    }
    
    const stepOrder = [
      'resume_extracted',
      'resume_analyzed',
      'career_intelligence_generated',
      'roadmap_created',
      'jobs_matched',
      'mentor_initialized',
      'career_memory_saved'
    ];
    
    const stageStepMap = {
      'upload': 'resume_extracted',
      'analyze': 'resume_analyzed',
      'report': 'career_intelligence_generated',
      'roadmap': 'roadmap_created',
      'jobs': 'jobs_matched',
      'mentor': 'mentor_initialized',
      'memory': 'career_memory_saved'
    };
    
    const currentIdx = stepOrder.indexOf(currentStep);
    const stageStep = stageStepMap[stageId];
    const stageIdx = stepOrder.indexOf(stageStep);
    
    if (stageIdx < currentIdx) {
      return 'success';
    } else if (stageIdx === currentIdx) {
      if (overallStatus === 'failed') return 'error';
      return 'loading';
    } else {
      return 'pending';
    }
  };

  const renderStageIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />
      case 'loading': return <Loader size={18} className="text-blue-500 animate-spin" />
      case 'error': return <AlertTriangle size={18} className="text-yellow-500" />
      default: return <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-600" />
    }
  }

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  }

  if (initialLoading) {
    return (
      <div className="analyze-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader size={36} className="text-blue-500 animate-spin" />
        <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>Loading your profile status...</span>
      </div>
    );
  }

  if (isStarting) {
    return (
      <div className="analyze-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader size={36} className="text-blue-500 animate-spin" />
        <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>Starting analysis...</span>
      </div>
    );
  }

  return (
    <div className="analyze-page">
      <div className="analyze-page__container">
        <motion.div className="analyze-page__header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <button className="analyze-page__back" onClick={() => navigate('/')} disabled={isProcessing}><ArrowLeft size={18} /> Back</button>
          <h1>Career <span className="text-gradient">Analysis</span></h1>
          <p>Provide your details or upload your resume to build your Career Memory.</p>
        </motion.div>

        {!isProcessing && <StepIndicator steps={STEPS} currentStep={step} />}

        <Card padding="lg" className="analyze-page__card">
          {!isProcessing ? (
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                
                {step === 0 && (
                  <div className="analyze-page__mode-selection">
                    <div className="analyze-page__icon-title"><Sparkles size={20} style={{ color: 'var(--accent-primary)' }} /><h3>Select Analysis Mode</h3></div>
                    
                    {globalError && (
                      <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={18} />
                        {globalError}
                      </div>
                    )}
                    
                    {mode === 'upload' && extractedData ? (
                      <div className="extracted-text-review" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {extractedData.warning && (
                          <div className={`confidence-banner ${extractedData.confidence}`} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', backgroundColor: extractedData.confidence === 'high' ? 'rgba(16, 185, 129, 0.1)' : extractedData.confidence === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: extractedData.confidence === 'high' ? 'var(--success)' : extractedData.confidence === 'medium' ? '#F59E0B' : 'var(--error)' }}>
                            <AlertTriangle size={16} />
                            <span>{extractedData.warning}</span>
                          </div>
                        )}
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Please review and fix any text extraction errors below before continuing:</p>
                        <TextArea 
                          value={extractedData.text} 
                          onChange={e => setExtractedData({...extractedData, text: e.target.value})}
                          rows={14}
                        />
                      </div>
                    ) : (
                      <div className="mode-cards">
                        <div className={`mode-card ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
                          <Upload size={32} />
                          <h4>Upload Resume</h4>
                          <p>Automatically extract skills, experience, and goals to build your Career Memory instantly.</p>
                          {mode === 'upload' && (
                            <>
                              <div className="file-upload-zone" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                <FileText size={24} />
                                <span>{file ? file.name : "Click to select PDF, DOCX, TXT, PNG, JPG"}</span>
                                <input type="file" ref={fileInputRef} hidden accept=".pdf,.txt,.png,.jpg,.jpeg,.docx" onChange={handleFileChange} />
                              </div>
                              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLoadSample(); }}>
                                  Load Sample Resume
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className={`mode-card ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
                          <User size={32} />
                          <h4>Manual Entry</h4>
                          <p>Answer a few questions about your background to generate your profile.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><User size={20} style={{ color: 'var(--accent-primary)' }} /><h3>Personal Information</h3></div>
                    <div className="analyze-page__grid">
                      <Input label="Full Name" placeholder="e.g. Siva Kumar" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
                      <Input label="Age (optional)" type="number" placeholder="e.g. 21" min="16" max="65" value={form.age} onChange={e => update('age', e.target.value)} />
                    </div>
                    <div className="analyze-page__grid">
                      <Input label="Current Role" placeholder="e.g. Student, Junior Developer" value={form.current_role} onChange={e => update('current_role', e.target.value)} error={errors.current_role} />
                      <Input label="Education" placeholder="e.g. B.Tech Computer Science" value={form.education} onChange={e => update('education', e.target.value)} />
                    </div>
                    <Input label="Location (optional)" placeholder="e.g. Hyderabad, India" value={form.location} onChange={e => update('location', e.target.value)} />
                  </div>
                )}

                {step === 2 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><Code size={20} style={{ color: 'var(--accent-secondary)' }} /><h3>Skills & Interests</h3></div>
                    <div>
                      <Input label="Skills (press Enter to add)" placeholder="e.g. Python" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => handleTagKey(e, 'skills', skillInput, setSkillInput)} hint="Press Enter or comma to add each skill" />
                      <div className="analyze-page__tags">{form.skills.map(s => <Badge key={s} variant="primary" size="md" removable onRemove={() => removeTag('skills', s)}>{s}</Badge>)}</div>
                    </div>
                    <div>
                      <Input label="Interests (press Enter to add)" placeholder="e.g. Artificial Intelligence" value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={e => handleTagKey(e, 'interests', interestInput, setInterestInput)} hint="Press Enter or comma to add each interest" />
                      <div className="analyze-page__tags">{form.interests.map(s => <Badge key={s} variant="info" size="md" removable onRemove={() => removeTag('interests', s)}>{s}</Badge>)}</div>
                    </div>
                    <Input label="Preferred Domain (optional)" placeholder="e.g. AI/ML, Web Development" value={form.preferred_domain} onChange={e => update('preferred_domain', e.target.value)} />
                  </div>
                )}

                {step === 3 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><Compass size={20} style={{ color: 'var(--success)' }} /><h3>Career Goals</h3></div>
                    <Input label="Target Role" placeholder="e.g. Senior Software Engineer, Data Scientist" value={form.target_role} onChange={e => update('target_role', e.target.value)} error={errors.target_role} />
                    <TextArea label="Career Goal (optional)" placeholder="Describe your career objective..." value={form.career_goal} onChange={e => update('career_goal', e.target.value)} rows={3} />
                    <Input label="Years of Experience" type="number" min="0" max="50" placeholder="e.g. 1" value={form.experience_years} onChange={e => update('experience_years', e.target.value)} />
                  </div>
                )}

                {step === 4 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><CheckCircle size={20} style={{ color: 'var(--success)' }} /><h3>Review Your Profile</h3></div>
                    {globalError && (
                      <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={18} />
                          <span>{globalError}</span>
                        </div>
                        {activeJob?.status === 'failed' && (
                          <Button variant="primary" size="sm" style={{ width: 'fit-content' }} onClick={handleRetrySubmit} disabled={isStarting}>
                            {isStarting ? 'Retrying...' : 'Retry Analysis'}
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="analyze-page__review">
                      <div className="analyze-page__review-row"><span>Name</span><span>{form.name || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Current Role</span><span>{form.current_role || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Target Role</span><span>{form.target_role || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Education</span><span>{form.education || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Experience</span><span>{form.experience_years} years</span></div>
                      <div className="analyze-page__review-row"><span>Location</span><span>{form.location || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Skills</span><div className="analyze-page__tags">{form.skills.map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}</div></div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="pipeline-progress">
              <div className="analyze-page__icon-title" style={{ marginBottom: '2rem' }}>
                <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
                <h3>Building Your Career Memory...</h3>
              </div>
              
              {globalError && (
                <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} />
                    <span>{globalError}</span>
                  </div>
                  <Button variant="primary" style={{ width: 'fit-content' }} onClick={handleRetrySubmit} disabled={isStarting}>
                    {isStarting ? 'Retrying...' : 'Retry Analysis'}
                  </Button>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {PIPELINE_STAGES.map((stage) => {
                  const status = getProgressStatus(activeJob?.current_step, stage.id, activeJob?.status, mode)
                  return (
                    <motion.div 
                      key={stage.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        opacity: status === 'pending' ? 0.5 : 1
                      }}
                    >
                      {renderStageIcon(status)}
                      <span style={{ 
                        color: status === 'pending' ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontWeight: status === 'loading' ? 500 : 400
                      }}>
                        {stage.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {!isProcessing && (
            <div className="analyze-page__nav">
              {step > 0 && <Button variant="ghost" icon={ArrowLeft} onClick={prev}>Back</Button>}
              <div style={{ flex: 1 }} />
              {step < 4 && !(step === 0 && mode === 'upload') ? (
                <Button variant="primary" iconRight={ArrowRight} onClick={next} disabled={step === 0 && !mode}>Continue</Button>
              ) : (
                <Button 
                  variant="primary" 
                  icon={mode === 'upload' && !extractedData ? Upload : Sparkles} 
                  onClick={mode === 'upload' && !extractedData ? handleExtractOnly : handlePipelineSubmit} 
                  disabled={(mode === 'upload' && !file) || isExtracting || isStarting}
                >
                  {isExtracting ? 'Extracting...' : isStarting ? 'Starting...' : (mode === 'upload' ? (!extractedData ? 'Upload & Extract Resume' : 'Confirm & Analyze Resume') : 'Run AI Analysis')}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
