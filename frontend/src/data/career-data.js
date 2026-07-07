import { Terminal, Database, Shield, Cloud, Layout, Smartphone, Glasses, Hexagon, FileCode } from 'lucide-react'

// ─── Predefined Categories & Careers ─────────────────────────────────

export const CAREER_CATEGORIES = [
  {
    id: 'software_dev',
    label: 'Software Development',
    icon: Terminal,
    careers: [
      { id: 'python_dev', title: 'Python Developer', desc: 'Build backend systems, scripts, and data applications.', time: '4-6 mos', difficulty: 'Beginner+', demand: 'High', salary: '$105k' },
      { id: 'frontend_dev', title: 'Frontend Developer', desc: 'Create interactive user interfaces and web applications.', time: '4-6 mos', difficulty: 'Beginner', demand: 'Very High', salary: '$100k' },
      { id: 'backend_dev', title: 'Backend Developer', desc: 'Design server-side logic, databases, and APIs.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'High', salary: '$120k' },
      { id: 'fullstack_dev', title: 'Full Stack Developer', desc: 'Master both frontend and backend technologies.', time: '8-12 mos', difficulty: 'Intermediate', demand: 'Very High', salary: '$130k' },
      { id: 'java_dev', title: 'Java Developer', desc: 'Build scalable enterprise and Android applications.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'High', salary: '$110k' },
      { id: 'cpp_dev', title: 'C++ Developer', desc: 'Develop high-performance systems and games.', time: '8-12 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$125k' },
      { id: 'mobile_dev', title: 'Mobile App Developer', desc: 'Build native or cross-platform iOS and Android apps.', time: '5-7 mos', difficulty: 'Intermediate', demand: 'High', salary: '$115k' },
      { id: 'game_dev', title: 'Game Developer', desc: 'Create interactive entertainment and simulation systems.', time: '8-12 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$95k' },
    ]
  },
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    icon: Hexagon,
    careers: [
      { id: 'ai_engineer', title: 'AI Engineer', desc: 'Build intelligent systems and deploy AI models.', time: '6-9 mos', difficulty: 'Advanced', demand: 'Very High', salary: '$150k' },
      { id: 'ml_engineer', title: 'Machine Learning Engineer', desc: 'Design and train predictive models and neural networks.', time: '6-9 mos', difficulty: 'Advanced', demand: 'Very High', salary: '$145k' },
      { id: 'data_scientist', title: 'Data Scientist', desc: 'Analyze complex data to drive business decisions.', time: '7-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$135k' },
      { id: 'data_analyst', title: 'Data Analyst', desc: 'Process and visualize data to uncover actionable insights.', time: '3-5 mos', difficulty: 'Beginner+', demand: 'Very High', salary: '$85k' },
      { id: 'nlp_engineer', title: 'NLP Engineer', desc: 'Develop language models and text processing systems.', time: '6-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$155k' },
      { id: 'cv_engineer', title: 'Computer Vision Engineer', desc: 'Build image recognition and spatial computing AI.', time: '7-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$150k' },
      { id: 'mlops_engineer', title: 'MLOps Engineer', desc: 'Scale and maintain production machine learning systems.', time: '6-9 mos', difficulty: 'Advanced', demand: 'Very High', salary: '$160k' },
    ]
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity',
    icon: Shield,
    careers: [
      { id: 'cyber_analyst', title: 'Cybersecurity Analyst', desc: 'Monitor networks and respond to security incidents.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'Very High', salary: '$105k' },
      { id: 'security_engineer', title: 'Security Engineer', desc: 'Design secure architectures and implement defenses.', time: '6-9 mos', difficulty: 'Advanced', demand: 'High', salary: '$135k' },
      { id: 'pen_tester', title: 'Penetration Tester', desc: 'Ethically hack systems to find and fix vulnerabilities.', time: '7-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$120k' },
      { id: 'soc_analyst', title: 'SOC Analyst', desc: 'First line of defense in Security Operations Centers.', time: '4-6 mos', difficulty: 'Intermediate', demand: 'Very High', salary: '$90k' },
      { id: 'cloud_security', title: 'Cloud Security Engineer', desc: 'Secure AWS, Azure, and GCP cloud infrastructure.', time: '6-9 mos', difficulty: 'Advanced', demand: 'High', salary: '$145k' },
      { id: 'forensics', title: 'Digital Forensics', desc: 'Investigate cybercrimes and recover digital evidence.', time: '6-10 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$110k' },
    ]
  },
  {
    id: 'cloud_devops',
    label: 'Cloud & DevOps',
    icon: Cloud,
    careers: [
      { id: 'cloud_engineer', title: 'Cloud Engineer', desc: 'Design and manage cloud-based infrastructure.', time: '6-8 mos', difficulty: 'Intermediate', demand: 'Very High', salary: '$130k' },
      { id: 'aws_engineer', title: 'AWS Engineer', desc: 'Specialize in Amazon Web Services architecture.', time: '5-7 mos', difficulty: 'Intermediate', demand: 'High', salary: '$135k' },
      { id: 'azure_engineer', title: 'Azure Engineer', desc: 'Build and manage solutions on Microsoft Azure.', time: '5-7 mos', difficulty: 'Intermediate', demand: 'High', salary: '$130k' },
      { id: 'gcp_engineer', title: 'Google Cloud Engineer', desc: 'Implement infrastructure on Google Cloud Platform.', time: '5-7 mos', difficulty: 'Intermediate', demand: 'High', salary: '$135k' },
      { id: 'devops_engineer', title: 'DevOps Engineer', desc: 'Automate deployments and manage CI/CD pipelines.', time: '6-9 mos', difficulty: 'Advanced', demand: 'Very High', salary: '$140k' },
      { id: 'sre', title: 'Site Reliability Engineer', desc: 'Ensure software systems are scalable and reliable.', time: '7-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$155k' },
      { id: 'platform_engineer', title: 'Platform Engineer', desc: 'Build internal developer platforms and tools.', time: '6-9 mos', difficulty: 'Advanced', demand: 'High', salary: '$150k' },
    ]
  },
  {
    id: 'data_engineering',
    label: 'Data Engineering',
    icon: Database,
    careers: [
      { id: 'data_engineer', title: 'Data Engineer', desc: 'Build data pipelines and warehouse architectures.', time: '6-9 mos', difficulty: 'Intermediate', demand: 'Very High', salary: '$135k' },
      { id: 'dba', title: 'Database Administrator', desc: 'Maintain, secure, and optimize database systems.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'Medium', salary: '$100k' },
      { id: 'big_data', title: 'Big Data Engineer', desc: 'Process massive datasets using Hadoop and Spark.', time: '7-10 mos', difficulty: 'Advanced', demand: 'High', salary: '$145k' },
      { id: 'analytics_engineer', title: 'Analytics Engineer', desc: 'Bridge the gap between data engineering and analysis.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'High', salary: '$120k' },
    ]
  },
  {
    id: 'ui_ux',
    label: 'UI / UX',
    icon: Layout,
    careers: [
      { id: 'ui_designer', title: 'UI Designer', desc: 'Design beautiful, pixel-perfect user interfaces.', time: '3-6 mos', difficulty: 'Beginner+', demand: 'High', salary: '$90k' },
      { id: 'ux_designer', title: 'UX Designer', desc: 'Research and design seamless user experiences.', time: '4-7 mos', difficulty: 'Intermediate', demand: 'High', salary: '$100k' },
      { id: 'product_designer', title: 'Product Designer', desc: 'End-to-end design from research to final interface.', time: '5-8 mos', difficulty: 'Intermediate', demand: 'High', salary: '$115k' },
    ]
  },
  {
    id: 'other',
    label: 'Other',
    icon: Smartphone,
    careers: [
      { id: 'blockchain_dev', title: 'Blockchain Developer', desc: 'Build decentralized apps and smart contracts.', time: '6-10 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$140k' },
      { id: 'ar_vr_dev', title: 'AR/VR Developer', desc: 'Create immersive spatial and virtual realities.', time: '7-10 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$125k' },
      { id: 'iot_engineer', title: 'IoT Engineer', desc: 'Develop software for connected physical devices.', time: '6-9 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$115k' },
      { id: 'embedded', title: 'Embedded Systems', desc: 'Program microcontrollers and hardware systems.', time: '8-12 mos', difficulty: 'Advanced', demand: 'Medium', salary: '$110k' },
      { id: 'qa', title: 'QA Automation Engineer', desc: 'Write code to test and ensure software quality.', time: '4-7 mos', difficulty: 'Beginner+', demand: 'High', salary: '$95k' },
    ]
  }
]


// ─── Dynamic Mappings ────────────────────────────────────────────────

// Keywords matching logic
export const getResourcesForTopic = (topic, targetRole) => {
  const t = (topic || '').toLowerCase()
  const r = (targetRole || '').toLowerCase()

  const resources = []

  // Default / Fallback matching based on topic keyword
  if (t.includes('python')) {
    resources.push(
      { title: 'Python Docs', url: 'https://docs.python.org/3/', type: 'Documentation', desc: 'Official Python Reference', time: '∞', difficulty: 'All Levels', domain: 'docs.python.org', color: '#3776ab' },
      { title: 'Real Python', url: 'https://realpython.com/', type: 'Tutorial', desc: 'In-depth tutorials', time: 'Variable', difficulty: 'Intermediate', domain: 'realpython.com', color: '#3776ab' },
      { title: 'W3Schools', url: 'https://www.w3schools.com/python/', type: 'Tutorial', desc: 'Beginner-friendly examples', time: '10 hrs', difficulty: 'Beginner', domain: 'w3schools.com', color: '#04aa6d' },
      { title: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'Book', desc: 'Practical Python projects', time: '20 hrs', difficulty: 'Beginner', domain: 'automatetheboringstuff.com', color: '#e8602c' }
    )
  } else if (t.includes('react')) {
    resources.push(
      { title: 'React Docs', url: 'https://react.dev/', type: 'Documentation', desc: 'Official React Reference', time: '∞', difficulty: 'All Levels', domain: 'react.dev', color: '#61dafb' },
      { title: 'Scrimba', url: 'https://scrimba.com/learn/learnreact', type: 'Course', desc: 'Interactive React Course', time: '15 hrs', difficulty: 'Beginner', domain: 'scrimba.com', color: '#000000' },
      { title: 'Frontend Mentor', url: 'https://www.frontendmentor.io/', type: 'Tutorial', desc: 'Real-world projects', time: 'Variable', difficulty: 'Intermediate', domain: 'frontendmentor.io', color: '#ed2c49' }
    )
  } else if (t.includes('docker')) {
    resources.push(
      { title: 'Docker Docs', url: 'https://docs.docker.com/', type: 'Documentation', desc: 'Official Docker Reference', time: '∞', difficulty: 'All Levels', domain: 'docs.docker.com', color: '#2496ed' },
      { title: 'Play with Docker', url: 'https://labs.play-with-docker.com/', type: 'Tutorial', desc: 'Interactive Docker playground', time: 'Variable', difficulty: 'Beginner', domain: 'play-with-docker.com', color: '#2496ed' }
    )
  } else if (t.includes('machine learning') || t.includes('ml ') || t.includes('deep learning')) {
    resources.push(
      { title: 'TensorFlow Docs', url: 'https://www.tensorflow.org/learn', type: 'Documentation', desc: 'Official TF Tutorials', time: 'Variable', difficulty: 'Intermediate', domain: 'tensorflow.org', color: '#ff6f00' },
      { title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/', type: 'Documentation', desc: 'Official PyTorch Guide', time: 'Variable', difficulty: 'Intermediate', domain: 'pytorch.org', color: '#ee4c2c' },
      { title: 'Scikit-Learn', url: 'https://scikit-learn.org/', type: 'Documentation', desc: 'Machine Learning in Python', time: 'Variable', difficulty: 'All Levels', domain: 'scikit-learn.org', color: '#f59e0b' },
      { title: 'Kaggle', url: 'https://www.kaggle.com/learn', type: 'Course', desc: 'Micro-courses for Data Science', time: '10 hrs', difficulty: 'Beginner', domain: 'kaggle.com', color: '#20beff' },
      { title: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/', type: 'Course', desc: 'Advanced AI Specializations', time: '40 hrs', difficulty: 'Advanced', domain: 'deeplearning.ai', color: '#0056d2' }
    )
  } else if (t.includes('security') || t.includes('cyber')) {
    resources.push(
      { title: 'OWASP', url: 'https://owasp.org/', type: 'Documentation', desc: 'Web Application Security', time: '∞', difficulty: 'All Levels', domain: 'owasp.org', color: '#000000' },
      { title: 'PortSwigger', url: 'https://portswigger.net/web-security', type: 'Course', desc: 'Web Security Academy', time: 'Variable', difficulty: 'Intermediate', domain: 'portswigger.net', color: '#ff6633' },
      { title: 'HackTheBox', url: 'https://academy.hackthebox.com/', type: 'Course', desc: 'Interactive Cyber Security Training', time: 'Variable', difficulty: 'Intermediate', domain: 'hackthebox.com', color: '#9fef00' }
    )
  } else if (t.includes('linux')) {
    resources.push(
      { title: 'Linux Journey', url: 'https://linuxjourney.com/', type: 'Tutorial', desc: 'Learn Linux step by step', time: '10 hrs', difficulty: 'Beginner', domain: 'linuxjourney.com', color: '#f1c40f' },
      { title: 'OverTheWire', url: 'https://overthewire.org/wargames/', type: 'Tutorial', desc: 'Learn Linux through wargames', time: 'Variable', difficulty: 'Beginner+', domain: 'overthewire.org', color: '#000000' }
    )
  } else {
    // Generic fallback
    resources.push(
      { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/', type: 'Course', desc: 'Free self-paced curriculum', time: 'Variable', difficulty: 'All Levels', domain: 'freecodecamp.org', color: '#0a0a23' },
      { title: 'YouTube Search', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`, type: 'Video', desc: 'Find latest tutorials on YouTube', time: 'Variable', difficulty: 'All Levels', domain: 'youtube.com', color: '#ff0000' }
    )
  }

  return resources
}

export const getPracticePlatforms = (topic, targetRole) => {
  const t = (topic || '').toLowerCase()
  const r = (targetRole || '').toLowerCase()

  if (t.includes('security') || t.includes('cyber') || r.includes('security') || r.includes('cyber') || r.includes('soc') || r.includes('pen tester')) {
    return [
      { title: 'HackTheBox', url: 'https://www.hackthebox.com/', desc: 'Gamified cybersecurity training', difficulty: 'Intermediate', problems: '200+', color: '#9fef00', icon: '🛡️', domain: 'hackthebox.com' },
      { title: 'TryHackMe', url: 'https://tryhackme.com/', desc: 'Hands-on cyber security training', difficulty: 'Beginner+', problems: '500+', color: '#ff0000', icon: '🎯', domain: 'tryhackme.com' },
      { title: 'RootMe', url: 'https://www.root-me.org/', desc: 'Test and improve your hacking skills', difficulty: 'Intermediate', problems: '400+', color: '#333333', icon: '💀', domain: 'root-me.org' },
      { title: 'OverTheWire', url: 'https://overthewire.org/wargames/', desc: 'Learn security concepts via wargames', difficulty: 'Beginner', problems: '100+', color: '#000000', icon: '🎮', domain: 'overthewire.org' }
    ]
  }

  if (t.includes('front') || t.includes('react') || t.includes('html') || r.includes('frontend') || r.includes('ui')) {
    return [
      { title: 'Frontend Mentor', url: 'https://www.frontendmentor.io/', desc: 'Improve frontend skills by building real projects', difficulty: 'All Levels', problems: '150+', color: '#ed2c49', icon: '🎨', domain: 'frontendmentor.io' },
      { title: 'CodePen', url: 'https://codepen.io/', desc: 'Online code editor and frontend community', difficulty: 'All Levels', problems: '∞', color: '#000000', icon: '✒️', domain: 'codepen.io' },
      { title: 'JavaScript30', url: 'https://javascript30.com/', desc: 'Build 30 things with vanilla JS', difficulty: 'Beginner+', problems: '30', color: '#ffb400', icon: '⚡', domain: 'javascript30.com' }
    ]
  }

  if (t.includes('data') || t.includes('sql') || r.includes('data') || r.includes('analyst')) {
    return [
      { title: 'LeetCode SQL', url: 'https://leetcode.com/studyplan/sql-free-50/', desc: 'Top SQL interview questions', difficulty: 'All Levels', problems: '50+', color: '#ffa116', icon: '🗄️', domain: 'leetcode.com' },
      { title: 'HackerRank SQL', url: 'https://www.hackerrank.com/domains/sql', desc: 'SQL practice challenges', difficulty: 'Beginner+', problems: '100+', color: '#00ea64', icon: '💻', domain: 'hackerrank.com' },
      { title: 'StrataScratch', url: 'https://www.stratascratch.com/', desc: 'Real data science interview questions', difficulty: 'Intermediate', problems: '1000+', color: '#000000', icon: '📊', domain: 'stratascratch.com' }
    ]
  }

  // Default DSA / General Coding
  return [
    { title: 'LeetCode', url: 'https://leetcode.com/', desc: 'The gold standard for technical interviews', difficulty: 'All Levels', problems: '3000+', color: '#ffa116', icon: '⚡', domain: 'leetcode.com' },
    { title: 'Codeforces', url: 'https://codeforces.com/', desc: 'Premier competitive programming', difficulty: 'Intermediate+', problems: '10000+', color: '#1a82d6', icon: '🏆', domain: 'codeforces.com' },
    { title: 'HackerRank', url: 'https://www.hackerrank.com/', desc: 'Skills assessments and practice', difficulty: 'Beginner+', problems: '1500+', color: '#00ea64', icon: '💻', domain: 'hackerrank.com' },
    { title: 'NeetCode', url: 'https://neetcode.io/', desc: 'Curated blind 75 & 150 lists', difficulty: 'All Levels', problems: '150', color: '#06b6d4', icon: '🎯', domain: 'neetcode.io' },
    { title: "Striver's A2Z DSA", url: 'https://takeuforward.org/', desc: 'Complete structured DSA sheet', difficulty: 'All Levels', problems: '455', color: '#6366f1', icon: '📋', domain: 'takeuforward.org' }
  ]
}

export const getProjectTemplate = (targetRole, weekNum) => {
  const r = (targetRole || '').toLowerCase()
  const p = {
    title: `Project Milestone ${weekNum}`,
    description: 'Apply your weekly learnings to a practical project.',
    skills_used: ['Core Tech', 'Git'],
    difficulty: 'Intermediate',
    estimated_hours: 6
  }

  if (r.includes('ai') || r.includes('machine learning') || r.includes('data scientist')) {
    p.title = ['Data EDA', 'Predictive Model', 'Computer Vision Tool', 'NLP Chatbot', 'Recommendation Engine'][weekNum % 5]
    p.skills_used = ['Python', 'Pandas', 'Scikit-Learn', 'PyTorch']
    p.description = 'Build an intelligent system analyzing data or predicting outcomes using machine learning algorithms.'
  } else if (r.includes('front') || r.includes('ui')) {
    p.title = ['Responsive Portfolio', 'Weather App', 'Netflix Clone', 'E-commerce Dashboard', 'Task Manager'][weekNum % 5]
    p.skills_used = ['HTML', 'CSS', 'React', 'Tailwind']
    p.description = 'Create a responsive, accessible frontend application with API integration and state management.'
  } else if (r.includes('security') || r.includes('cyber')) {
    p.title = ['Password Manager', 'Port Scanner', 'Packet Analyzer', 'SOC Dashboard', 'Malware Sandbox'][weekNum % 5]
    p.skills_used = ['Python', 'Bash', 'Networking', 'Linux']
    p.description = 'Develop a security tool or environment to analyze vulnerabilities or protect data.'
  } else if (r.includes('cloud') || r.includes('devops')) {
    p.title = ['Automated CI/CD', 'Dockerized App', 'Terraform Infra', 'Serverless API', 'Monitoring Stack'][weekNum % 5]
    p.skills_used = ['Docker', 'AWS', 'GitHub Actions', 'Terraform']
    p.description = 'Provision cloud infrastructure as code and automate deployment pipelines.'
  } else if (r.includes('data engineer')) {
    p.title = ['ETL Pipeline', 'Data Warehouse', 'Streaming Service', 'Airflow DAG', 'Analytics Dashboard'][weekNum % 5]
    p.skills_used = ['Python', 'SQL', 'Spark', 'Airflow']
    p.description = 'Build robust pipelines to extract, transform, and load data into a data warehouse.'
  } else {
    // Backend/Fullstack Default
    p.title = ['REST API', 'Authentication Service', 'Real-time Chat', 'Blog Platform', 'Payment Integration'][weekNum % 5]
    p.skills_used = ['Node.js', 'Express', 'PostgreSQL', 'Docker']
    p.description = 'Build a scalable backend service with a database, authentication, and comprehensive API endpoints.'
  }

  return p
}

export const getCertificates = (targetRole) => {
  const r = (targetRole || '').toLowerCase()

  if (r.includes('ai') || r.includes('machine learning')) {
    return [
      { title: 'Google Machine Learning', url: 'https://www.coursera.org/professional-certificates/google-machine-learning', desc: 'Google ML Professional Certificate', badge: 'Paid', duration: '3-6 mos', color: '#4285f4', domain: 'coursera.org', cert: true },
      { title: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/', desc: 'Advanced Deep Learning Specialization', badge: 'Paid', duration: '4-5 mos', color: '#0056d2', domain: 'deeplearning.ai', cert: true },
      { title: 'IBM AI Engineering', url: 'https://www.coursera.org/professional-certificates/ai-engineer', desc: 'IBM AI Engineering Professional Certificate', badge: 'Paid', duration: '2-3 mos', color: '#0f62fe', domain: 'coursera.org', cert: true }
    ]
  }

  if (r.includes('cloud') || r.includes('devops')) {
    return [
      { title: 'AWS Solutions Architect', url: 'https://aws.amazon.com/certification/', desc: 'AWS Certified Solutions Architect', badge: 'Paid', duration: '1-3 mos', color: '#ff9900', domain: 'aws.amazon.com', cert: true },
      { title: 'Microsoft Azure Fundamentals', url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', desc: 'Azure AZ-900 Certification', badge: 'Paid', duration: '1-2 mos', color: '#0078d4', domain: 'learn.microsoft.com', cert: true },
      { title: 'Google Cloud Engineer', url: 'https://cloud.google.com/learn/certification/cloud-engineer', desc: 'Associate Cloud Engineer Certification', badge: 'Paid', duration: '2-3 mos', color: '#4285f4', domain: 'cloud.google.com', cert: true }
    ]
  }

  if (r.includes('security') || r.includes('cyber')) {
    return [
      { title: 'Google Cybersecurity', url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', desc: 'Google Cybersecurity Professional Certificate', badge: 'Paid', duration: '6 mos', color: '#4285f4', domain: 'coursera.org', cert: true },
      { title: 'CompTIA Security+', url: 'https://www.comptia.org/certifications/security', desc: 'Industry standard foundational security cert', badge: 'Paid', duration: '3 mos', color: '#e3000f', domain: 'comptia.org', cert: true },
      { title: 'ISC2 Certified in Cybersecurity', url: 'https://www.isc2.org/Certifications/CC', desc: 'Foundational entry-level security certification', badge: 'Free', duration: 'Self-paced', color: '#003366', domain: 'isc2.org', cert: true }
    ]
  }

  // Default / Web Dev
  return [
    { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/', desc: '14 verified certification tracks, completely free.', badge: 'Free', duration: 'Self-paced', color: '#0a0a23', domain: 'freecodecamp.org', cert: true },
    { title: 'Meta Front-End Developer', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', desc: 'Meta Professional Certificate', badge: 'Paid', duration: '7 mos', color: '#0668E1', domain: 'coursera.org', cert: true },
    { title: 'IBM Full Stack', url: 'https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer', desc: 'IBM Full Stack Software Developer', badge: 'Paid', duration: '14 mos', color: '#0f62fe', domain: 'coursera.org', cert: true }
  ]
}
