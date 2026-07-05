/**
 * Mock data for Career Guide AI frontend.
 * Matches backend Pydantic schemas so the UI works without a live API.
 */

export const mockCareerAnalysis = {
  market_insights: {
    demand_level: "High",
    avg_salary: "₹12,00,000 - ₹25,00,000",
    growth_rate: "22% YoY",
    top_companies: ["Google", "Microsoft", "Amazon", "Flipkart", "Razorpay"],
    industry_trends: [
      "AI/ML integration in every product team",
      "Growing demand for full-stack engineers",
      "Remote-first culture becoming standard",
      "DevOps and cloud skills highly valued",
    ],
    job_openings: 15400,
    competition_level: "Moderate",
  },
  skill_gaps: [
    "System Design",
    "Cloud Architecture (AWS/GCP)",
    "Machine Learning Fundamentals",
    "CI/CD Pipelines",
    "GraphQL",
    "Kubernetes",
    "Data Structures & Algorithms (Advanced)",
  ],
  recommendations: [
    "Complete a system design course — try 'Grokking the System Design Interview' on Educative",
    "Build 2–3 full-stack projects with cloud deployment to strengthen your portfolio",
    "Contribute to open-source projects in your target domain",
    "Get AWS Solutions Architect Associate certification",
    "Practice 150+ LeetCode problems focusing on medium-hard difficulty",
    "Start a tech blog to build personal brand and deepen understanding",
  ],
  score: 72,
}

export const mockRoadmap = {
  milestones: [
    {
      month: 1,
      title: "Foundation Strengthening",
      description: "Solidify core DSA concepts and start system design basics",
      tasks: [
        "Complete 50 LeetCode problems (Arrays, Strings, Trees)",
        "Read 'Designing Data-Intensive Applications' Ch. 1–4",
        "Set up a personal portfolio website",
      ],
      status: "current",
    },
    {
      month: 2,
      title: "System Design Deep-Dive",
      description: "Master distributed systems concepts and design patterns",
      tasks: [
        "Complete system design course on Educative",
        "Design 5 real-world systems (URL shortener, chat app, etc.)",
        "Learn about caching, load balancing, and database sharding",
      ],
      status: "upcoming",
    },
    {
      month: 3,
      title: "Cloud & DevOps",
      description: "Get hands-on with AWS services and CI/CD pipelines",
      tasks: [
        "Complete AWS Solutions Architect course",
        "Deploy 2 projects on AWS using EC2, S3, and RDS",
        "Set up GitHub Actions CI/CD for your projects",
      ],
      status: "upcoming",
    },
    {
      month: 4,
      title: "Full-Stack Project Sprint",
      description: "Build a production-quality full-stack application",
      tasks: [
        "Design and build a SaaS application end-to-end",
        "Implement authentication, payment, and real-time features",
        "Write comprehensive tests and documentation",
      ],
      status: "upcoming",
    },
    {
      month: 5,
      title: "Open Source & Networking",
      description: "Build visibility through open-source contributions and community",
      tasks: [
        "Contribute to 2+ popular open-source projects",
        "Write 4 technical blog posts",
        "Attend 2 tech meetups or conferences",
      ],
      status: "upcoming",
    },
    {
      month: 6,
      title: "Interview Preparation",
      description: "Intensive preparation for target company interviews",
      tasks: [
        "Complete 100 more LeetCode problems (medium-hard)",
        "Do 10 mock system design interviews",
        "Prepare behavioral interview stories using STAR method",
        "Apply to 20+ target companies",
      ],
      status: "upcoming",
    },
  ],
  resources: [
    {
      title: "Grokking the System Design Interview",
      type: "Course",
      url: "https://www.educative.io/courses/grokking-the-system-design-interview",
      priority: "High",
    },
    {
      title: "Designing Data-Intensive Applications",
      type: "Book",
      url: "https://dataintensive.net/",
      priority: "High",
    },
    {
      title: "AWS Solutions Architect — Associate",
      type: "Certification",
      url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
      priority: "Medium",
    },
    {
      title: "NeetCode — DSA Roadmap",
      type: "Practice",
      url: "https://neetcode.io/",
      priority: "High",
    },
    {
      title: "The Pragmatic Programmer",
      type: "Book",
      url: "https://pragprog.com/titles/tpp20/",
      priority: "Medium",
    },
  ],
  estimated_timeline: "6 months",
}

export const mockJobs = {
  results: [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Google",
      location: "Bangalore, India",
      salary: "₹35,00,000 - ₹55,00,000",
      type: "Full-time",
      remote: true,
      match_score: 85,
      skills: ["React", "Node.js", "System Design", "GCP"],
      posted_at: "2026-07-01",
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "Razorpay",
      location: "Bangalore, India",
      salary: "₹20,00,000 - ₹35,00,000",
      type: "Full-time",
      remote: false,
      match_score: 78,
      skills: ["React", "Go", "PostgreSQL", "Redis"],
      posted_at: "2026-06-28",
    },
    {
      id: 3,
      title: "Software Engineer III",
      company: "Microsoft",
      location: "Hyderabad, India",
      salary: "₹30,00,000 - ₹50,00,000",
      type: "Full-time",
      remote: true,
      match_score: 82,
      skills: ["C#", ".NET", "Azure", "System Design"],
      posted_at: "2026-06-30",
    },
    {
      id: 4,
      title: "Backend Engineer",
      company: "Flipkart",
      location: "Bangalore, India",
      salary: "₹22,00,000 - ₹38,00,000",
      type: "Full-time",
      remote: false,
      match_score: 74,
      skills: ["Java", "Spring Boot", "Kafka", "MySQL"],
      posted_at: "2026-07-02",
    },
  ],
}

export const mockResume = {
  overall_score: 68,
  sections: [
    {
      name: "Contact Information",
      score: 90,
      feedback: "Well-formatted with all essential details present.",
      suggestions: ["Add your LinkedIn profile URL", "Consider adding your GitHub profile"],
    },
    {
      name: "Professional Summary",
      score: 55,
      feedback: "Summary is too generic and doesn't highlight unique strengths.",
      suggestions: [
        "Quantify your achievements (e.g., 'Improved API response time by 40%')",
        "Mention specific technologies and domain expertise",
        "Keep it to 2–3 impactful sentences",
      ],
    },
    {
      name: "Work Experience",
      score: 70,
      feedback: "Good structure, but lacks measurable impact.",
      suggestions: [
        "Use the STAR method for each bullet point",
        "Add metrics: revenue impact, performance improvements, team size",
        "Focus on achievements over responsibilities",
      ],
    },
    {
      name: "Technical Skills",
      score: 80,
      feedback: "Comprehensive skills listed, well-categorized.",
      suggestions: [
        "Remove outdated technologies (jQuery, SVN)",
        "Add proficiency levels for key technologies",
        "Group skills by category: Languages, Frameworks, Tools",
      ],
    },
    {
      name: "Education",
      score: 85,
      feedback: "Well-presented with relevant coursework.",
      suggestions: ["Add GPA if above 3.5", "Highlight relevant projects or thesis work"],
    },
    {
      name: "Projects",
      score: 50,
      feedback: "Projects section needs significant improvement.",
      suggestions: [
        "Add 2–3 more substantial projects",
        "Include live demo links and GitHub repositories",
        "Describe your tech stack and role clearly",
        "Highlight the problem solved and the impact",
      ],
    },
  ],
  top_improvements: [
    "Add quantifiable achievements throughout — numbers speak louder than words",
    "Restructure the professional summary to be role-specific",
    "Strengthen the projects section with production-level work",
    "Optimize for ATS by matching keywords from target job descriptions",
  ],
}

export const mockMentor = {
  name: "AI Career Mentor",
  specialty: "Software Engineering & Career Growth",
  avatar_emoji: "🧠",
  greeting:
    "Hi there! I'm your AI Career Mentor. I've analyzed your profile and I'm here to help you navigate your career transition. Based on your background, I see tremendous potential. Let's work together to bridge the gaps and get you to your dream role.",
  advice: [
    {
      topic: "Career Strategy",
      message:
        "Your transition from your current role to your target position is very achievable. The key is to focus on building depth in system design and cloud architecture — these are the highest-leverage skills for senior roles. I recommend dedicating 60% of your study time to these areas.",
    },
    {
      topic: "Interview Preparation",
      message:
        "Start mock interviews early — at least 8 weeks before your target date. Focus on behavioral questions first (they're often overlooked but carry equal weight at top companies). Use the STAR format religiously.",
    },
    {
      topic: "Networking",
      message:
        "Your technical skills will get you interviews, but networking will get you referrals. Connect with 5 people per week on LinkedIn who work at your target companies. Engage genuinely with their content before reaching out.",
    },
    {
      topic: "Portfolio",
      message:
        "Build 1 standout project that solves a real problem. A well-documented, deployed SaaS project is worth more than 10 toy projects. Make sure it demonstrates system design thinking, clean architecture, and production practices.",
    },
  ],
}
