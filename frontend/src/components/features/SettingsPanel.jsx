import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import { 
  Sun, Moon, Laptop, Trash2, User, Sparkles, Camera, Upload, X, CheckCircle2,
  Mail, ShieldCheck, GraduationCap, Briefcase, Calendar, ChevronDown, Search, Phone, Lock
} from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { getProfile, saveProfile, sendMobileOtp, verifyMobileOtp } from '../../services/api'
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
  const [email, setEmail] = useState(memory.personal_info?.email || '')
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
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('Profile updated successfully.')

  // OTP UI states
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])

  const otpDigitsRef = useRef([])

  // Autocomplete UI states
  const [universityQuery, setUniversityQuery] = useState(memory.personal_info?.education || '')
  const [showUnivDropdown, setShowUnivDropdown] = useState(false)
  const [careerQuery, setCareerQuery] = useState('')
  const [showCareerDropdown, setShowCareerDropdown] = useState(false)
  const [showGradDropdown, setShowGradDropdown] = useState(false)

  // Refs for click outside
  const universityRef = useRef(null)
  const careerRef = useRef(null)
  const gradRef = useRef(null)

  // Fetch profile database values on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        if (data) {
          setName(data.name || '')
          setEmail(data.email || '')
          setUniversity(data.education || '')
          setUniversityQuery(data.education || '')
          setGraduationYear(data.graduationYear || '')
          setTargetCareer(data.target_role || '')
          setAvatarPreview(data.avatarUrl || '')
          setCountryCode(data.country_code || '+91')
          setPhoneNumber(data.phone_number || '')
          setIsVerified(data.phone_verified || false)
          
          updatePersonalInfo(data)
        }
      } catch (err) {
        console.error('Failed to load profile from database:', err)
      } finally {
        setIsFetchingProfile(false)
      }
    }
    fetchProfile()
  }, [])

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
      if (gradRef.current && !gradRef.current.contains(event.target)) {
        setShowGradDropdown(false)
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
    const origUniv = memory.personal_info?.education || ''
    const origGrad = memory.personal_info?.graduationYear || ''
    const origCareer = memory.personal_info?.target_role || ''
    const origAvatar = memory.personal_info?.avatarUrl || ''
    const origCountry = memory.personal_info?.country_code || '+91'
    const origPhone = memory.personal_info?.phone_number || ''
    const origVerified = memory.personal_info?.phone_verified || false

    return (
      name !== origName ||
      university !== origUniv ||
      graduationYear !== origGrad ||
      targetCareer !== origCareer ||
      avatarPreview !== origAvatar ||
      countryCode !== origCountry ||
      phoneNumber !== origPhone ||
      isVerified !== origVerified
    )
  }, [name, university, graduationYear, targetCareer, avatarPreview, countryCode, phoneNumber, isVerified, memory.personal_info])

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



  const handleCancel = () => {
    setName(memory.personal_info?.name || '')
    setEmail(memory.personal_info?.email || '')
    setUniversity(memory.personal_info?.education || '')
    setUniversityQuery(memory.personal_info?.education || '')
    setGraduationYear(memory.personal_info?.graduationYear || '')
    setTargetCareer(memory.personal_info?.target_role || '')
    setAvatarPreview(memory.personal_info?.avatarUrl || '')
    setCountryCode(memory.personal_info?.country_code || '+91')
    setPhoneNumber(memory.personal_info?.phone_number || '')
    setIsVerified(memory.personal_info?.phone_verified || false)
    setNameError('')
    setPhoneError('')
    setIsEditingPhone(false)
    setShowGradDropdown(false)
  }

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer = null
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '')
    if (!cleanVal) {
      const newDigits = [...otpDigits]
      newDigits[index] = ''
      setOtpDigits(newDigits)
      return
    }

    const digit = cleanVal[cleanVal.length - 1]
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)

    if (index < 5) {
      otpDigitsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpDigitsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (text) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = text[i] || ''
      }
      setOtpDigits(newDigits)
      const focusIndex = Math.min(text.length, 5)
      otpDigitsRef.current[focusIndex]?.focus()
    }
  }

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setPhoneError('Please enter a valid mobile number')
      return
    }

    setIsSendingOtp(true)
    setPhoneError('')
    setOtpError('')

    const fullPhone = `${countryCode}${phoneNumber.trim()}`

    try {
      const res = await sendMobileOtp(fullPhone)
      if (res && res.success) {
        setOtpSent(true)
        setOtpModalOpen(true)
        setOtpDigits(['', '', '', '', '', ''])
        setCountdown(30)
        
        setToastText("Verification code sent.")
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      } else {
        setPhoneError(res.message || 'Failed to send verification code.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to send OTP. Please try again.'
      setPhoneError(errorMsg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join('')
    if (fullCode.length !== 6) {
      setOtpError('Please enter all 6 digits')
      return
    }

    setIsVerifyingOtp(true)
    setOtpError('')

    const fullPhone = `${countryCode}${phoneNumber.trim()}`

    try {
      const res = await verifyMobileOtp(fullPhone, fullCode)
      if (res && res.success) {
        setIsVerified(true)
        setOtpModalOpen(false)
        setIsEditingPhone(false)
        
        try {
          await saveProfile({
            name,
            email,
            education: university,
            graduationYear,
            target_role: targetCareer,
            avatarUrl: avatarPreview,
            country_code: countryCode,
            phone_number: phoneNumber,
            phone_verified: true
          })
          
          updatePersonalInfo({
            name,
            email,
            education: university,
            graduationYear,
            target_role: targetCareer,
            avatarUrl: avatarPreview,
            country_code: countryCode,
            phone_number: phoneNumber,
            phone_verified: true
          })
        } catch (saveErr) {
          console.error("Auto-save failed after verification:", saveErr)
        }

        setToastText("Mobile number verified successfully!")
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      } else {
        setOtpError(res.message || 'Incorrect verification code.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Incorrect verification code.'
      setOtpError(errorMsg)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleCloseOtpModal = () => {
    setOtpModalOpen(false)
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError('')
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Full Name is required')
      return
    }

    setIsLoading(true)

    try {
      await saveProfile({
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
    } catch (err) {
      console.error('Failed to save profile to database:', err)
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200))

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
    setToastText("Profile updated successfully.")
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

  if (isFetchingProfile) {
    return (
      <div className="settings-panel animate-fade-in-up">
        <div className="settings-panel__section">
          <h3 className="settings-panel__sec-title">Profile Settings</h3>
          <p className="settings-panel__sec-desc">Loading your profile information...</p>
          <div className="profile-card skeleton-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'var(--bg-elevated)' }} className="animate-pulse"></div>
            <div style={{ height: '1px', background: 'var(--border-default)', width: '100%' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div style={{ height: '40px', background: 'var(--bg-elevated)', borderRadius: '8px' }} className="animate-pulse"></div>
              <div style={{ height: '40px', background: 'var(--bg-elevated)', borderRadius: '8px' }} className="animate-pulse"></div>
              <div style={{ height: '40px', background: 'var(--bg-elevated)', borderRadius: '8px' }} className="animate-pulse"></div>
              <div style={{ height: '40px', background: 'var(--bg-elevated)', borderRadius: '8px' }} className="animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                    type="text"
                    value={email || 'Not added'}
                    readOnly
                    className="input-group__input input-group__input--icon input-read-only"
                  />
                  {email && (
                    <div className="verified-badge-wrap">
                      <ShieldCheck size={14} className="text-success" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="profile-helper-text" style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Lock size={12} /> Managed by your login account
              </p>
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
              
              {!isEditingPhone ? (
                // View Mode
                <div className="mobile-row">
                  <div className="input-group__wrapper flex-1">
                    <Phone size={16} className="input-group__icon text-tertiary" />
                    <input
                      type="text"
                      value={phoneNumber ? `${countryCode} ${phoneNumber}` : 'Not added'}
                      readOnly
                      className="input-group__input input-group__input--icon input-read-only"
                    />
                    {isVerified && (
                      <div className="verified-badge-wrap phone-verified-badge">
                        <ShieldCheck size={14} className="text-success" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="email-change-btn"
                    onClick={() => setIsEditingPhone(true)}
                  >
                    Change
                  </button>
                </div>
              ) : (
                // Edit Mode
                <div className="mobile-row">
                  <div className={`input-group__wrapper flex-1 ${phoneError ? 'input-error' : ''}`}>
                    <Phone size={16} className="input-group__icon text-tertiary" />
                    <div className="country-code-select-wrapper">
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value)
                          setIsVerified(false)
                        }}
                        className="country-code-select"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                        <option value="+65">+65</option>
                        <option value="+971">+971</option>
                        <option value="+49">+49</option>
                        <option value="+33">+33</option>
                        <option value="+81">+81</option>
                      </select>
                      <ChevronDown size={12} className="country-code-chevron" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter mobile number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setPhoneNumber(val)
                        setPhoneError('')
                        setIsVerified(false)
                      }}
                      className="input-group__input input-group__input--icon mobile-input-field"
                    />
                  </div>
                  <div className="email-edit-actions">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!phoneNumber || phoneNumber.trim().length < 7 || isSendingOtp}
                      className="phone-verify-btn"
                    >
                      {isSendingOtp ? 'Sending...' : 'Verify'}
                    </button>
                    <button
                      type="button"
                      className="email-change-btn"
                      onClick={() => {
                        setIsEditingPhone(false)
                        setCountryCode(memory.personal_info?.country_code || '+91')
                        setPhoneNumber(memory.personal_info?.phone_number || '')
                        setIsVerified(memory.personal_info?.phone_verified || false)
                        setPhoneError('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {phoneError && <span className="profile-input-error-msg">{phoneError}</span>}
              <p className="profile-helper-text" style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                Verify via OTP to secure your account and enable SMS alerts.
              </p>
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
            <div className="profile-field-group relative" ref={gradRef}>
              <label className="profile-field-label">
                <Calendar size={15} />
                Graduation Year
              </label>
              <div 
                className="select-custom-wrapper"
                onClick={() => setShowGradDropdown(!showGradDropdown)}
              >
                <div className={`select-custom-input ${!graduationYear ? 'placeholder' : ''}`}>
                  {graduationYear ? graduationYear : "Select graduation year"}
                </div>
                <ChevronDown size={16} className="select-custom-chevron" />
              </div>
              {showGradDropdown && (
                <div className="select-custom-dropdown">
                  {GRADUATION_YEARS.map(y => (
                    <div
                      key={y}
                      className={`select-custom-item ${y === graduationYear ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setGraduationYear(y)
                        setShowGradDropdown(false)
                      }}
                    >
                      {y}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                disabled={!!nameError || isLoading}
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

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-card animate-scale-in">
            <button 
              type="button" 
              className="otp-modal-close" 
              onClick={handleCloseOtpModal}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            
            <div className="otp-modal-header">
              <div className="theme-card__icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.08)', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                <Phone size={24} />
              </div>
              <h4>Verify Mobile Number</h4>
              <p>Enter the 6-digit code we sent to your mobile number</p>
              <span className="otp-masked-number">{countryCode} {phoneNumber}</span>
            </div>
            
            <div className="otp-modal-body">
              <div className="otp-inputs-grid" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpDigitsRef.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="otp-digit-input"
                  />
                ))}
              </div>
              
              {otpError && (
                <span className="profile-input-error-msg" style={{ textAlign: 'center', display: 'block' }}>
                  {otpError}
                </span>
              )}
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                <span>In development mode? </span>
                <span style={{ fontWeight: 'semibold', color: 'var(--accent-primary)' }}>Check backend logs</span>
                <span> for the generated OTP code.</span>
              </div>
            </div>
            
            <div className="otp-modal-footer">
              <Button
                variant="primary"
                size="md"
                onClick={handleVerifyOtp}
                loading={isVerifyingOtp}
                disabled={otpDigits.join('').length !== 6}
                style={{ width: '100%' }}
              >
                Verify Code
              </Button>
              
              <div className="otp-modal-actions-row">
                <button
                  type="button"
                  className="otp-resend-action-btn"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || isSendingOtp}
                >
                  {countdown > 0 ? `Resend Code (${countdown}s)` : 'Resend Code'}
                </button>
                
                <button
                  type="button"
                  className="otp-change-num-btn"
                  onClick={() => {
                    handleCloseOtpModal()
                    setIsEditingPhone(true)
                  }}
                >
                  Change Number
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
