import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import { 
  Sun, Moon, Laptop, Trash2, User, Sparkles, Camera, Upload, X, CheckCircle2,
  Mail, ShieldCheck, GraduationCap, Briefcase, Calendar, ChevronDown, Search, Phone
} from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import './SettingsPanel.css'

const UNIVERSITIES = [
  "Stanford University",
  "Massachusetts Institute of Technology (MIT)",
  "Harvard University",
  "California Institute of Technology (Caltech)",
  "University of Oxford",
  "University of Cambridge",
  "ETH Zurich",
  "Indian Institute of Technology Bombay (IIT Bombay)",
  "Indian Institute of Technology Delhi (IIT Delhi)",
  "Indian Institute of Technology Madras (IIT Madras)",
  "Indian Institute of Technology Hyderabad (IIT Hyderabad)",
  "Indian Institute of Technology Kanpur (IIT Kanpur)",
  "Indian Institute of Technology Kharagpur (IIT Kharagpur)",
  "BITS Pilani",
  "Delhi University (DU)",
  "Indian Institute of Science (IISc)",
  "Carnegie Mellon University (CMU)",
  "University of California, Berkeley (UC Berkeley)",
  "Georgia Institute of Technology (Georgia Tech)",
  "University of Toronto",
  "National University of Singapore (NUS)",
  "Nanyang Technological University (NTU)",
  "Tsinghua University",
  "Imperial College London",
  "Princeton University",
  "Yale University",
  "Cornell University",
  "Columbia University",
  "University of Washington",
  "University of Waterloo"
]

const CAREER_OPTIONS = [
  "Software Engineer",
  "AI Engineer",
  "Data Scientist",
  "Cybersecurity Engineer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Product Manager",
  "Cloud Engineer",
  "Other"
]

const GRADUATION_YEARS = Array.from({ length: 16 }, (_, i) => String(2020 + i))

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { memory, clearMemory, updatePersonalInfo } = useCareerMemory()

  // State fields
  const [name, setName] = useState(memory.personal_info?.name || '')
  const [email, setEmail] = useState(memory.personal_info?.email || 'student@university.edu')
  const [university, setUniversity] = useState(memory.personal_info?.education || '')
  const [graduationYear, setGraduationYear] = useState(memory.personal_info?.graduationYear || '')
  const [targetCareer, setTargetCareer] = useState(memory.personal_info?.target_role || '')
  const [avatarPreview, setAvatarPreview] = useState(memory.personal_info?.avatarUrl || '')
  const [countryCode, setCountryCode] = useState(memory.personal_info?.country_code || '+91')
  const [phoneNumber, setPhoneNumber] = useState(memory.personal_info?.phone_number || '')
  const [isVerified, setIsVerified] = useState(memory.personal_info?.phone_verified || false)

  // UI state
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('Profile updated successfully.')

  // OTP UI states
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  // Autocomplete UI states
  const [universityQuery, setUniversityQuery] = useState(memory.personal_info?.education || '')
  const [showUnivDropdown, setShowUnivDropdown] = useState(false)
  const [careerQuery, setCareerQuery] = useState('')
  const [showCareerDropdown, setShowCareerDropdown] = useState(false)

  // Refs for click outside
  const universityRef = useRef(null)
  const careerRef = useRef(null)

  // Sync state if memory changes externally
  useEffect(() => {
    setName(memory.personal_info?.name || '')
    setEmail(memory.personal_info?.email || 'student@university.edu')
    setUniversity(memory.personal_info?.education || '')
    setUniversityQuery(memory.personal_info?.education || '')
    setGraduationYear(memory.personal_info?.graduationYear || '')
    setTargetCareer(memory.personal_info?.target_role || '')
    setAvatarPreview(memory.personal_info?.avatarUrl || '')
    setCountryCode(memory.personal_info?.country_code || '+91')
    setPhoneNumber(memory.personal_info?.phone_number || '')
    setIsVerified(memory.personal_info?.phone_verified || false)
  }, [memory.personal_info])

  // Click outside listener to close autocomplete dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (universityRef.current && !universityRef.current.contains(event.target)) {
        setShowUnivDropdown(false)
      }
      if (careerRef.current && !careerRef.current.contains(event.target)) {
        setShowCareerDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Derived filtered universities
  const filteredUniversities = useMemo(() => {
    if (!universityQuery) return UNIVERSITIES.slice(0, 8)
    const q = universityQuery.toLowerCase()
    return UNIVERSITIES.filter(univ => univ.toLowerCase().includes(q))
  }, [universityQuery])

  // Derived filtered careers
  const filteredCareers = useMemo(() => {
    const q = careerQuery.toLowerCase()
    return CAREER_OPTIONS.filter(c => c.toLowerCase().includes(q))
  }, [careerQuery])

  // Dirty check to show Save / Cancel buttons
  const isDirty = useMemo(() => {
    const origName = memory.personal_info?.name || ''
    const origEmail = memory.personal_info?.email || 'student@university.edu'
    const origUniv = memory.personal_info?.education || ''
    const origGrad = memory.personal_info?.graduationYear || ''
    const origCareer = memory.personal_info?.target_role || ''
    const origAvatar = memory.personal_info?.avatarUrl || ''
    const origCountryCode = memory.personal_info?.country_code || '+91'
    const origPhone = memory.personal_info?.phone_number || ''
    const origPhoneVerified = memory.personal_info?.phone_verified || false

    return (
      name !== origName ||
      email !== origEmail ||
      university !== origUniv ||
      graduationYear !== origGrad ||
      targetCareer !== origCareer ||
      avatarPreview !== origAvatar ||
      countryCode !== origCountryCode ||
      phoneNumber !== origPhone ||
      isVerified !== origPhoneVerified
    )
  }, [name, email, university, graduationYear, targetCareer, avatarPreview, countryCode, phoneNumber, isVerified, memory.personal_info])

  // Validation
  const handleNameChange = (e) => {
    const val = e.target.value
    setName(val)
    if (!val.trim()) {
      setNameError('Full Name is required')
    } else {
      setNameError('')
    }
  }

  const handlePhoneChange = (e) => {
    let rawVal = e.target.value.replace(/[^0-9]/g, '') // strip non-numeric
    
    // Format the number: e.g. for a 10 digit number: 98765 43210
    let formatted = rawVal
    if (rawVal.length > 5) {
      formatted = `${rawVal.slice(0, 5)} ${rawVal.slice(5, 10)}`
    }
    
    setPhoneNumber(formatted)
    validatePhone(countryCode, rawVal)
  }

  const validatePhone = (code, rawNumber) => {
    if (!rawNumber) {
      setPhoneError('')
      return
    }
    if (rawNumber.length < 10) {
      setPhoneError('Phone number must be at least 10 digits')
    } else if (rawNumber.length > 11) {
      setPhoneError('Phone number cannot exceed 11 digits')
    } else {
      setPhoneError('')
    }
  }

  // Drag and drop image upload handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processImageFile(file)
    }
  }

  const processImageFile = (file) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handleRemovePhoto = () => {
    setAvatarPreview('')
  }

  const handleStartVerification = () => {
    if (phoneError || !phoneNumber) return
    setOtpSent(true)
    setOtpError('')
    setOtpCode('')
  }

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 4) {
      setOtpError('Please enter a 4-digit code')
      return
    }
    setIsVerifyingOtp(true)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsVerifyingOtp(false)
    
    if (otpCode === '1234') { // Hardcoded mock code
      setIsVerified(true)
      setOtpSent(false)
      setOtpError('')
    } else {
      setOtpError('Invalid OTP code. Try entering 1234')
    }
  }

  const handleCancel = () => {
    setName(memory.personal_info?.name || '')
    setEmail(memory.personal_info?.email || 'student@university.edu')
    setUniversity(memory.personal_info?.education || '')
    setUniversityQuery(memory.personal_info?.education || '')
    setGraduationYear(memory.personal_info?.graduationYear || '')
    setTargetCareer(memory.personal_info?.target_role || '')
    setAvatarPreview(memory.personal_info?.avatarUrl || '')
    setCountryCode(memory.personal_info?.country_code || '+91')
    setPhoneNumber(memory.personal_info?.phone_number || '')
    setIsVerified(memory.personal_info?.phone_verified || false)
    setOtpSent(false)
    setOtpCode('')
    setNameError('')
    setEmailError('')
    setPhoneError('')
    setOtpError('')
    setIsEditingEmail(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Full Name is required')
      return
    }
    if (phoneError) {
      return
    }

    setIsLoading(true)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    const phoneChanged = phoneNumber !== (memory.personal_info?.phone_number || '')

    updatePersonalInfo({
      name,
      email,
      education: university,
      graduationYear,
      target_role: targetCareer,
      avatarUrl: avatarPreview,
      country_code: countryCode,
      phone_number: phoneNumber,
      phone_verified: isVerified
    })

    setIsLoading(false)
    setToastText(phoneChanged ? "Mobile number updated successfully." : "Profile updated successfully.")
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const handleClearMemory = () => {
    if (window.confirm('Are you sure you want to clear your global career intelligence memory? This will reset all analyze results.')) {
      clearMemory()
      window.location.reload()
    }
  }

  const themes = [
    { id: 'light', name: 'Light Mode', desc: 'Clean, high-contrast light theme', icon: Sun },
    { id: 'dark', name: 'Dark Mode', desc: 'Premium, comfortable dark theme', icon: Moon },
    { id: 'system', name: 'System Default', desc: 'Syncs with your operating system preference', icon: Laptop },
  ]

  const initials = useMemo(() => {
    if (!name) return 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [name])

  return (
    <div className="settings-panel animate-fade-in-up">
      {/* Toast Notification */}
      {showToast && (
        <div className="profile-toast animate-toast-slide-in">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Redesigned Premium Profile Section */}
      <div className="settings-panel__section">
        <h3 className="settings-panel__sec-title">Profile Settings</h3>
        <p className="settings-panel__sec-desc">Manage your public information and target career preferences.</p>

        <div className="profile-card">
          {/* Avatar Area */}
          <div className="profile-avatar-section">
            <div 
              className={`profile-avatar ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-initials">{initials}</div>
              )}
              <div className="profile-avatar-overlay">
                <Camera size={20} />
                <span>Drop Image</span>
              </div>
            </div>
            
            <div className="profile-avatar-meta">
              <span className="profile-avatar-title">Profile Picture</span>
              <span className="profile-avatar-subtitle">PNG or JPG up to 5MB. Drag and drop or browse.</span>
              <div className="profile-avatar-actions">
                <label className="profile-upload-btn btn btn--secondary btn--sm">
                  <Upload size={14} />
                  Upload Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden-file-input" 
                    onChange={handleImageFileChange} 
                  />
                </label>
                {avatarPreview && (
                  <button 
                    type="button" 
                    className="profile-remove-btn" 
                    onClick={handleRemovePhoto}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-divider" />

          {/* Form Fields */}
          <div className="profile-form-grid">
            {/* Full Name */}
            <div className="profile-field-group">
              <label className="profile-field-label">
                <User size={15} />
                Full Name
              </label>
              <div className={`input-group__wrapper ${nameError ? 'input-error' : ''}`}>
                <User size={16} className="input-group__icon text-tertiary" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={handleNameChange}
                  className="input-group__input input-group__input--icon"
                />
              </div>
              {nameError && <span className="profile-input-error-msg">{nameError}</span>}
            </div>

            {/* Email Address */}
            <div className="profile-field-group">
              <label className="profile-field-label">
                <Mail size={15} />
                Email Address
              </label>
              <div className="email-row">
                <div className="input-group__wrapper flex-1">
                  <Mail size={16} className="input-group__icon text-tertiary" />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    disabled={!isEditingEmail}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    className={`input-group__input input-group__input--icon ${!isEditingEmail ? 'input-read-only' : ''}`}
                  />
                  {!isEditingEmail && (
                    <div className="verified-badge-wrap">
                      <ShieldCheck size={14} className="text-success" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                
                {isEditingEmail ? (
                  <div className="email-edit-actions">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingEmail(false)
                        setEmail(memory.personal_info?.email || 'student@university.edu')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => {
                        if (!email.trim() || !email.includes('@')) {
                          setEmailError('Valid email is required')
                          return
                        }
                        setIsEditingEmail(false)
                      }}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="email-change-btn" 
                    onClick={() => setIsEditingEmail(true)}
                  >
                    Change Email
                  </button>
                )}
              </div>
              {emailError && <span className="profile-input-error-msg">{emailError}</span>}
            </div>

            {/* College / University (Autocomplete) */}
            <div className="profile-field-group relative" ref={universityRef}>
              <label className="profile-field-label">
                <GraduationCap size={15} />
                College / University
              </label>
              <div className="input-group__wrapper">
                <Search size={16} className="input-group__icon text-tertiary" />
                <input
                  type="text"
                  placeholder="Type to search college or university..."
                  value={universityQuery}
                  onChange={(e) => {
                    setUniversityQuery(e.target.value)
                    setUniversity(e.target.value)
                    setShowUnivDropdown(true)
                  }}
                  onFocus={() => setShowUnivDropdown(true)}
                  className="input-group__input input-group__input--icon"
                />
              </div>
              {showUnivDropdown && filteredUniversities.length > 0 && (
                <div className="profile-autocomplete-dropdown">
                  {filteredUniversities.map((univ) => (
                    <div
                      key={univ}
                      className="profile-autocomplete-item"
                      onClick={() => {
                        setUniversity(univ)
                        setUniversityQuery(univ)
                        setShowUnivDropdown(false)
                      }}
                    >
                      {univ}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div className="profile-field-group">
              <label className="profile-field-label">
                <Phone size={15} />
                Mobile Number
              </label>
              <div className="mobile-row">
                <div className={`input-group__wrapper flex-1 ${phoneError ? 'input-error' : ''}`}>
                  <Phone size={16} className="input-group__icon text-tertiary" />
                  <div className="country-code-select-wrapper">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value)
                        const raw = phoneNumber.replace(/[^0-9]/g, '')
                        validatePhone(e.target.value, raw)
                      }}
                      className="country-code-select"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <ChevronDown size={12} className="country-code-chevron" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your mobile number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="input-group__input mobile-input-field"
                  />
                  {phoneNumber && !phoneError && (
                    <div className="phone-valid-checkmark" title="Valid Format">
                      <CheckCircle2 size={16} className="text-success" />
                    </div>
                  )}
                </div>
                
                {isVerified ? (
                  <div className="verified-badge-wrap phone-verified-badge">
                    <ShieldCheck size={14} className="text-success" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="phone-verify-btn" 
                    onClick={handleStartVerification}
                    disabled={!!phoneError || !phoneNumber}
                  >
                    Verify
                  </button>
                )}
              </div>
              {phoneError && <span className="profile-input-error-msg">{phoneError}</span>}
            </div>

            {/* Target Career (Searchable dropdown) */}
            <div className="profile-field-group relative" ref={careerRef}>
              <label className="profile-field-label">
                <Briefcase size={15} />
                Target Career
              </label>
              <div className="input-group__wrapper cursor-pointer" onClick={() => setShowCareerDropdown(true)}>
                <Briefcase size={16} className="input-group__icon text-tertiary" />
                <input
                  type="text"
                  placeholder="Search and select career path..."
                  value={showCareerDropdown ? careerQuery : (targetCareer || '')}
                  onChange={(e) => {
                    setCareerQuery(e.target.value)
                    if (!showCareerDropdown) setShowCareerDropdown(true)
                  }}
                  onFocus={() => {
                    setShowCareerDropdown(true)
                    setCareerQuery('')
                  }}
                  className="input-group__input input-group__input--icon cursor-text"
                />
                <ChevronDown size={16} className="select__chevron" />
              </div>
              {showCareerDropdown && (
                <div className="profile-autocomplete-dropdown">
                  {filteredCareers.length > 0 ? (
                    filteredCareers.map((c) => (
                      <div
                        key={c}
                        className={`profile-autocomplete-item ${c === targetCareer ? 'selected' : ''}`}
                        onClick={() => {
                          setTargetCareer(c)
                          setShowCareerDropdown(false)
                          setCareerQuery('')
                        }}
                      >
                        {c}
                      </div>
                    ))
                  ) : (
                    <div className="profile-autocomplete-empty">No matching career paths found</div>
                  )}
                </div>
              )}
            </div>

            {/* Graduation Year */}
            <div className="profile-field-group">
              <label className="profile-field-label">
                <Calendar size={15} />
                Graduation Year
              </label>
              <div className="select-wrapper">
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="select__input"
                >
                  <option value="" disabled>Select graduation year</option>
                  {GRADUATION_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="select__chevron" />
              </div>
            </div>

            {/* OTP Section (renders inline inside the form layout) */}
            {otpSent && (
              <div className="otp-verification-container">
                <div className="otp-info">
                  <span>We've sent a mock 4-digit verification code to <strong>{countryCode} {phoneNumber}</strong>.</span>
                </div>
                <div className="otp-inputs-row">
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="Enter 4-digit code (Use 1234)"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setOtpCode(val)
                      if (otpError) setOtpError('')
                    }}
                    className="input-group__input otp-input"
                    disabled={isVerifyingOtp}
                  />
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleVerifyOtp}
                    loading={isVerifyingOtp}
                  >
                    Verify Code
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setOtpSent(false)}
                    disabled={isVerifyingOtp}
                  >
                    Cancel
                  </Button>
                </div>
                {otpError && <span className="profile-input-error-msg">{otpError}</span>}
                <div className="otp-resend">
                  <span>Didn't receive the code? </span>
                  <button 
                    type="button" 
                    className="resend-link" 
                    onClick={() => {
                      setOtpCode('')
                      setOtpError('')
                      alert('Mock OTP code sent! Enter 1234 to verify.')
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Footer */}
          {isDirty && (
            <div className="profile-form-footer animate-fade-in-up">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleSave}
                loading={isLoading}
                disabled={!!nameError || !!phoneError || isLoading}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="settings-panel__section">
        <h3 className="settings-panel__sec-title">Appearance</h3>
        <p className="settings-panel__sec-desc">Customize how Career Guide AI looks on your device.</p>
        
        <div className="theme-options">
          {themes.map((item) => {
            const Icon = item.icon
            const active = theme === item.id
            return (
              <div 
                key={item.id} 
                className={`theme-card ${active ? 'theme-card--active' : ''}`}
                onClick={() => setTheme(item.id)}
              >
                <div className="theme-card__icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="theme-card__meta">
                  <span className="theme-card__name">{item.name}</span>
                  <span className="theme-card__desc">{item.desc}</span>
                </div>
                <div className="theme-card__radio">
                  <div className="theme-card__radio-inner" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Profile Memory Management Section */}
      <div className="settings-panel__section">
        <h3 className="settings-panel__sec-title">Career Profile Memory</h3>
        <p className="settings-panel__sec-desc">Manage your profile metadata and AI agent synchronization.</p>
        
        <Card padding="md" className="settings-memory-card">
          <div className="settings-memory-card__header">
            <User size={18} className="text-accent" />
            <span>Profile Context Status</span>
            <span className={`memory-status-badge ${memory.isActive ? 'active' : ''}`}>
              {memory.isActive ? 'Active Context' : 'Empty Profile'}
            </span>
          </div>
          
          {memory.isActive ? (
            <div className="settings-memory-card__body">
              <div className="settings-memory-row">
                <span className="label">Target Role:</span>
                <span className="val">{memory.personal_info?.target_role || 'Not specified'}</span>
              </div>
              <div className="settings-memory-row">
                <span className="label">Experience:</span>
                <span className="val">{memory.personal_info?.experience_years} years</span>
              </div>
              <div className="settings-memory-row">
                <span className="label">Skills Catalog:</span>
                <span className="val">{memory.resume_intelligence?.skills?.length || 0} skills verified</span>
              </div>
              
              <div className="settings-memory-card__footer">
                <Button variant="danger" size="sm" icon={Trash2} onClick={handleClearMemory}>
                  Clear Profile Memory
                </Button>
              </div>
            </div>
          ) : (
            <div className="settings-memory-card__empty">
              <Sparkles size={24} className="animate-float" />
              <p>No active profile context detected. Complete a career analysis wizard to seed the intelligence memory.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
