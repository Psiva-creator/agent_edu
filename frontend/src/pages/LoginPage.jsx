import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Mail, Lock, Eye, EyeOff, Github,
  Coffee, Headphones, Sun, Moon, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

// ─── Constants ───
const ROLES = [
  "AI Engineer",
  "Cybersecurity Analyst",
  "Data Scientist",
  "Full Stack Developer",
  "Cloud Engineer",
  "ML Engineer",
  "Ethical Hacker",
  "DevOps Engineer"
]

const MOTIVATIONS = [
  "One Commit Closer.",
  "Learning Never Stops.",
  "Build Your Future.",
  "Dream. Build. Repeat."
]

const SCREENS = ['vscode', 'terminal', 'github', 'dashboard', 'resume', 'roadmap', 'mentor', 'skills']

// ─── Neural Canvas Component ───
function NeuralNetworkCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles = []
    const particleCount = 80 // Increased particles
    const connectionDistance = 120
    let mouse = { x: null, y: null, radius: 170 }

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.7
        this.vy = (Math.random() - 0.5) * 0.7
        this.radius = Math.random() * 2 + 1
      }
      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1

        // Mouse attraction/repulsion parallax
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius
            this.x -= dx * force * 0.02
            this.y -= dy * force * 0.02
          }
        }
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.45)'
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.18
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="neural-canvas" />
}

// ─── Tiny Floating AI Orb Assistant ───
function AIAssistantOrb({ mousePos }) {
  const [orbSpeech, setOrbSpeech] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const speeches = ["Need help? 😊", "Secure login active.", "Ready to build! 🚀", "System is green. 🟢"]
        setOrbSpeech(speeches[Math.floor(Math.random() * speeches.length)])
        setTimeout(() => setOrbSpeech(''), 3000)
      }
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ai-orb-container">
      <AnimatePresence>
        {orbSpeech && (
          <motion.div 
            className="orb-speech glass"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -5 }}
            transition={{ duration: 0.25 }}
          >
            {orbSpeech}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        className="ai-orb"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="ai-orb__core" />
        <div className="ai-orb__ring" />
        <div className="ai-orb__eye">
          <div 
            className="ai-orb__pupil"
            style={{
              transform: `translate(${mousePos.x * 3.5}px, ${mousePos.y * 3.5}px)`
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

// ─── LoginPage Component ───
export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [formError, setFormError] = useState('')
  const [loginStatus, setLoginStatus] = useState('idle') // idle, loading, success, failed
  
  // Terminal logs state
  const [terminalLogs, setTerminalLogs] = useState([])
  const [bootProgress, setBootProgress] = useState(0)

  // Character environment triggers
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isLampOn, setIsLampOn] = useState(false) // defaults off for intro
  const [kbColor, setKbColor] = useState('cyan') // cyan, purple, red, green
  const [isSwaying, setIsSwaying] = useState(false)
  const [wearingHeadphones, setWearingHeadphones] = useState(false)
  const [waving, setWaving] = useState(false)
  const [isSipping, setIsSipping] = useState(false)
  const [speechText, setSpeechText] = useState('')
  
  // Easter eggs & environment
  const [catActive, setCatActive] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState('night') // morning, afternoon, evening, night
  const [isRaining, setIsRaining] = useState(true)
  const [rainbowActive, setRainbowActive] = useState(false)
  const [lightningFlash, setLightningFlash] = useState(false)
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0)
  const [motivationalLine, setMotivationalLine] = useState(MOTIVATIONS[0])
  const [surprised, setSurprised] = useState(false)
  const [scratching, setScratching] = useState(false)

  // Spacing & tracking interaction variables
  const [hoveredElement, setHoveredElement] = useState(null) // login, google, github, null
  const [isBlinking, setIsBlinking] = useState(false)
  const [idleTime, setIdleTime] = useState(0)
  const [isStanding, setIsStanding] = useState(false)
  const [idleAction, setIdleAction] = useState('idle') // stretch, glasses, outside, whiteboard
  const [failureCount, setFailureCount] = useState(0)

  // Easter Egg States
  const [droneActive, setDroneActive] = useState(false)
  const [paperAirplaneActive, setPaperAirplaneActive] = useState(false)
  const [meteorActive, setMeteorActive] = useState(false)
  const [butterflyActive, setButterflyActive] = useState(false)
  const [firefliesActive, setFirefliesActive] = useState(false)

  // Intro Sequence State
  // Card is shown immediately. Scene intro phases animate progressively.
  const [introPhase, setIntroPhase] = useState('lamp') // lamp, keyboard, monitor, laptop, walk, sit, active
  const [zoomActive, setZoomActive] = useState(false) // Succesful zoom into monitor
  const [cardReady] = useState(true) // card shows immediately

  const speechTimeoutRef = useRef(null)
  const mouseVelocityRef = useRef({ x: 0, y: 0, lastTime: Date.now() })
  const [monitorScreen, setMonitorScreen] = useState('vscode')
  const [screenMode, setScreenMode] = useState('terminal') // terminal, network

  // ─── Speech bubble triggers ───
  const triggerSpeech = (text, duration = 3000) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current)
    setSpeechText(text)
    speechTimeoutRef.current = setTimeout(() => {
      setSpeechText('')
    }, duration)
  }

  // ─── Intro Animation timeline ───
  // Card shows IMMEDIATELY (perceived <150ms).
  // Scene intro runs progressively in background on right side.
  useEffect(() => {
    // Show card right away for instant perceived performance
    // Scene side intro phases still run for delight
    const timers = [
      setTimeout(() => setIntroPhase('lamp'), 400),
      setTimeout(() => {
        setIntroPhase('keyboard')
        setIsLampOn(true)
      }, 900),
      setTimeout(() => setIntroPhase('monitor'), 1400),
      setTimeout(() => setIntroPhase('laptop'), 1900),
      setTimeout(() => {
        setIntroPhase('walk')
        triggerSpeech("Entering workspace... 🚶‍♂️", 1800)
      }, 2600),
      setTimeout(() => {
        setIntroPhase('sit')
        triggerSpeech("Placing coffee. Coffee = Code. ☕", 1800)
      }, 3800),
      setTimeout(() => {
        setIntroPhase('active')
        triggerSpeech("Welcome! Ready to build your future? 🚀", 3500)
      }, 5000)
    ]
    return () => timers.forEach(t => clearTimeout(t))
  }, [])

  // ─── Monitor Screen Content Cycling ───
  useEffect(() => {
    if (loginStatus !== 'idle') return
    const interval = setInterval(() => {
      setMonitorScreen(prev => {
        const nextIdx = (SCREENS.indexOf(prev) + 1) % SCREENS.length
        return SCREENS[nextIdx]
      })
    }, 3800)
    return () => clearInterval(interval)
  }, [loginStatus])

  // ─── Natural random blinking ───
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, Math.random() * 4000 + 3000)
    return () => clearInterval(blinkInterval)
  }, [])

  // ─── Cursor tracking calculations ───
  useEffect(() => {
    const handleMouseMove = (e) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const nx = (e.clientX - w / 2) / (w / 2)
      const ny = (e.clientY - h / 2) / (h / 2)
      setMousePos({ x: nx, y: ny })

      // Surprise detection on fast cursor movement
      const now = Date.now()
      const dt = now - mouseVelocityRef.current.lastTime
      if (dt > 0) {
        const dx = e.clientX - mouseVelocityRef.current.x
        const dy = e.clientY - mouseVelocityRef.current.y
        const speed = Math.sqrt(dx * dx + dy * dy) / dt
        if (speed > 2.8) {
          setSurprised(true)
          triggerSpeech("Whoa, fast cursor! ⚡", 1500)
          setTimeout(() => setSurprised(false), 900)
        }
      }
      mouseVelocityRef.current = { x: e.clientX, y: e.clientY, lastTime: now }
    }

    const handleMouseLeave = () => {
      setMousePos({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // ─── Role and Motivations Carousels ───
  useEffect(() => {
    const roleInterval = setInterval(() => {
      setCurrentRoleIndex(prev => (prev + 1) % ROLES.length)
    }, 4500)

    const motivationInterval = setInterval(() => {
      setMotivationalLine(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)])
    }, 12000)

    const idleInterval = setInterval(() => {
      if (Math.random() > 0.6 && !isSipping && !waving && !showPassword && !isStanding) {
        const idleSpeeches = [
          "Look at that cyberpunk skyline!",
          "Time for another commit soon...",
          "Need to optimize these query loops.",
          "Code is compilation-ready."
        ]
        triggerSpeech(idleSpeeches[Math.floor(Math.random() * idleSpeeches.length)])
      }
    }, 18000)

    return () => {
      clearInterval(roleInterval)
      clearInterval(motivationInterval)
      clearInterval(idleInterval)
    }
  }, [isSipping, waving, showPassword, isStanding])

  // ─── Idle Ticker (10s and 30s) ───
  useEffect(() => {
    const resetIdle = () => {
      setIdleTime(0)
      if (isStanding) {
        setIsStanding(false)
        triggerSpeech("Back to the grind! 💻", 2000)
      }
      setIdleAction('idle')
    }
    window.addEventListener('mousemove', resetIdle)
    window.addEventListener('keypress', resetIdle)

    const interval = setInterval(() => {
      if (loginStatus !== 'idle') return
      setIdleTime(prev => {
        const nextTime = prev + 1
        
        if (nextTime === 10) {
          const choices = ['stretch', 'glasses', 'outside']
          const choice = choices[Math.floor(Math.random() * choices.length)]
          if (choice === 'stretch') {
            setIdleAction('stretch')
            triggerSpeech("Let's do a quick spine alignment stretch... 🧘‍♂️", 3000)
          } else if (choice === 'glasses') {
            setIdleAction('glasses')
            triggerSpeech("Refocusing visual filters. 👓", 2000)
          } else if (choice === 'outside') {
            setIdleAction('outside')
            triggerSpeech("It's beautiful out there. One day we'll build city-scale AIs. 🏙️", 3000)
          }
        } else if (nextTime === 30) {
          setIsStanding(true)
          setIdleAction('whiteboard')
          triggerSpeech("Let's review the system architecture mapping on the board... 📊", 4000)
        }
        
        return nextTime
      })
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', resetIdle)
      window.removeEventListener('keypress', resetIdle)
      clearInterval(interval)
    }
  }, [loginStatus, isStanding])

  // ─── Random Easter Eggs Scheduler ───
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && loginStatus === 'idle') {
        const eggs = ['drone', 'airplane', 'meteor', 'butterfly', 'fireflies']
        const egg = eggs[Math.floor(Math.random() * eggs.length)]
        if (egg === 'drone') {
          setDroneActive(true)
          triggerSpeech("Look! A drone passing by outside... 🛸", 3000)
          setTimeout(() => setDroneActive(false), 6000)
        } else if (egg === 'airplane') {
          setPaperAirplaneActive(true)
          triggerSpeech("A paper airplane! Someone's sending analog packets. ✈️", 2500)
          setTimeout(() => setPaperAirplaneActive(false), 5000)
        } else if (egg === 'meteor') {
          setMeteorActive(true)
          triggerSpeech("Make a wish! A meteor shower over the city. ☄️", 3000)
          setTimeout(() => setMeteorActive(false), 4000)
        } else if (egg === 'butterfly') {
          if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
            setButterflyActive(true)
            triggerSpeech("A butterfly! Nature's complex neural algorithm. 🦋", 3000)
            setTimeout(() => setButterflyActive(false), 6000)
          }
        } else if (egg === 'fireflies') {
          if (timeOfDay === 'night' || timeOfDay === 'evening') {
            setFirefliesActive(true)
            triggerSpeech("Fireflies lighting up the rainy night... 🪰", 3000)
            setTimeout(() => setFirefliesActive(false), 7000)
          }
        }
      }
    }, 25000)
    return () => clearInterval(interval)
  }, [timeOfDay, loginStatus])

  // ─── Check email validation format ───
  const handleEmailChange = (e) => {
    const val = e.target.value
    setEmail(val)
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    if (valid && !emailValid) {
      setEmailValid(true)
      triggerSpeech("NICE! Email looks validated. Let's do this! 👍")
    } else if (!valid && emailValid) {
      setEmailValid(false)
    }
  }

  // ─── Secret Element Triggers ───
  const triggerCoffee = () => {
    if (isSipping) return
    setIsSipping(true)
    triggerSpeech("Ah, that morning brew is keeping me alive! ☕", 2500)
    setTimeout(() => {
      setIsSipping(false)
    }, 3000)
  }

  const toggleLamp = () => {
    setIsLampOn(!isLampOn)
    triggerSpeech(isLampOn ? "Going stealth mode 🕶️" : "Let there be light! 💡")
  }

  const cycleKbColor = () => {
    const colors = ['cyan', 'purple', 'red', 'green']
    const nextIdx = (colors.indexOf(kbColor) + 1) % colors.length
    setKbColor(colors[nextIdx])
    triggerSpeech(`Keyboard RGB set to: ${colors[nextIdx].toUpperCase()}! ⌨️`)
  }

  const triggerPlant = () => {
    setIsSwaying(true)
    setTimeout(() => setIsSwaying(false), 2000)
    if (Math.random() > 0.5 && (timeOfDay === 'morning' || timeOfDay === 'afternoon')) {
      setButterflyActive(true)
      triggerSpeech("You disturbed a butterfly! 🦋")
      setTimeout(() => setButterflyActive(false), 6000)
    } else {
      triggerSpeech("A touch of nature keeps the mind fresh. 🌿")
    }
  }

  const toggleScreenMode = () => {
    setScreenMode(prev => prev === 'terminal' ? 'network' : 'terminal')
    triggerSpeech("Swapping layout terminal projections! 🖥️")
  }

  const toggleHeadphones = () => {
    setWearingHeadphones(!wearingHeadphones)
    triggerSpeech(wearingHeadphones ? "Ambient audio enabled." : "Tuning into chill synthwave beats... 🎧")
  }

  const handleCharacterDoubleClick = () => {
    setWaving(true)
    triggerSpeech("Hey there! Welcome to the AI Control Panel. 👋")
    setTimeout(() => setWaving(false), 2000)
  }

  const handleDeskLEDTrigger = () => {
    setRainbowActive(true)
    triggerSpeech("Desk LED Neon overdrive activated! 🌈")
    setTimeout(() => setRainbowActive(false), 3000)
  }

  const spawnCat = () => {
    if (catActive) return
    setCatActive(true)
    triggerSpeech("A fluffy visitor has arrived! 🐱", 4000)
    setTimeout(() => setCatActive(false), 7000)
  }

  const triggerLightning = () => {
    setLightningFlash(true)
    triggerSpeech("Thunderstorm overhead! ⚡", 1500)
    setTimeout(() => setLightningFlash(false), 300)
  }

  const cycleTimeOfDay = () => {
    const sequence = ['morning', 'afternoon', 'evening', 'night']
    const next = sequence[(sequence.indexOf(timeOfDay) + 1) % sequence.length]
    setTimeOfDay(next)
    if (next === 'morning') {
      setIsRaining(false)
      triggerSpeech("Rise and shine! Golden hour active. 🌅", 3000)
    } else if (next === 'afternoon') {
      setIsRaining(false)
      triggerSpeech("Bright afternoon workspace lighting. ☀️", 3000)
    } else if (next === 'evening') {
      setIsRaining(true)
      triggerSpeech("Sunset drizzle set. Ambient relax activated. 🌆", 3000)
    } else {
      setIsRaining(true)
      triggerSpeech("Night rain coder mode selected. 🌌", 3000)
    }
  }

  // ─── Google OAuth Hookup ───
  const handleGoogleClick = async () => {
    setLoginStatus('loading')
    setTerminalLogs(["Connecting securely to Google gateway...", "Redirecting client session to OAuth handoff..."])
    setBootProgress(40)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setLoginStatus('failed')
        setFormError(error.message || 'Google Login failed.')
        triggerSpeech("Google handshake failed! Try again. 🚫")
      }
    } catch (e) {
      setLoginStatus('failed')
      setFormError('Authentication failed.')
      triggerSpeech("OAuth error occurred.")
    }
  }

  // ─── Login Form Submission Handler ───
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setLoginStatus('loading')
    setTerminalLogs(["Establishing handshake with neural host...", "Checking credentials packet..."])
    setBootProgress(10)

    // Simulate logs updates
    const bootStates = [
      { prg: 30, log: "Decrypting payload signatures..." },
      { prg: 60, log: "Checking credentials database link..." },
      { prg: 90, log: "Authenticating token variables..." },
      { prg: 100, log: "Mounting user dashboard environment..." }
    ]

    bootStates.forEach((st, idx) => {
      setTimeout(() => {
        setBootProgress(st.prg)
        setTerminalLogs(prev => [...prev, st.log])
      }, (idx + 1) * 350)
    })

    setTimeout(async () => {
      try {
        const { error } = await signIn(email, password)
        if (error) {
          setFailureCount(prev => prev + 1)
          setLoginStatus('failed')
          setScratching(true)
          setTimeout(() => setScratching(false), 2000)

          const nextFail = failureCount + 1
          if (nextFail === 1) {
            triggerSpeech("Hmm...Something isn't right. 🔍", 4000)
            setFormError("Hmm...Something isn't right.")
          } else if (nextFail === 2) {
            triggerSpeech("Check your password. 🔐", 4000)
            setFormError("Check your password.")
          } else {
            triggerSpeech("It happens 😊 Try demo details!", 4000)
            setFormError("It happens 😊")
          }
        } else {
          setLoginStatus('success')
          triggerSpeech("Access granted! Establishing link... 🚀", 3000)

          // Confetti explosion
          const confettiContainer = document.createElement('div')
          confettiContainer.className = 'confetti-wrapper'
          document.body.appendChild(confettiContainer)
          for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div')
            particle.className = 'confetti-p'
            particle.style.left = `${Math.random() * 100}%`
            particle.style.animationDelay = `${Math.random() * 0.8}s`
            particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`
            confettiContainer.appendChild(particle)
          }
          setTimeout(() => confettiContainer.remove(), 2500)

          // Camera zoom into monitor transition
          setTimeout(() => {
            setZoomActive(true)
          }, 1100)

          setTimeout(() => {
            navigate('/dashboard')
          }, 3100)
        }
      } catch (err) {
        console.error(err)
        setLoginStatus('failed')
        setFormError('Authentication failed.')
        triggerSpeech("Login system timeout.")
      }
    }, 1500)
  }

  // Eye and head constraints
  let targetX = mousePos.x
  let targetY = mousePos.y

  if (emailFocused) {
    targetX = -0.7
    targetY = 0.2
  } else if (passwordFocused) {
    targetX = -0.7
    targetY = 0.2
  } else if (hoveredElement === 'login') {
    targetX = -0.7
    targetY = 0.2
  } else if (hoveredElement === 'google') {
    targetX = -0.8
    targetY = 0.4
  } else if (hoveredElement === 'github') {
    targetX = -0.8
    targetY = 0.4
  } else if (idleAction === 'outside') {
    targetX = 0.8
    targetY = -0.1
  } else if (idleAction === 'whiteboard') {
    targetX = -0.9
    targetY = -0.1
  }

  const headX = targetX * 10
  const headY = targetY * 7
  const headRot = targetX * 12

  const eyeX = targetX * 2.2
  const eyeY = targetY * 1.8

  const shouldersTransform = isStanding
    ? `translate(-120px, -45px) rotate(-15deg)`
    : `translate(${mousePos.x * 4}px, ${mousePos.y * 2}px)`

  const headTransform = isStanding 
    ? `translate(-125px, -50px) rotate(-25deg)`
    : `translate(${headX}px, ${headY}px) rotate(${headRot}deg)`

  // Determine current arm state
  let armState = 'idle'
  if (loginStatus === 'success') {
    armState = 'thumbsup'
  } else if (scratching || idleAction === 'scratch-chin') {
    armState = 'scratch'
  } else if (isSipping) {
    armState = 'sip'
  } else if (showPassword) {
    armState = 'hide'
  } else if (waving) {
    armState = 'wave'
  } else if (idleAction === 'stretch') {
    armState = 'stretch'
  } else if (idleAction === 'glasses') {
    armState = 'glasses'
  } else if (hoveredElement === 'google' || hoveredElement === 'github') {
    armState = 'point-left'
  } else if (emailFocused || passwordFocused) {
    armState = 'typing'
  }

  // Walk phase translation coordinates
  let characterTransform = 'scale(1.25) translate(-52px, -45px)' // default seated scaled 25% larger
  if (introPhase === 'black' || introPhase === 'lamp' || introPhase === 'keyboard' || introPhase === 'monitor' || introPhase === 'laptop') {
    characterTransform = 'scale(1.25) translate(300px, 0px) opacity(0)' // offscreen initially
  } else if (introPhase === 'walk') {
    characterTransform = 'scale(1.25) translate(120px, -15px)' // walking in
  } else if (introPhase === 'sit') {
    characterTransform = 'scale(1.25) translate(-10px, -30px)' // pulling chair
  }

  return (
    <div className={`login-page login-page--${timeOfDay} ${isRaining ? 'login-page--rain' : ''} ${lightningFlash ? 'login-page--lightning' : ''}`}>
      
      {/* Intro Black screen overlay — removed for instant perceived performance */}
      {/* Background elements load progressively */}

      {/* Background elements */}
      <NeuralNetworkCanvas />
      <div className="ambient-glow ambient-glow--blue" />
      <div className="ambient-glow ambient-glow--purple" />
      <div className="ambient-glow ambient-glow--warm" />
      <div className="parallax-stars" />

      {/* Main Container */}
      <div className="login-page__container">
        
        {/* ==========================================
            LEFT SIDE: CARD & ORB
            ========================================== */}
        <div className="login-page__form-side">
          {/* Card shows immediately — no intro gating */}
          <motion.div 
            className={`login-card ${loginStatus === 'failed' ? 'shake-animation' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
                {/* AI Assistant Orb */}
                <AIAssistantOrb mousePos={mousePos} />

                {/* Loading overlay */}
                <AnimatePresence>
                  {loginStatus === 'loading' && (
                    <motion.div 
                      className="terminal-overlay glass"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="terminal-overlay__header">
                        <span className="dot dot--red" />
                        <span className="dot dot--yellow" />
                        <span className="dot dot--green" />
                        <span className="terminal-overlay__title">GATEWAY HANDSHAKE</span>
                      </div>
                      <div className="terminal-overlay__body font-mono">
                        {terminalLogs.map((log, idx) => (
                          <div key={idx} className="terminal-line">{log}</div>
                        ))}
                        <div className="terminal-line terminal-line--cursor">_</div>
                      </div>
                      <div className="terminal-overlay__progress">
                        <div className="terminal-overlay__progress-bar" style={{ width: `${bootProgress}%` }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logo */}
                <div className="login-card__logo-wrapper">
                  <div className="login-card__logo">
                    <Sparkles size={22} className="logo-sparkle" />
                  </div>
                  <span className="login-card__logo-text">Career Guide <span className="text-gradient">AI</span></span>
                </div>

                {/* Headers */}
                <h1 className="login-card__title">Welcome Back</h1>
                <p className="login-card__tagline">Learn Smarter. Build Faster. Become Unstoppable.</p>

                {formError && (
                  <div className="error-banner">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={handleSubmit} className="login-card__form">
                  
                  {/* Email address field */}
                  <div className="input-field-group">
                    <span className="input-field-label">Email Address</span>
                    <div className={`input-wrapper ${emailFocused ? 'focused' : ''}`}>
                      <Mail size={18} className="input-icon" />
                      <input 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        className="styled-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="input-field-group">
                    <span className="input-field-label">Password</span>
                    <div className={`input-wrapper ${passwordFocused ? 'focused' : ''}`}>
                      <Lock size={18} className="input-icon" />
                      <div className="password-wrapper">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          className="styled-input"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => {
                            setShowPassword(!showPassword)
                            if (!showPassword) {
                              triggerSpeech("I'll respect your privacy 😊", 3500)
                            }
                          }}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="options-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="checkbox-custom" />
                      <span>Remember Me</span>
                    </label>
                    <a href="#" className="forgot-pwd-link" onClick={(e) => { e.preventDefault(); triggerSpeech("No worries! Verification link sent to your host.") }}>Forgot Password?</a>
                  </div>

                  {/* Login Submit */}
                  <button 
                    type="submit" 
                    className="submit-btn"
                    onMouseEnter={() => {
                      setHoveredElement('login')
                      triggerSpeech("Ready to establish connection? Click below! 🔑")
                    }}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <span>Login</span>
                    <div className="btn-glow" />
                  </button>
                </form>

                <div className="divider">
                  <span className="divider-line" />
                  <span className="divider-text">OR CONTINUE WITH</span>
                  <span className="divider-line" />
                </div>

                {/* Social Login buttons */}
                <div className="social-row">
                  <button 
                    className="social-btn glass"
                    onMouseEnter={() => {
                      setHoveredElement('google')
                      triggerSpeech("Sign in using Google Secure Authentication.", 2000)
                    }}
                    onMouseLeave={() => setHoveredElement(null)}
                    onClick={handleGoogleClick}
                  >
                    <svg className="social-svg" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.92 1 12 1 7.35 1 3.39 3.67 1.48 7.57l3.69 2.87C6.05 7.37 8.78 5.04 12 5.04z"/>
                      <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.51z"/>
                      <path fill="#FBBC05" d="M5.17 10.44c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.48 2.97C.54 4.88 0 7.02 0 9.26s.54 4.38 1.48 6.29l3.69-2.87c-.24-.72-.38-1.5-.38-2.3z"/>
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.5 1.18-4.3 1.18-3.22 0-5.95-2.33-6.83-5.43L1.48 15.87C3.39 20.33 7.35 23 12 23z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  
                  <button 
                    className="social-btn glass"
                    onMouseEnter={() => {
                      setHoveredElement('github')
                      triggerSpeech("Check GitHub build status configuration.", 2000)
                    }}
                    onMouseLeave={() => setHoveredElement(null)}
                    onClick={() => {
                      setLoginStatus('loading')
                      setTimeout(() => navigate('/dashboard'), 1500)
                    }}
                  >
                    <Github size={18} />
                    <span>GitHub</span>
                  </button>
                </div>

                <p className="signup-prompt">
                  New to the platform? <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); navigate('/auth') }}>Create Account</a>
                </p>
          </motion.div>
        </div>

        {/* ==========================================
            RIGHT SIDE: WORKSPACE SCENE
            ========================================== */}
        <div className="login-page__scene-side">
          <div className={`scene-wrapper ${zoomActive ? 'zoom-success' : ''}`}>
            
            {/* Speech bubble */}
            <AnimatePresence>
              {speechText && (
                <motion.div 
                  className="speech-bubble"
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
                >
                  {speechText}
                  <div className="speech-bubble__arrow" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG Illustration Container */}
            <svg 
              viewBox="0 0 600 500" 
              className="workspace-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="screen-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#08071a" />
                  <stop offset="60%" stopColor="#0f0e26" />
                  <stop offset="100%" stopColor="#020108" />
                </linearGradient>
                <linearGradient id="morningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff7e5f" />
                  <stop offset="70%" stopColor="#feb47b" />
                  <stop offset="100%" stopColor="#fffcff" />
                </linearGradient>
                <linearGradient id="daySky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e3c72" />
                  <stop offset="100%" stopColor="#2a5298" />
                </linearGradient>
                <linearGradient id="eveningSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#cc2b5e" />
                  <stop offset="100%" stopColor="#753a88" />
                </linearGradient>
                
                <linearGradient id="lampLight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(253, 224, 71, 0.45)" />
                  <stop offset="100%" stopColor="rgba(253, 224, 71, 0.0)" />
                </linearGradient>
                <linearGradient id="hologramLight" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.45)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                </linearGradient>
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#090514" />
                </linearGradient>
                <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>

              {/* 1. Outside Window & Cityscape */}
              <rect 
                x="50" y="20" width="500" height="280" rx="8" 
                fill={
                  timeOfDay === 'morning' ? "url(#morningSky)" :
                  timeOfDay === 'afternoon' ? "url(#daySky)" :
                  timeOfDay === 'evening' ? "url(#eveningSky)" :
                  "url(#skyGrad)"
                } 
              />
              
              {/* Skyline buildings */}
              <g className="skyline-buildings" opacity="0.35">
                <rect x="70" y="120" width="60" height="180" fill="#0c0724" />
                <rect x="140" y="90" width="50" height="210" fill="#070417" />
                <rect x="200" y="160" width="80" height="140" fill="#0f092e" />
                <rect x="290" y="70" width="70" height="230" fill="#04020a" />
                <rect x="370" y="130" width="50" height="170" fill="#0a0521" />
                <rect x="430" y="100" width="60" height="200" fill="#070419" />
              </g>

              {/* Neon windows on buildings */}
              <g opacity={timeOfDay === 'night' || timeOfDay === 'evening' ? "0.6" : "0.1"}>
                <circle cx="160" cy="140" r="1.5" fill="#fcd34d" />
                <circle cx="160" cy="170" r="1.5" fill="#fcd34d" />
                <circle cx="310" cy="110" r="1.5" fill="#a855f7" />
                <circle cx="320" cy="150" r="1.5" fill="#6366f1" />
                <circle cx="450" cy="120" r="1.5" fill="#22c55e" />
              </g>

              {/* Flying Vehicles */}
              <g className="flying-cars">
                <path d="M 60,150 Q 250,110 520,130" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.7" strokeDasharray="3 9" />
                <circle cx="0" cy="0" r="2.5" fill="#3b82f6" filter="url(#neon-glow)">
                  <animateMotion dur="9s" repeatCount="indefinite" path="M 60,150 Q 250,110 520,130" />
                </circle>
                <circle cx="0" cy="0" r="2" fill="#ec4899" filter="url(#neon-glow)">
                  <animateMotion dur="14s" begin="3s" repeatCount="indefinite" path="M 520,130 Q 250,110 60,150" />
                </circle>
              </g>

              {/* Easter Eggs Window Elements */}
              {droneActive && (
                <g className="drone-easter-egg" filter="url(#neon-glow)">
                  <rect x="0" y="0" width="30" height="6" fill="#1e293b" rx="2"/>
                  <circle cx="-10" cy="-2" r="6" fill="none" stroke="#a855f7" strokeWidth="1.5"/>
                  <circle cx="40" cy="-2" r="6" fill="none" stroke="#a855f7" strokeWidth="1.5"/>
                  <circle cx="15" cy="3" r="2.5" fill="#22c55e"/>
                  <animateTransform 
                    attributeName="transform"
                    type="translate"
                    values="400,100; 100,60; 450,110; 400,100"
                    dur="6s"
                    repeatCount="1"
                  />
                </g>
              )}

              {paperAirplaneActive && (
                <g className="airplane-easter-egg">
                  <path d="M 0,0 L 25,10 L 8,14 Z M 8,14 L 25,10 L 10,18 Z" fill="#e2e8f0"/>
                  <animateTransform 
                    attributeName="transform"
                    type="translate"
                    values="50,180; 550,80"
                    dur="5s"
                    repeatCount="1"
                  />
                </g>
              )}

              {meteorActive && (
                <g className="meteor-shower">
                  <line x1="100" y1="20" x2="20" y2="100" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
                    <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="2s" repeatCount="infinite"/>
                  </line>
                  <line x1="300" y1="20" x2="220" y2="100" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
                    <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="2.5s" repeatCount="infinite"/>
                  </line>
                </g>
              )}

              {butterflyActive && (
                <g className="butterfly-easter-egg">
                  <path d="M 0,0 C -5,-8 -12,-8 -8,0 C -12,8 -5,8 0,0 M 0,0 C 5,-8 12,-8 8,0 C 12,8 5,8 0,0" fill="#f43f5e" filter="url(#neon-glow)"/>
                  <animateTransform 
                    attributeName="transform"
                    type="translate"
                    values="480,240; 420,290; 490,200; 480,240"
                    dur="6s"
                    repeatCount="1"
                  />
                </g>
              )}

              {firefliesActive && (
                <g className="fireflies-easter-egg">
                  <circle cx="120" cy="220" r="2.5" fill="#a3e635" filter="url(#neon-glow)">
                    <animate attributeName="opacity" values="0.2; 1; 0.2" dur="2.5s" repeatCount="infinite"/>
                  </circle>
                  <circle cx="180" cy="240" r="1.5" fill="#a3e635" filter="url(#neon-glow)">
                    <animate attributeName="opacity" values="0.8; 0.1; 0.8" dur="3s" repeatCount="infinite"/>
                  </circle>
                  <circle cx="450" cy="230" r="2" fill="#a3e635" filter="url(#neon-glow)">
                    <animate attributeName="opacity" values="0.1; 0.9; 0.1" dur="2s" repeatCount="infinite"/>
                  </circle>
                </g>
              )}

              {/* Rain animation */}
              {isRaining && (
                <g className="rain-lines" opacity="0.3">
                  <line x1="80" y1="20" x2="70" y2="280" stroke="#93c5fd" strokeWidth="0.8" />
                  <line x1="180" y1="20" x2="170" y2="280" stroke="#93c5fd" strokeWidth="0.8" />
                  <line x1="280" y1="20" x2="270" y2="280" stroke="#93c5fd" strokeWidth="0.8" />
                  <line x1="380" y1="20" x2="370" y2="280" stroke="#93c5fd" strokeWidth="0.8" />
                  <line x1="480" y1="20" x2="470" y2="280" stroke="#93c5fd" strokeWidth="0.8" />
                </g>
              )}

              {/* Window Frame borders */}
              <rect x="50" y="20" width="500" height="280" fill="none" stroke="#2a2936" strokeWidth="10" rx="8" />
              <line x1="300" y1="20" x2="300" y2="300" stroke="#2a2936" strokeWidth="6" />

              {/* 2. Room Desk surface */}
              <path d="M 30,300 L 570,300 L 600,500 L 0,500 Z" fill="#151324" />
              
              {/* LED Strip along desk boundary */}
              <path 
                d="M 30,300 L 570,300" 
                fill="none" 
                stroke={rainbowActive ? 'url(#screenGrad)' : kbColor === 'cyan' ? '#06b6d4' : kbColor === 'purple' ? '#a855f7' : kbColor === 'green' ? '#22c55e' : '#ef4444'} 
                strokeWidth="3.5" 
                filter="url(#neon-glow)" 
                onClick={handleDeskLEDTrigger} 
                style={{ cursor: 'pointer' }}
              />

              {/* Whiteboard (on left wall) */}
              <g className="whiteboard" transform="translate(60, 100)" opacity="0.65">
                <rect x="0" y="0" width="80" height="90" fill="#f8fafc" stroke="#475569" strokeWidth="2" rx="2"/>
                <path d="M 10,20 Q 40,10 70,30" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                <path d="M 15,50 Q 30,70 65,55" fill="none" stroke="#dc2626" strokeWidth="1" />
                <circle cx="40" cy="15" r="3" fill="#16a34a" />
                <text x="40" y="80" fill="#1e293b" fontSize="6px" textAnchor="middle" fontWeight="bold">ROADMAP v3</text>
              </g>

              {/* 3. Desk Elements */}
              
              {/* Cable management */}
              <path d="M 150,300 Q 155,320 152,340" fill="none" stroke="#06050b" strokeWidth="2.5" />
              <path d="M 395,300 Q 390,325 393,350" fill="none" stroke="#06050b" strokeWidth="3" />

              {/* Indoor Plant */}
              <g 
                className={`desk-plant ${isSwaying ? 'swaying' : ''}`} 
                transform="translate(470, 240)" 
                onClick={triggerPlant}
                style={{ cursor: 'pointer' }}
              >
                <rect x="-8" y="40" width="16" height="25" fill="#78350f" rx="3" />
                <path d="M 0,40 C -15,20 -15,0 0,-15 C 15,0 15,20 0,40" fill="#15803d" />
                <path d="M -5,40 C -30,30 -25,10 -10,10 C 5,10 5,30 -5,40" fill="#166534" />
                <path d="M 5,40 C 30,30 25,10 10,10 C -5,10 -5,30 5,40" fill="#166534" />
              </g>

              {/* Desk Lamp */}
              <g className="desk-lamp" transform="translate(90, 220)">
                {isLampOn && (
                  <polygon points="0,35 -60,250 80,250" fill="url(#lampLight)" opacity="0.95" />
                )}
                <rect x="-5" y="40" width="10" height="50" fill="#4b5563" rx="2" />
                <circle cx="0" cy="40" r="12" fill="#374151" onClick={toggleLamp} style={{ cursor: 'pointer' }} />
                <circle cx="0" cy="90" r="16" fill="#1f2937" />
              </g>

              {/* Coffee Mug */}
              <g 
                className={`coffee-mug ${isSipping ? 'sipping-mug' : ''}`}
                transform="translate(160, 310)" 
                onClick={triggerCoffee}
                style={{ cursor: 'pointer' }}
              >
                <path d="M 5,-15 Q 10,-25 5,-35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="steam-line" />
                <path d="M 12,-15 Q 17,-25 12,-35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="steam-line" />
                
                <rect x="-10" y="-12" width="20" height="24" fill="#312e81" rx="3" />
                <path d="M -10,-6 Q -18,-6 -18,0 Q -18,6 -10,6" fill="none" stroke="#312e81" strokeWidth="3" />
              </g>

              {/* Sleek Laptop */}
              <g className="sleek-laptop" transform="translate(180, 290)">
                <path d="M 0,0 L 50,-10 L 60,30 L 10,40 Z" fill="#4b5563" />
                <polygon points="10,40 60,30 85,50 35,60" fill="#1f2937" />
                <line x1="35" y1="60" x2="85" y2="50" stroke="#000" strokeWidth="1" />
                
                {/* Glowing Laptop screen */}
                <polygon 
                  points="14,4 47,-6 55,27 22,37" 
                  fill="#000" 
                  stroke={kbColor === 'cyan' ? '#06b6d4' : '#a855f7'} 
                  strokeWidth="0.8" 
                  filter="url(#screen-glow)" 
                />
                
                {/* Simulated code compiling layout */}
                <circle cx="28" cy="10" r="1.5" fill="#f43f5e" />
                <circle cx="34" cy="8" r="1.5" fill="#22c55e" />
                <circle cx="40" cy="6" r="1.5" fill="#eab308" />
                <line x1="22" y1="18" x2="48" y2="10" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="26" y1="26" x2="52" y2="18" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
              </g>

              {/* Tablet device */}
              <g transform="translate(410, 395)">
                <rect x="-14" y="-10" width="28" height="20" fill="#1e293b" rx="2" stroke="#475569" strokeWidth="1"/>
                <rect x="-12" y="-8" width="24" height="16" fill="#0f172a" rx="1"/>
                <circle cx="0" cy="0" r="4" fill="#a855f7" opacity="0.3" filter="url(#neon-glow)"/>
              </g>

              {/* RGB Gaming Mouse */}
              <g className="gaming-mouse" transform="translate(345, 385)">
                <ellipse cx="0" cy="0" rx="6" ry="10" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                {/* glowing strip */}
                <path 
                  d="M -4,0 Q 0,-1 4,0" 
                  fill="none" 
                  stroke={kbColor === 'cyan' ? '#06b6d4' : kbColor === 'purple' ? '#a855f7' : '#10b981'} 
                  strokeWidth="1.5" 
                  filter="url(#neon-glow)" 
                />
              </g>

              {/* Watch Charging Dock */}
              <g transform="translate(130, 365)">
                <rect x="-10" y="-10" width="16" height="20" fill="#030712" rx="1"/>
                <path d="M -10,-8 L -4,-8" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M -10,-4 L -2,-4" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M -10,0 L -8,0" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="0" cy="-3" r="10" fill="rgba(56, 189, 248, 0.1)" filter="url(#neon-glow)" />
              </g>

              {/* Notebook */}
              <g transform="translate(85, 385)">
                <rect x="-15" y="-10" width="30" height="20" fill="#f8fafc" stroke="#475569" strokeWidth="1" rx="1"/>
                <line x1="0" y1="-10" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1"/>
                <line x1="-10" y1="-5" x2="-3" y2="-5" stroke="#cbd5e1" strokeWidth="0.5"/>
                <line x1="-10" y1="0" x2="-3" y2="0" stroke="#cbd5e1" strokeWidth="0.5"/>
                <line x1="3" y1="-5" x2="10" y2="-5" stroke="#cbd5e1" strokeWidth="0.5"/>
                <line x1="3" y1="0" x2="10" y2="0" stroke="#cbd5e1" strokeWidth="0.5"/>
              </g>

              {/* Sticky Notes */}
              <g transform="translate(440, 305)">
                <rect x="-10" y="-10" width="16" height="16" fill="#fef08a" rx="1" transform="rotate(-5)" opacity="0.9"/>
                <rect x="5" y="-8" width="16" height="16" fill="#fbcfe8" rx="1" transform="rotate(8)" opacity="0.9"/>
              </g>

              {/* Smartphone */}
              <g transform="translate(460, 380)">
                <rect x="-8" y="-14" width="16" height="28" fill="#1e293b" rx="2" stroke="#475569" strokeWidth="1"/>
                <rect x="-6" y="-11" width="12" height="22" fill="#0f172a" rx="1"/>
                <circle cx="0" cy="0" r="5" fill="#38bdf8" opacity="0.3" filter="url(#neon-glow)"/>
                <circle cx="0" cy="-7" r="1.5" fill="#a855f7" />
              </g>

              {/* Smart Watch Dock */}
              <g transform="translate(490, 360)">
                <ellipse cx="0" cy="0" rx="10" ry="6" fill="#334155" stroke="#475569" strokeWidth="1"/>
                <ellipse cx="0" cy="-2" rx="7" ry="4" fill="#1e293b"/>
                <path d="M -5,-15 C -8,-15 -8,-5 0,0 C 8,-5 8,-15 5,-15" fill="none" stroke="#22c55e" strokeWidth="2" filter="url(#neon-glow)"/>
              </g>

              {/* AI Hologram Base Emitter */}
              <g transform="translate(195, 310)">
                <ellipse cx="0" cy="0" rx="10" ry="4" fill="#374151" stroke="#4b5563" strokeWidth="1"/>
                <ellipse cx="0" cy="-1" rx="6" ry="2" fill="#06b6d4" filter="url(#neon-glow)"/>
                <polygon points="0,-1 -30,-60 30,-60" fill="url(#hologramLight)" opacity="0.25"/>
                <g className="hologram-projected">
                  <circle cx="0" cy="-45" r="4" fill="#06b6d4" filter="url(#neon-glow)"/>
                  <circle cx="-10" cy="-55" r="2.5" fill="#a855f7" filter="url(#neon-glow)"/>
                  <circle cx="10" cy="-55" r="2.5" fill="#22c55e" filter="url(#neon-glow)"/>
                  <line x1="0" y1="-45" x2="-10" y2="-55" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="0.8"/>
                  <line x1="0" y1="-45" x2="10" y2="-55" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="0.8"/>
                </g>
              </g>

              {/* Ultrawide Monitor Display */}
              <g 
                className="ultrawide-monitor" 
                transform="translate(340, 210)"
                onClick={toggleScreenMode}
                style={{ cursor: 'pointer' }}
              >
                {/* Stand */}
                <rect x="55" y="80" width="20" height="50" fill="#374151" />
                <polygon points="35,130 95,130 85,115 45,115" fill="#1f2937" />
                
                {/* Display Frame */}
                <rect x="-20" y="-30" width="170" height="110" rx="6" fill="#111827" stroke="#374151" strokeWidth="4" />
                
                {/* Screen Glow */}
                <rect 
                  x="-16" y="-26" width="162" height="102" rx="4" 
                  fill="url(#screenGrad)" 
                  filter="url(#screen-glow)" 
                />
                
                {hoveredElement === 'github' ? (
                  <g transform="translate(60, 22)" filter="url(#neon-glow)" fill="#fff" opacity="0.9">
                    <path d="M 12,0 C 5.37,0 0,5.37 0,12 C 0,17.3 3.438,21.8 8.205,23.4 C 8.805,23.5 9.025,23.14 9.025,22.82 C 9.025,22.53 9.015,21.77 9.01,20.92 C 5.67,21.64 4.965,19.31 4.965,19.31 C 4.42,17.92 3.63,17.55 3.63,17.55 C 2.54,16.8 3.71,16.82 3.71,16.82 C 4.91,16.9 5.545,18.06 5.545,18.06 C 6.615,19.9 8.355,19.37 9.04,19.06 C 9.15,18.28 9.46,17.75 9.805,17.45 C 7.14,17.15 4.34,16.12 4.34,11.53 C 4.34,10.22 4.81,9.15 5.575,8.31 C 5.45,8.01 5.04,6.79 5.69,5.14 C 5.69,5.14 6.7,4.82 8.985,6.37 C 9.945,6.1 10.975,5.97 12,5.965 C 13.025,5.97 14.055,6.1 15.015,6.37 C 17.3,4.82 18.31,5.14 18.31,5.14 C 18.96,6.79 18.55,8.01 18.425,8.31 C 19.195,9.15 19.66,10.22 19.66,11.53 C 19.66,16.13 16.855,17.15 14.18,17.44 C 14.61,17.81 14.99,18.54 14.99,19.66 C 14.99,21.26 14.975,22.56 14.975,22.95 C 14.975,23.27 15.19,23.64 15.8,23.52 C 20.57,21.9 24,17.35 24,12 C 24,5.37 18.63,0 12,0 Z" transform="scale(1.7) translate(-12, -12)" />
                    <text x="5" y="38" fill="#fff" fontSize="6px" textAnchor="middle">VERIFYING GITHUB PIPELINE</text>
                  </g>
                ) : monitorScreen === 'vscode' ? (
                  // VS Code — AI Career code editor look
                  <g opacity="0.95" style={{ fontSize: '5px', fontFamily: 'monospace' }}>
                    {/* Tab bar */}
                    <rect x="-16" y="-26" width="162" height="10" fill="rgba(0,0,0,0.5)" />
                    <rect x="-16" y="-26" width="56" height="10" fill="rgba(99,102,241,0.2)" />
                    <text x="-10" y="-19" fill="#a78bfa">career_engine.py</text>
                    <text x="44" y="-19" fill="rgba(255,255,255,0.3)">roadmap.ts</text>
                    {/* Code */}
                    <text x="-10" y="-5" fill="#94a3b8">1</text>
                    <text x="-2" y="-5" fill="#c084fc">import</text>
                    <text x="20" y="-5" fill="#e2e8f0"> CareerAI</text>
                    <text x="-10" y="5" fill="#94a3b8">2</text>
                    <text x="-2" y="5" fill="#34d399">model</text>
                    <text x="18" y="5" fill="rgba(255,255,255,0.5)"> = CareerAI.load(</text>
                    <text x="-10" y="15" fill="#94a3b8">3</text>
                    <text x="-2" y="15" fill="#38bdf8">  skills</text>
                    <text x="22" y="15" fill="rgba(255,255,255,0.5)">=</text>
                    <text x="26" y="15" fill="#fbbf24"> user.profile</text>
                    <text x="-10" y="25" fill="#94a3b8">4</text>
                    <text x="-2" y="25" fill="#a78bfa">result</text>
                    <text x="22" y="25" fill="rgba(255,255,255,0.5)"> = model.</text>
                    <text x="50" y="25" fill="#34d399">predict()</text>
                    {/* Cursor blink */}
                    <rect x="75" y="20" width="4" height="6" fill="#818cf8" opacity="0.8">
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite"/>
                    </rect>
                    {/* Status bar */}
                    <rect x="-16" y="68" width="162" height="8" fill="rgba(79,70,229,0.8)" />
                    <text x="-10" y="74" fill="#e2e8f0" style={{fontSize:'4px'}}>● Python 3.11  ✓ Ready  AI: Connected</text>
                  </g>
                ) : monitorScreen === 'terminal' ? (
                  // Terminal with boot sequence
                  <g opacity="0.95" style={{ fontSize: '5.5px', fontFamily: 'monospace' }}>
                    <text x="-10" y="-12" fill="#4ade80">[career-guide-ai]</text>
                    <text x="50" y="-12" fill="rgba(255,255,255,0.4)">~/workspace</text>
                    <text x="-10" y="0" fill="rgba(255,255,255,0.7)">$ python analyze_resume.py</text>
                    <text x="-10" y="12" fill="#22d3ee">[AI]</text>
                    <text x="2" y="12" fill="rgba(255,255,255,0.8)"> Parsing 847 job postings...</text>
                    <text x="-10" y="24" fill="#4ade80">[✓]</text>
                    <text x="2" y="24" fill="rgba(255,255,255,0.8)"> Match rate: 94% — Top tier!</text>
                    <text x="-10" y="36" fill="#f59e0b">[!]</text>
                    <text x="2" y="36" fill="rgba(255,255,255,0.8)"> Skill gap: Kubernetes</text>
                    <text x="-10" y="48" fill="rgba(255,255,255,0.4)">$ _</text>
                    <rect x="-7" y="43" width="3" height="6" fill="#4ade80">
                      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
                    </rect>
                  </g>
                ) : monitorScreen === 'github' ? (
                  <g opacity="0.95" style={{ fontSize: '5.5px', fontFamily: 'monospace' }}>
                    <text x="-10" y="-12" fill="#e2e8f0">github.com/</text>
                    <text x="20" y="-12" fill="#a78bfa">career-guide-ai</text>
                    <rect x="-10" y="-6" width="140" height="1.5" fill="rgba(255,255,255,0.08)" />
                    <text x="-10" y="6" fill="#4ade80">● main</text>
                    <text x="20" y="6" fill="rgba(255,255,255,0.5)"> — 47 commits ahead</text>
                    <text x="-10" y="17" fill="#94a3b8">Latest: feat/ai-mentor-v2 ✅</text>
                    <text x="-10" y="28" fill="#fbbf24">⚡ CI/CD: Deployed to prod</text>
                    <text x="-10" y="39" fill="#38bdf8">★ 2.3k stars  🍴 891 forks</text>
                  </g>
                ) : monitorScreen === 'dashboard' ? (
                  // AI Career Dashboard — bento grid
                  <g opacity="0.92">
                    <text x="-10" y="-18" fill="#e2e8f0" style={{fontSize:'6px', fontWeight:'bold'}}>Career Dashboard</text>
                    {/* Card 1: match score */}
                    <rect x="-10" y="-10" width="62" height="33" rx="2" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.25)" strokeWidth="0.5" />
                    <text x="-5" y="0" fill="#94a3b8" style={{fontSize:'5px'}}>Job Match</text>
                    <text x="-5" y="13" fill="#818cf8" style={{fontSize:'13px', fontWeight:'bold'}}>94%</text>
                    <text x="-5" y="22" fill="#4ade80" style={{fontSize:'4.5px'}}>↑ 8% this week</text>
                    {/* Card 2: salary */}
                    <rect x="57" y="-10" width="72" height="33" rx="2" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.25)" strokeWidth="0.5" />
                    <text x="62" y="0" fill="#94a3b8" style={{fontSize:'5px'}}>Est. Salary</text>
                    <text x="62" y="13" fill="#c084fc" style={{fontSize:'10px', fontWeight:'bold'}}>$148k</text>
                    <text x="62" y="22" fill="#94a3b8" style={{fontSize:'4.5px'}}>ML Eng · SF Bay Area</text>
                  </g>
                ) : monitorScreen === 'resume' ? (
                  // Resume ATS Analysis
                  <g opacity="0.95" style={{ fontSize: '5.5px' }}>
                    <text x="-10" y="-14" fill="#a78bfa" style={{fontWeight:'bold'}}>Resume ATS Analyzer</text>
                    <rect x="-10" y="-8" width="140" height="1.5" fill="rgba(255,255,255,0.12)" />
                    {/* Score bar */}
                    <text x="-10" y="4" fill="#94a3b8">ATS Score</text>
                    <rect x="30" y="-1" width="80" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
                    <rect x="30" y="-1" width="72" height="6" rx="3" fill="#4ade80" />
                    <text x="115" y="5" fill="#4ade80">92%</text>
                    <text x="-10" y="18" fill="#4ade80">✓ Strong keywords</text>
                    <text x="-10" y="28" fill="#4ade80">✓ Quantified impact</text>
                    <text x="-10" y="38" fill="#f59e0b">△ Add: Docker, K8s</text>
                    <text x="-10" y="48" fill="#94a3b8">↳ 3 skill gaps auto-suggested</text>
                  </g>
                ) : monitorScreen === 'roadmap' ? (
                  // Learning Roadmap with milestones
                  <g opacity="0.92" style={{ fontSize: '5px' }}>
                    <text x="-10" y="-16" fill="#22d3ee" style={{fontWeight:'bold', fontSize:'5.5px'}}>Learning Roadmap — ML Engineer</text>
                    {/* Timeline path */}
                    <path d="M -5,10 L 35,0 L 75,20 L 115,5" fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
                    {/* Milestones */}
                    <circle cx="-5" cy="10" r="3.5" fill="#4ade80" />
                    <text x="-8" y="22" fill="#4ade80">Python ✓</text>
                    <circle cx="35" cy="0" r="3.5" fill="#4ade80" />
                    <text x="27" y="-6" fill="#4ade80">ML Basics ✓</text>
                    <circle cx="75" cy="20" r="3.5" fill="#818cf8" />
                    <text x="62" y="32" fill="#818cf8">Deep Learning</text>
                    <circle cx="115" cy="5" r="3.5" fill="rgba(168,85,247,0.5)" />
                    <text x="105" y="-2" fill="rgba(168,85,247,0.7)">MLOps</text>
                    {/* Progress label */}
                    <text x="25" y="52" fill="rgba(255,255,255,0.5)" style={{fontSize:'4.5px'}}>2 of 4 milestones complete · Est. 6 weeks</text>
                  </g>
                ) : monitorScreen === 'mentor' ? (
                  // AI Mentor Chat
                  <g opacity="0.95" style={{ fontSize: '5px' }}>
                    <text x="-10" y="-14" fill="#4ade80" style={{fontWeight:'bold', fontSize:'5.5px'}}>AI Career Mentor · Online</text>
                    <circle cx="60" cy="-17" r="3" fill="#4ade80">
                      <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    {/* Message bubbles */}
                    <rect x="-10" y="-5" width="80" height="14" rx="4" fill="rgba(255,255,255,0.07)" />
                    <text x="-5" y="5" fill="#e2e8f0">How's my interview prep going?</text>
                    <rect x="30" y="14" width="100" height="20" rx="4" fill="rgba(99,102,241,0.25)" />
                    <text x="35" y="22" fill="#c7d2fe">Great progress! 87% ready.</text>
                    <text x="35" y="31" fill="#c7d2fe">Focus on system design today.</text>
                    {/* Typing indicator */}
                    <rect x="-10" y="39" width="30" height="12" rx="4" fill="rgba(255,255,255,0.05)" />
                    <circle cx="-3" cy="45" r="1.5" fill="#94a3b8">
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="0s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="3" cy="45" r="1.5" fill="#94a3b8">
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="9" cy="45" r="1.5" fill="#94a3b8">
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="0.6s" repeatCount="indefinite"/>
                    </circle>
                  </g>
                ) : (
                  // Skills Analytics network graph
                  <g opacity="0.85">
                    <text x="-8" y="-14" fill="#e2e8f0" style={{fontSize:'5.5px', fontWeight:'bold'}}>Skill Analytics</text>
                    {/* Central node */}
                    <circle cx="65" cy="25" r="7" fill="rgba(99,102,241,0.3)" stroke="#818cf8" strokeWidth="1"/>
                    <text x="56" y="28" fill="#e2e8f0" style={{fontSize:'4px'}}>YOU</text>
                    {/* Skill nodes */}
                    <circle cx="20" cy="5" r="4.5" fill="rgba(34,211,238,0.3)" stroke="#22d3ee" strokeWidth="0.8"/>
                    <text x="10" y="-1" fill="#22d3ee" style={{fontSize:'4px'}}>Python</text>
                    <circle cx="110" cy="10" r="4" fill="rgba(168,85,247,0.3)" stroke="#c084fc" strokeWidth="0.8"/>
                    <text x="104" y="5" fill="#c084fc" style={{fontSize:'4px'}}>React</text>
                    <circle cx="20" cy="45" r="4" fill="rgba(74,222,128,0.3)" stroke="#4ade80" strokeWidth="0.8"/>
                    <text x="10" y="55" fill="#4ade80" style={{fontSize:'4px'}}>ML/AI</text>
                    <circle cx="110" cy="45" r="3.5" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth="0.8"/>
                    <text x="104" y="55" fill="#fbbf24" style={{fontSize:'4px'}}>Cloud</text>
                    {/* Connections */}
                    <line x1="65" y1="25" x2="20" y2="5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                    <line x1="65" y1="25" x2="110" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                    <line x1="65" y1="25" x2="20" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                    <line x1="65" y1="25" x2="110" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
                  </g>
                )}

                {/* Email Verification Banner */}
                {emailValid && (
                  <g transform="translate(10, 68)">
                    <rect x="-20" y="-8" width="142" height="15" fill="rgba(34, 197, 94, 0.9)" rx="3" />
                    <text x="-14" y="2" fill="#fff" fontSize="8px" fontWeight="bold">✔ EMAIL VERIFIED & GATEWAY SYNCED</text>
                  </g>
                )}
              </g>

              {/* Mechanical Keyboard */}
              <g className="mechanical-keyboard" transform="translate(200, 370)">
                <rect x="0" y="0" width="130" height="28" fill="#1f2937" rx="3" stroke="#374151" strokeWidth="2" />
                <g 
                  stroke={kbColor === 'cyan' ? '#22d3ee' : kbColor === 'purple' ? '#c084fc' : kbColor === 'green' ? '#4ade80' : '#f87171'} 
                  strokeWidth="1.5" 
                  fill="none" 
                  filter="url(#neon-glow)"
                  onClick={cycleKbColor}
                  style={{ cursor: 'pointer' }}
                >
                  <line x1="10" y1="6" x2="120" y2="6" strokeDasharray="3 3" />
                  <line x1="10" y1="12" x2="120" y2="12" strokeDasharray="4 2" />
                  <line x1="10" y1="18" x2="120" y2="18" strokeDasharray="2 4" />
                </g>
              </g>

              {/* ==========================================
                  4. CODER CHARACTER (Scaled 25% Larger)
                  ========================================== */}
              <g 
                className="coder-character"
                onDoubleClick={handleCharacterDoubleClick}
                style={{ cursor: 'pointer' }}
                transform={characterTransform}
              >
                
                {/* Static base body / Chair backrest */}
                {!isStanding && <circle cx="260" cy="270" r="32" fill="#111827" stroke="#374151" strokeWidth="2" />}
                
                {/* Torso Hood group */}
                <g 
                  className="shoulders"
                  style={{
                    transform: shouldersTransform,
                    transition: 'transform 0.4s ease-out'
                  }}
                >
                  <path d="M 210,340 Q 260,260 310,340 L 320,430 L 200,430 Z" fill="url(#hoodieGrad)" />
                  <circle cx="260" cy="285" r="14" fill="#f43f5e" opacity="0.1" />
                </g>

                {/* Head Group (Translates & Rotates on Cursor) */}
                <g 
                  className="head-group"
                  style={{
                    transform: headTransform,
                    transformOrigin: '260px 250px',
                    transition: 'transform 0.35s ease-out'
                  }}
                >
                  {/* Neck */}
                  <rect x="248" y="258" width="24" height="25" fill="#fbcfe8" rx="4" />
                  
                  {/* Face base */}
                  <rect x="235" y="200" width="50" height="65" fill="#fbcfe8" rx="14" />
                  
                  {/* Hair cap */}
                  <path d="M 233,212 Q 260,185 287,212 Q 292,235 285,245 Q 260,225 235,245 Z" fill="#1e1b4b" />
                  {/* Hair highlights/stands */}
                  <path d="M 245,200 Q 260,190 270,205" fill="none" stroke="#6366f1" strokeWidth="1.2" />

                  {/* Smart Glasses */}
                  <g className="glasses" stroke={isLampOn ? '#06b6d4' : '#6366f1'} strokeWidth="2.2" fill="none" filter="url(#neon-glow)">
                    <rect x="238" y="222" width="18" height="13" rx="2" />
                    <rect x="264" y="222" width="18" height="13" rx="2" />
                    <line x1="256" y1="228" x2="264" y2="228" />
                  </g>
                  {/* Lens reflections */}
                  <line x1="240" y1="224" x2="252" y2="232" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="266" y1="224" x2="278" y2="232" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

                  {/* Wireless Headphones */}
                  {wearingHeadphones && (
                    <g className="headphones-overlay" filter="url(#neon-glow)">
                      <path d="M 230,225 C 230,180 290,180 290,225" fill="none" stroke="#e11d48" strokeWidth="4" />
                      <rect x="227" y="218" width="8" height="20" rx="3" fill="#e11d48" />
                      <rect x="285" y="218" width="8" height="20" rx="3" fill="#e11d48" />
                    </g>
                  )}

                  {/* Eyes / Pupils with constraints */}
                  {showPassword ? (
                    // Closed eyes smile posture
                    <g stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none">
                      <path d="M 242,233 Q 247,238 252,233" />
                      <path d="M 268,233 Q 273,238 278,233" />
                    </g>
                  ) : isBlinking ? (
                    // Blink line
                    <g stroke="#1e1b4b" strokeWidth="2.5" fill="none">
                      <line x1="241" y1="234" x2="253" y2="234" />
                      <line x1="267" y1="234" x2="279" y2="234" />
                    </g>
                  ) : (
                    // Active pupil tracking
                    <g className="pupils">
                      {/* Left Eye */}
                      <circle cx="247" cy="234" r="4.2" fill="#fff" />
                      <circle 
                        cx={247 + eyeX} 
                        cy={234 + eyeY} 
                        r={surprised ? "2.5" : "1.8"} 
                        fill="#030712" 
                      />
                      
                      {/* Right Eye */}
                      <circle cx="273" cy="234" r="4.2" fill="#fff" />
                      <circle 
                        cx={273 + eyeX} 
                        cy={234 + eyeY} 
                        r={surprised ? "2.5" : "1.8"} 
                        fill="#030712" 
                      />
                    </g>
                  )}

                  {/* Mouth expressions */}
                  {loginStatus === 'success' || armState === 'thumbsup' ? (
                    <path d="M 254,254 Q 260,262 266,254" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                  ) : showPassword ? (
                    <path d="M 255,253 Q 260,259 265,253" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                  ) : (
                    <line x1="254" y1="253" x2="266" y2="253" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
                  )}

                  {/* Cheeks blush */}
                  {(waving || showPassword) && (
                    <g opacity="0.45">
                      <circle cx="240" cy="242" r="3" fill="#f43f5e" />
                      <circle cx="280" cy="242" r="3" fill="#f43f5e" />
                    </g>
                  )}
                </g>

                {/* Left Arm (Resting/Typing) */}
                {!isStanding && (
                  <g className={armState === 'typing' ? 'left-arm' : 'left-arm-idle'}>
                    <path d="M 210,340 C 180,360 170,390 190,395" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                    <circle cx="190" cy="395" r="7" fill="#fbcfe8" />
                  </g>
                )}

                {/* Right Arm posture mapping */}
                {isStanding ? (
                  <g className="standing-arms">
                    <path d="M 140,295 C 120,280 80,260 70,250" fill="none" stroke="#374151" strokeWidth="14" strokeLinecap="round"/>
                    <circle cx="70" cy="250" r="7" fill="#fbcfe8"/>
                  </g>
                ) : (
                  <>
                    {armState === 'stretch' && (
                      <g className="right-arm-stretch">
                        <path d="M 310,340 C 340,300 350,220 330,190" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="330" cy="190" r="7" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'glasses' && (
                      <g className="right-arm-glasses">
                        <path d="M 310,340 C 330,310 290,250 275,236" fill="none" stroke="#374151" strokeWidth="14" strokeLinecap="round" />
                        <circle cx="275" cy="236" r="6" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'thumbsup' && (
                      <g className="right-arm-thumbsup">
                        <path d="M 310,340 C 350,340 360,290 350,280" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="350" cy="280" r="7" fill="#fbcfe8" />
                        <path d="M 350,277 L 350,270" stroke="#fbcfe8" strokeWidth="3.5" strokeLinecap="round" />
                      </g>
                    )}

                    {armState === 'scratch' && (
                      <g className="right-arm-scratch">
                        <path d="M 310,340 C 340,310 300,270 280,260" fill="none" stroke="#374151" strokeWidth="14" strokeLinecap="round" />
                        <circle cx="280" cy="260" r="6" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'sip' && (
                      <g className="right-arm-sip">
                        <path d="M 310,340 C 330,320 300,280 276,276" fill="none" stroke="#374151" strokeWidth="14" strokeLinecap="round" />
                        <circle cx="276" cy="276" r="6" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'hide' && (
                      <g className="right-arm-hide">
                        <path d="M 310,340 C 315,310 280,230 260,235" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="260" cy="235" r="9" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'wave' && (
                      <g className="right-arm-wave">
                        <path d="M 310,340 C 350,330 360,260 365,240" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="365" cy="240" r="7" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'point-left' && (
                      <g className="right-arm-point">
                        <path d="M 310,340 C 270,360 210,370 190,380" fill="none" stroke="#374151" strokeWidth="14" strokeLinecap="round" />
                        <circle cx="190" cy="380" r="7" fill="#fbcfe8" />
                        <line x1="190" y1="380" x2="182" y2="378" stroke="#fbcfe8" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    )}

                    {armState === 'typing' && (
                      <g className="right-arm-typing">
                        <path d="M 310,340 C 320,360 310,390 325,395" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="325" cy="395" r="7" fill="#fbcfe8" />
                      </g>
                    )}

                    {armState === 'idle' && (
                      <g className="right-arm-idle">
                        <path d="M 310,340 C 330,360 320,390 310,385" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="round" />
                        <circle cx="310" cy="385" r="7" fill="#fbcfe8" />
                      </g>
                    )}
                  </>
                )}
              </g>

              {/* desk visitor cat */}
              {catActive && (
                <g className="desk-cat" transform="translate(420, 360)">
                  <ellipse cx="0" cy="0" rx="14" ry="10" fill="#f59e0b" />
                  <circle cx="10" cy="-6" r="8" fill="#f59e0b" />
                  <polygon points="4,-12 8,-18 10,-12" fill="#ef4444" />
                  <polygon points="12,-12 16,-18 18,-12" fill="#ef4444" />
                  <path d="M -12,4 Q -22,-6 -14,-15" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )}

            </svg>
          </div>
        </div>

      </div>

      {/* Scenery Cycle Strip Buttons */}
      <div className="theme-toggle-strip glass">
        <button onClick={cycleTimeOfDay} title="Cycle day time scenery">
          {timeOfDay === 'morning' && <Sun size={18} className="text-yellow-400" />}
          {timeOfDay === 'afternoon' && <Sun size={18} className="text-amber-500" />}
          {timeOfDay === 'evening' && <Moon size={18} className="text-orange-400" />}
          {timeOfDay === 'night' && <Moon size={18} className="text-indigo-400" />}
        </button>
        <button onClick={triggerLightning} title="Trigger weather lightning strike">
          <Sparkles size={18} className="text-indigo-400" />
        </button>
        <button onClick={spawnCat} title="Call desk cat helper">
          <span style={{ fontSize: '15px' }}>🐱</span>
        </button>
      </div>

    </div>
  )
}
