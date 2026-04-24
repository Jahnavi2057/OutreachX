export const KEYWORD_GROUPS = {
  educationSystems: [
    "school software", "school management system", "college management system", "campus management", "education platform", "learning platform", "LMS", "learning management system", "digital classroom", "online education system"
  ],
  aiInEducation: [
    "AI tutor", "AI teaching assistant", "AI in education", "smart learning system", "adaptive learning", "personalized learning", "intelligent tutoring system", "AI classroom", "AI for students", "AI education tools"
  ],
  studentAnalytics: [
    "student performance tracking", "student analytics", "academic analytics", "learning analytics", "student progress tracking", "performance dashboard students", "predictive student performance", "student insights", "education analytics", "student data analysis"
  ],
  examsAndGrading: [
    "grading system", "exam automation", "automatic grading", "AI grading", "exam evaluation software", "answer sheet correction", "online exam system", "digital exams", "exam management system", "grading automation"
  ],
  highIntentKeywords: [
    "need school software", "looking for LMS", "help with grading system", "better way to manage students", "automate exam evaluation", "reduce teacher workload", "manage student data", "improve student performance", "school system recommendation", "education software suggestions"
  ],
  generalSaaS: [
    "software recommendation", "best tools for school", "system for managing students", "automation tools for education", "SaaS for schools", "digital transformation school", "workflow automation education", "productivity tools education", "cloud-based school software", "management tools"
  ],
  teachersAdmin: [
    "teacher tools", "admin dashboard school", "principal software", "school admin tools", "classroom management system", "teacher productivity tools", "faculty management", "academic management", "attendance system", "timetable software"
  ],
  collegeUniversity: [
    "university management system", "college ERP", "campus software", "student portal", "academic portal", "university analytics", "campus automation", "higher education software", "college tools", "university LMS"
  ],
  edTech: [
    "edtech platform", "online learning tools", "remote education tools", "hybrid learning system", "digital education", "virtual classroom", "student engagement tools", "learning apps", "edtech solutions", "education technology tools"
  ]
};

export const INTENT_WORDS = [
  "looking for", "need help", "any suggestions", "recommend", "struggling with", "facing issues", "problem with", "how to improve", "better way to", "alternative to"
];

export const ALL_KEYWORDS = Object.values(KEYWORD_GROUPS).flat();
