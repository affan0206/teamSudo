// src/data/syntheticCohort.ts
var DEFAULT_RISK_THRESHOLDS = {
  criticalAttendancePct: 75,
  warningAttendancePct: 85,
  passingScorePct: 50,
  borderlineScorePct: 60,
  criticalRecentAssessmentPct: 40,
  severeDropPoints: 15,
  moderateDropPoints: 8
};
var SYNTHETIC_SUBJECTS = [
  {
    id: "sub-cs401",
    code: "CS401",
    name: "Data Structures & Algorithms",
    semester: 4,
    credits: 4,
    instructor: "Dr. Aris Thorne",
    passPercentage: 50,
    minAttendancePercentage: 75
  },
  {
    id: "sub-cs402",
    code: "CS402",
    name: "Database Management Systems",
    semester: 4,
    credits: 4,
    instructor: "Prof. Meera Krishnan",
    passPercentage: 50,
    minAttendancePercentage: 75
  },
  {
    id: "sub-cs403",
    code: "CS403",
    name: "Operating Systems",
    semester: 4,
    credits: 4,
    instructor: "Dr. Julian Vance",
    passPercentage: 50,
    minAttendancePercentage: 75
  },
  {
    id: "sub-ma401",
    code: "MA401",
    name: "Linear Algebra & Probability",
    semester: 4,
    credits: 3,
    instructor: "Dr. Elena Rostova",
    passPercentage: 50,
    minAttendancePercentage: 75
  },
  {
    id: "sub-cs404",
    code: "CS404",
    name: "Computer Networks",
    semester: 4,
    credits: 3,
    instructor: "Prof. Vikram Sen",
    passPercentage: 50,
    minAttendancePercentage: 75
  }
];
var SYNTHETIC_ASSESSMENTS = [
  // CS401
  {
    id: "asmt-cs401-1",
    subjectId: "sub-cs401",
    title: "Quiz 1: Complexity & Trees",
    category: "QUIZ",
    maxMarks: 20,
    weightage: 20,
    sequenceOrder: 1,
    assessmentDate: "2026-08-14"
  },
  {
    id: "asmt-cs401-2",
    subjectId: "sub-cs401",
    title: "Midterm Examination",
    category: "MIDTERM",
    maxMarks: 50,
    weightage: 40,
    sequenceOrder: 2,
    assessmentDate: "2026-09-12"
  },
  {
    id: "asmt-cs401-3",
    subjectId: "sub-cs401",
    title: "Assessment 2: Graphs & DP",
    category: "LAB_ASSESSMENT",
    maxMarks: 30,
    weightage: 40,
    sequenceOrder: 3,
    assessmentDate: "2026-10-02"
  },
  // CS402
  {
    id: "asmt-cs402-1",
    subjectId: "sub-cs402",
    title: "Quiz 1: Relational Models",
    category: "QUIZ",
    maxMarks: 20,
    weightage: 20,
    sequenceOrder: 1,
    assessmentDate: "2026-08-16"
  },
  {
    id: "asmt-cs402-2",
    subjectId: "sub-cs402",
    title: "Midterm Examination",
    category: "MIDTERM",
    maxMarks: 50,
    weightage: 40,
    sequenceOrder: 2,
    assessmentDate: "2026-09-14"
  },
  {
    id: "asmt-cs402-3",
    subjectId: "sub-cs402",
    title: "Assessment 2: SQL & Indexing",
    category: "LAB_ASSESSMENT",
    maxMarks: 30,
    weightage: 40,
    sequenceOrder: 3,
    assessmentDate: "2026-10-04"
  },
  // CS403
  {
    id: "asmt-cs403-1",
    subjectId: "sub-cs403",
    title: "Quiz 1: Process Scheduling",
    category: "QUIZ",
    maxMarks: 20,
    weightage: 20,
    sequenceOrder: 1,
    assessmentDate: "2026-08-18"
  },
  {
    id: "asmt-cs403-2",
    subjectId: "sub-cs403",
    title: "Midterm Examination",
    category: "MIDTERM",
    maxMarks: 50,
    weightage: 40,
    sequenceOrder: 2,
    assessmentDate: "2026-09-16"
  },
  {
    id: "asmt-cs403-3",
    subjectId: "sub-cs403",
    title: "Assessment 2: Concurrency & Virtual Memory",
    category: "LAB_ASSESSMENT",
    maxMarks: 30,
    weightage: 40,
    sequenceOrder: 3,
    assessmentDate: "2026-10-05"
  },
  // MA401
  {
    id: "asmt-ma401-1",
    subjectId: "sub-ma401",
    title: "Quiz 1: Vector Spaces",
    category: "QUIZ",
    maxMarks: 20,
    weightage: 20,
    sequenceOrder: 1,
    assessmentDate: "2026-08-20"
  },
  {
    id: "asmt-ma401-2",
    subjectId: "sub-ma401",
    title: "Midterm Examination",
    category: "MIDTERM",
    maxMarks: 50,
    weightage: 40,
    sequenceOrder: 2,
    assessmentDate: "2026-09-18"
  },
  {
    id: "asmt-ma401-3",
    subjectId: "sub-ma401",
    title: "Assessment 2: Eigenvalues & Distributions",
    category: "LAB_ASSESSMENT",
    maxMarks: 30,
    weightage: 40,
    sequenceOrder: 3,
    assessmentDate: "2026-10-06"
  },
  // CS404
  {
    id: "asmt-cs404-1",
    subjectId: "sub-cs404",
    title: "Quiz 1: OSI & Framing",
    category: "QUIZ",
    maxMarks: 20,
    weightage: 20,
    sequenceOrder: 1,
    assessmentDate: "2026-08-22"
  },
  {
    id: "asmt-cs404-2",
    subjectId: "sub-cs404",
    title: "Midterm Examination",
    category: "MIDTERM",
    maxMarks: 50,
    weightage: 40,
    sequenceOrder: 2,
    assessmentDate: "2026-09-20"
  },
  {
    id: "asmt-cs404-3",
    subjectId: "sub-cs404",
    title: "Assessment 2: Routing & Transport Layer",
    category: "LAB_ASSESSMENT",
    maxMarks: 30,
    weightage: 40,
    sequenceOrder: 3,
    assessmentDate: "2026-10-07"
  }
];
var SYNTHETIC_STUDENTS = [
  {
    id: "stu-001",
    rollNumber: "CS2024-001",
    fullName: "Aarav Mehta",
    email: "aarav.mehta@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Aris Thorne",
    enrollmentNote: "Regular enrollment"
  },
  {
    id: "stu-002",
    rollNumber: "CS2024-002",
    fullName: "Riya Nair",
    email: "riya.nair@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Aris Thorne",
    enrollmentNote: "Sharp decline after Midterm period"
  },
  {
    id: "stu-003",
    rollNumber: "CS2024-003",
    fullName: "Kabir Verma",
    email: "kabir.verma@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Prof. Meera Krishnan",
    enrollmentNote: "Multi-subject foundational support needed"
  },
  {
    id: "stu-004",
    rollNumber: "CS2024-004",
    fullName: "Zoya Khan",
    email: "zoya.khan@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Julian Vance",
    enrollmentNote: "Recent critical drop in Assessment 2; 1 pending lab record"
  },
  {
    id: "stu-005",
    rollNumber: "CS2024-005",
    fullName: "Devansh Patel",
    email: "devansh.patel@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Elena Rostova",
    enrollmentNote: "Chronic attendance shortage despite moderate exam scores"
  },
  {
    id: "stu-006",
    rollNumber: "CS2024-006",
    fullName: "Ananya Iyer",
    email: "ananya.iyer@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Aris Thorne",
    enrollmentNote: "Struggling in Mathematics and Operating Systems"
  },
  {
    id: "stu-007",
    rollNumber: "CS2024-007",
    fullName: "Rohan Deshmukh",
    email: "rohan.deshmukh@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Prof. Meera Krishnan",
    enrollmentNote: "Borderline attendance in CS401"
  },
  {
    id: "stu-008",
    rollNumber: "CS2024-008",
    fullName: "Sana Sheikh",
    email: "sana.sheikh@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Elena Rostova",
    enrollmentNote: "Strong in coding subjects; isolated difficulty in Linear Algebra"
  },
  {
    id: "stu-009",
    rollNumber: "CS2024-009",
    fullName: "Vikramaditya Rao",
    email: "vikram.rao@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Julian Vance",
    enrollmentNote: "Moderate downward trend in recent lab assessments"
  },
  {
    id: "stu-010",
    rollNumber: "CS2024-010",
    fullName: "Meera Nambiar",
    email: "meera.nambiar@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Prof. Vikram Sen",
    enrollmentNote: "Hovering just above passing threshold in 3 subjects"
  },
  {
    id: "stu-011",
    rollNumber: "CS2024-011",
    fullName: "Arjun Malhotra",
    email: "arjun.malhotra@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Prof. Vikram Sen",
    enrollmentNote: "Attendance buffer narrowing across afternoon lectures"
  },
  {
    id: "stu-012",
    rollNumber: "CS2024-012",
    fullName: "Tanvi Joshi",
    email: "tanvi.joshi@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Julian Vance",
    enrollmentNote: "Below passing in CS403; awaiting makeup lab mark in CS404"
  },
  {
    id: "stu-013",
    rollNumber: "CS2024-013",
    fullName: "Siddharth Kulkarni",
    email: "siddharth.k@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Aris Thorne",
    enrollmentNote: "Mid-semester lateral transfer \u2014 awaiting credit transfer & makeup assessments"
  },
  {
    id: "stu-014",
    rollNumber: "CS2024-014",
    fullName: "Neha Chatterjee",
    email: "neha.chatterjee@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Prof. Meera Krishnan",
    enrollmentNote: "Approved medical deferment for Midterm & Assessment 2 in 4 subjects"
  },
  {
    id: "stu-015",
    rollNumber: "CS2024-015",
    fullName: "Priya Sundaram",
    email: "priya.sundaram@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Aris Thorne",
    enrollmentNote: "Consistent honours standing"
  },
  {
    id: "stu-016",
    rollNumber: "CS2024-016",
    fullName: "Aditya Sengupta",
    email: "aditya.sengupta@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Prof. Meera Krishnan",
    enrollmentNote: "Steady academic performance"
  },
  {
    id: "stu-017",
    rollNumber: "CS2024-017",
    fullName: "Kavya Reddy",
    email: "kavya.reddy@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Dr. Julian Vance",
    enrollmentNote: "Rebounded strongly after September mentoring intervention"
  },
  {
    id: "stu-018",
    rollNumber: "CS2024-018",
    fullName: "Harshvardhan Gill",
    email: "harsh.gill@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Dr. Elena Rostova",
    enrollmentNote: "Good standing across all modules"
  },
  {
    id: "stu-019",
    rollNumber: "CS2024-019",
    fullName: "Ishita Banerjee",
    email: "ishita.banerjee@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "A",
    advisorName: "Prof. Vikram Sen",
    enrollmentNote: "Department rank holder"
  },
  {
    id: "stu-020",
    rollNumber: "CS2024-020",
    fullName: "Pranav Deshpande",
    email: "pranav.deshpande@demo.university.edu",
    department: "Computer Science & Engineering",
    semester: 4,
    section: "B",
    advisorName: "Prof. Vikram Sen",
    enrollmentNote: "Consistent attendance and passing marks"
  }
];
var RAW_PROFILES = [
  // 1. Aarav Mehta (HIGH RISK: Low attendance 63.9% + failing CS403 & CS401)
  {
    studentId: "stu-001",
    attendance: [
      [15, 25],
      // 60%
      [17, 25],
      // 68%
      [14, 24],
      // 58.3%
      [16, 24],
      // 66.7%
      [16, 24]
      // 66.7%
    ],
    scores: [
      [12, 23, 13],
      // CS401: 60%, 46%, 43.3% -> 47.7%
      [13, 28, 17],
      // CS402: 65%, 56%, 56.7% -> 58.1%
      [11, 21, 11],
      // CS403: 55%, 42%, 36.7% -> 42.5%
      [13, 27, 16],
      // MA401: 65%, 54%, 53.3% -> 55.9%
      [14, 29, 18]
      // CS404: 70%, 58%, 60% -> 61.2%
    ]
  },
  // 2. Riya Nair (HIGH RISK: Severe trajectory drop! Started ~85%, dropped to ~43% in CS401 & MA401)
  {
    studentId: "stu-002",
    attendance: [
      [21, 25],
      // 84%
      [21, 25],
      // 84%
      [20, 24],
      // 83.3%
      [19, 24],
      // 79.2%
      [20, 24]
      // 83.3%
    ],
    scores: [
      [17, 33, 13],
      // CS401: 85% -> 66% -> 43.3% (Drop of -22.7 pts!)
      [16, 35, 19],
      // CS402: 80% -> 70% -> 63.3%
      [16, 32, 14],
      // CS403: 80% -> 64% -> 46.7% (Drop of -17.3 pts!)
      [17, 31, 12],
      // MA401: 85% -> 62% -> 40.0% (Drop of -22.0 pts!)
      [15, 34, 20]
      // CS404: 75% -> 68% -> 66.7%
    ]
  },
  // 3. Kabir Verma (HIGH RISK: Failing 3 subjects CS401, CS402, MA401 + 69.7% attendance)
  {
    studentId: "stu-003",
    attendance: [
      [17, 25],
      // 68%
      [17, 25],
      // 68%
      [17, 24],
      // 70.8%
      [16, 24],
      // 66.7%
      [18, 24]
      // 75%
    ],
    scores: [
      [9, 21, 13],
      // CS401: 45%, 42%, 43.3% -> 43.1%
      [10, 22, 13],
      // CS402: 50%, 44%, 43.3% -> 44.9%
      [12, 26, 16],
      // CS403: 60%, 52%, 53.3% -> 54.1%
      [9, 21, 14],
      // MA401: 45%, 42%, 46.7% -> 44.5%
      [13, 28, 17]
      // CS404: 65%, 56%, 56.7% -> 58.1%
    ]
  },
  // 4. Zoya Khan (HIGH RISK: Critical recent failure 30% in CS402 Assessment 2 + 1 missing mark in CS404)
  {
    studentId: "stu-004",
    attendance: [
      [20, 25],
      // 80%
      [18, 25],
      // 72%
      [19, 24],
      // 79.2%
      [20, 24],
      // 83.3%
      [19, 24]
      // 79.2%
    ],
    scores: [
      [14, 31, 18],
      // CS401: 70%, 62%, 60%
      [14, 27, 9],
      // CS402: 70%, 54%, 30% (Critical failure < 40% & -24 pts drop)
      [13, 28, 17],
      // CS403: 65%, 56%, 56.7%
      [15, 32, 19],
      // MA401: 75%, 64%, 63.3%
      [14, 30, null]
      // CS404: Assessment 2 missing (null)
    ]
  },
  // 5. Devansh Patel (HIGH RISK: Chronic attendance shortage 66.4% overall despite 67% marks)
  {
    studentId: "stu-005",
    attendance: [
      [16, 25],
      // 64%
      [17, 25],
      // 68%
      [15, 24],
      // 62.5%
      [16, 24],
      // 66.7%
      [17, 24]
      // 70.8%
    ],
    scores: [
      [14, 34, 20],
      // CS401: 68%
      [13, 33, 21],
      // CS402: 67.4%
      [14, 32, 19],
      // CS403: 64.9%
      [13, 34, 20],
      // MA401: 66.9%
      [15, 35, 21]
      // CS404: 71.0%
    ]
  },
  // 6. Ananya Iyer (HIGH RISK: Attendance < 75% in 2 subjects + failing MA401 & CS403)
  {
    studentId: "stu-006",
    attendance: [
      [20, 25],
      // 80%
      [20, 25],
      // 80%
      [16, 24],
      // 66.7%
      [17, 24],
      // 70.8%
      [19, 24]
      // 79.2%
    ],
    scores: [
      [14, 31, 19],
      // CS401: 64.1%
      [15, 33, 20],
      // CS402: 68.1%
      [10, 23, 13],
      // CS403: 50%, 46%, 43.3% -> 45.7%
      [9, 22, 13],
      // MA401: 45%, 44%, 43.3% -> 43.9%
      [14, 30, 18]
      // CS404: 62.0%
    ]
  },
  // 7. Rohan Deshmukh (MEDIUM RISK: Single-subject attendance <75% in CS401 (72%) & overall 78.7%)
  {
    studentId: "stu-007",
    attendance: [
      [18, 25],
      // 72.0% (Below 75% in 1 subject)
      [20, 25],
      // 80.0%
      [19, 24],
      // 79.2%
      [19, 24],
      // 79.2%
      [20, 24]
      // 83.3%
    ],
    scores: [
      [14, 35, 21],
      // 70%
      [15, 36, 22],
      // 73.1%
      [14, 34, 20],
      // 67.9%
      [15, 35, 21],
      // 71.0%
      [16, 37, 22]
      // 74.9%
    ]
  },
  // 8. Sana Sheikh (MEDIUM RISK: Single-subject failure in MA401 (45.3%) while strong 76%+ in all others)
  {
    studentId: "stu-008",
    attendance: [
      [22, 25],
      // 88%
      [23, 25],
      // 92%
      [21, 24],
      // 87.5%
      [20, 24],
      // 83.3%
      [22, 24]
      // 91.7%
    ],
    scores: [
      [16, 39, 24],
      // CS401: 79.2%
      [17, 41, 25],
      // CS402: 83.1%
      [15, 37, 22],
      // CS403: 73.9%
      [10, 23, 13],
      // MA401: 50%, 46%, 43.3% -> 45.7% (Single subject failing)
      [16, 38, 23]
      // CS404: 77.1%
    ]
  },
  // 9. Vikramaditya Rao (MEDIUM RISK: Moderate score drop -11.3 pts in CS402 & CS403)
  {
    studentId: "stu-009",
    attendance: [
      [21, 25],
      // 84%
      [20, 25],
      // 80%
      [20, 24],
      // 83.3%
      [19, 24],
      // 79.2%
      [20, 24]
      // 83.3%
    ],
    scores: [
      [15, 36, 21],
      // CS401: 75%, 72%, 70%
      [16, 37, 19],
      // CS402: 80%, 74%, 63.3% (-10.7 pts drop)
      [16, 36, 18],
      // CS403: 80%, 72%, 60.0% (-12.0 pts drop)
      [14, 34, 20],
      // MA401: 70%, 68%, 66.7%
      [15, 35, 21]
      // CS404: 75%, 70%, 70%
    ]
  },
  // 10. Meera Nambiar (MEDIUM RISK: Borderline scores 52-56% across 3 subjects + 79.5% attendance)
  {
    studentId: "stu-010",
    attendance: [
      [20, 25],
      // 80%
      [20, 25],
      // 80%
      [19, 24],
      // 79.2%
      [19, 24],
      // 79.2%
      [19, 24]
      // 79.2%
    ],
    scores: [
      [11, 27, 16],
      // CS401: 55%, 54%, 53.3% -> 53.9%
      [13, 32, 19],
      // CS402: 65%, 64%, 63.3% -> 63.9%
      [11, 26, 16],
      // CS403: 55%, 52%, 53.3% -> 53.1%
      [13, 31, 19],
      // MA401: 65%, 62%, 63.3% -> 63.1%
      [11, 28, 16]
      // CS404: 55%, 56%, 53.3% -> 54.7%
    ]
  },
  // 11. Arjun Malhotra (MEDIUM RISK: Overall attendance 76.2% in warning zone + moderate drop in CS404)
  {
    studentId: "stu-011",
    attendance: [
      [19, 25],
      // 76%
      [19, 25],
      // 76%
      [19, 24],
      // 79.2%
      [18, 24],
      // 75%
      [18, 24]
      // 75%
    ],
    scores: [
      [14, 34, 20],
      // CS401: 67.9%
      [15, 35, 21],
      // CS402: 71.0%
      [13, 32, 19],
      // CS403: 63.9%
      [14, 33, 20],
      // MA401: 67.1%
      [16, 34, 17]
      // CS404: 80%, 68%, 56.7% (-11.3 pts drop)
    ]
  },
  // 12. Tanvi Joshi (MEDIUM RISK: Single-subject failing CS403 (47.7%) + 1 missing assessment in CS404)
  {
    studentId: "stu-012",
    attendance: [
      [22, 25],
      // 88%
      [21, 25],
      // 84%
      [20, 24],
      // 83.3%
      [21, 24],
      // 87.5%
      [20, 24]
      // 83.3%
    ],
    scores: [
      [14, 34, 21],
      // CS401: 69.2%
      [15, 36, 21],
      // CS402: 71.8%
      [10, 24, 14],
      // CS403: 50%, 48%, 46.7% -> 47.9% (Failing 1 subject)
      [14, 33, 20],
      // MA401: 67.1%
      [15, 34, null]
      // CS404: Missing Assessment 2
    ]
  },
  // 13. Siddharth Kulkarni (INSUFFICIENT DATA: Lateral transfer; missing Midterm & Assessment 2 in 4 subjects)
  {
    studentId: "stu-013",
    attendance: [
      [9, 10],
      // Joined late: 90% of held classes
      [9, 10],
      [8, 9],
      [8, 9],
      [9, 10]
    ],
    scores: [
      [15, null, null],
      // CS401: Only Quiz 1 recorded (75%)
      [14, null, null],
      // CS402: Only Quiz 1 recorded (70%)
      [null, null, null],
      // CS403: No assessments graded yet
      [null, null, null],
      // MA401: No assessments graded yet
      [15, null, null]
      // CS404: Only Quiz 1 recorded (75%)
    ]
  },
  // 14. Neha Chatterjee (INSUFFICIENT DATA: Medical deferment; Midterm & Assessment 2 unrecorded in 4 subjects)
  {
    studentId: "stu-014",
    attendance: [
      [14, 16],
      // Excused medical leave window
      [14, 16],
      [13, 15],
      [14, 16],
      [13, 15]
    ],
    scores: [
      [16, 38, null],
      // CS401: 80%, 76%, missing A2
      [15, null, null],
      // CS402: 75%, missing Midterm & A2
      [16, null, null],
      // CS403: 80%, missing Midterm & A2
      [15, null, null],
      // MA401: 75%, missing Midterm & A2
      [16, null, null]
      // CS404: 80%, missing Midterm & A2
    ]
  },
  // 15. Priya Sundaram (LOW RISK: High performer)
  {
    studentId: "stu-015",
    attendance: [
      [24, 25],
      // 96%
      [24, 25],
      // 96%
      [22, 24],
      // 91.7%
      [23, 24],
      // 95.8%
      [22, 24]
      // 91.7%
    ],
    scores: [
      [18, 44, 27],
      // 89.2%
      [19, 45, 27],
      // 91.0%
      [17, 42, 26],
      // 85.3%
      [18, 43, 26],
      // 87.1%
      [18, 44, 27]
      // 89.2%
    ]
  },
  // 16. Aditya Sengupta (LOW RISK: Consistent performer)
  {
    studentId: "stu-016",
    attendance: [
      [22, 25],
      // 88%
      [23, 25],
      // 92%
      [21, 24],
      // 87.5%
      [21, 24],
      // 87.5%
      [22, 24]
      // 91.7%
    ],
    scores: [
      [15, 38, 23],
      // 76.1%
      [16, 39, 24],
      // 79.2%
      [15, 37, 22],
      // 73.9%
      [16, 38, 23],
      // 77.1%
      [16, 39, 24]
      // 79.2%
    ]
  },
  // 17. Kavya Reddy (LOW RISK: Strong upward recovery after completed intervention)
  {
    studentId: "stu-017",
    attendance: [
      [23, 25],
      // 92%
      [23, 25],
      // 92%
      [22, 24],
      // 91.7%
      [21, 24],
      // 87.5%
      [22, 24]
      // 91.7%
    ],
    scores: [
      [12, 36, 25],
      // CS401: 60% -> 72% -> 83.3% (+11.3 pts improvement!)
      [14, 37, 24],
      // CS402: 70% -> 74% -> 80.0%
      [13, 35, 23],
      // CS403: 65% -> 70% -> 76.7%
      [14, 36, 23],
      // MA401: 70% -> 72% -> 76.7%
      [15, 38, 24]
      // CS404: 75% -> 76% -> 80.0%
    ]
  },
  // 18. Harshvardhan Gill (LOW RISK: Solid all-rounder)
  {
    studentId: "stu-018",
    attendance: [
      [22, 25],
      // 88%
      [22, 25],
      // 88%
      [21, 24],
      // 87.5%
      [20, 24],
      // 83.3%
      [21, 24]
      // 87.5%
    ],
    scores: [
      [15, 36, 22],
      // 73.1%
      [15, 37, 22],
      // 73.9%
      [14, 35, 21],
      // 70.0%
      [15, 36, 22],
      // 73.1%
      [16, 38, 23]
      // 77.1%
    ]
  },
  // 19. Ishita Banerjee (LOW RISK: Cohort topper)
  {
    studentId: "stu-019",
    attendance: [
      [25, 25],
      // 100%
      [24, 25],
      // 96%
      [23, 24],
      // 95.8%
      [23, 24],
      // 95.8%
      [23, 24]
      // 95.8%
    ],
    scores: [
      [19, 47, 28],
      // 93.9%
      [19, 46, 28],
      // 93.1%
      [18, 45, 27],
      // 90.0%
      [19, 46, 27],
      // 91.8%
      [18, 45, 27]
      // 90.0%
    ]
  },
  // 20. Pranav Deshpande (LOW RISK: Steady passing standing)
  {
    studentId: "stu-020",
    attendance: [
      [22, 25],
      // 88%
      [22, 25],
      // 88%
      [21, 24],
      // 87.5%
      [21, 24],
      // 87.5%
      [21, 24]
      // 87.5%
    ],
    scores: [
      [14, 34, 21],
      // 69.2%
      [14, 35, 21],
      // 70.0%
      [13, 33, 20],
      // 66.1%
      [14, 34, 21],
      // 69.2%
      [15, 36, 22]
      // 73.1%
    ]
  }
];
var SUBJECT_IDS = ["sub-cs401", "sub-cs402", "sub-cs403", "sub-ma401", "sub-cs404"];
var ASSESSMENT_IDS_BY_SUBJECT = {
  "sub-cs401": ["asmt-cs401-1", "asmt-cs401-2", "asmt-cs401-3"],
  "sub-cs402": ["asmt-cs402-1", "asmt-cs402-2", "asmt-cs402-3"],
  "sub-cs403": ["asmt-cs403-1", "asmt-cs403-2", "asmt-cs403-3"],
  "sub-ma401": ["asmt-ma401-1", "asmt-ma401-2", "asmt-ma401-3"],
  "sub-cs404": ["asmt-cs404-1", "asmt-cs404-2", "asmt-cs404-3"]
};
function buildInitialAttendance() {
  const records = [];
  for (const profile of RAW_PROFILES) {
    profile.attendance.forEach(([attended, held], idx) => {
      const subjectId = SUBJECT_IDS[idx];
      records.push({
        id: `att-${profile.studentId}-${subjectId}`,
        studentId: profile.studentId,
        subjectId,
        classesAttended: attended,
        classesHeld: held,
        updatedAt: "2026-10-08T10:00:00Z"
      });
    });
  }
  return records;
}
function buildInitialScores() {
  const scores = [];
  for (const profile of RAW_PROFILES) {
    profile.scores.forEach((subjectTriple, subIdx) => {
      const subjectId = SUBJECT_IDS[subIdx];
      const asmtIds = ASSESSMENT_IDS_BY_SUBJECT[subjectId];
      subjectTriple.forEach((marks, asmtIdx) => {
        const assessmentId = asmtIds[asmtIdx];
        scores.push({
          id: `scr-${profile.studentId}-${assessmentId}`,
          studentId: profile.studentId,
          assessmentId,
          marksObtained: marks,
          status: marks === null ? "MISSING" : "GRADED",
          updatedAt: "2026-10-08T10:00:00Z"
        });
      });
    });
  }
  return scores;
}
var SYNTHETIC_INTERVENTIONS = [
  {
    id: "int-001",
    studentId: "stu-001",
    subjectId: "sub-cs403",
    riskLevelAtCreation: "HIGH",
    triggerFactors: ["Overall attendance below 75%", "Failing score in Operating Systems (42.5%)"],
    actionTitle: "Mandatory Faculty Check-in & Attendance Recovery Plan",
    description: "Met with Aarav to review morning commute barriers affecting CS401 and CS403 attendance. Established weekly attendance sign-off sheet and paired with lab TA for Operating Systems remedial sessions.",
    assignedFaculty: "Dr. Aris Thorne",
    status: "IN_PROGRESS",
    createdDate: "2026-10-03",
    followUpDate: "2026-10-14",
    outcomeNotes: "Attended last 3 consecutive Operating Systems lectures; lab worksheet 4 submitted.",
    updatedAt: "2026-10-07T14:30:00Z"
  },
  {
    id: "int-002",
    studentId: "stu-002",
    subjectId: "sub-cs401",
    riskLevelAtCreation: "HIGH",
    triggerFactors: ["Severe score decline (-22.7 pts) in CS401", "Severe score decline (-22.0 pts) in MA401"],
    actionTitle: "Diagnostic Assessment Walkthrough & Study Load Review",
    description: "Schedule a 1-on-1 diagnostic session to review Midterm & Assessment 2 scripts in Data Structures and Linear Algebra to identify why performance dropped sharply after Quiz 1.",
    assignedFaculty: "Dr. Aris Thorne",
    status: "PLANNED",
    createdDate: "2026-10-08",
    followUpDate: "2026-10-12",
    outcomeNotes: "",
    updatedAt: "2026-10-08T09:15:00Z"
  },
  {
    id: "int-003",
    studentId: "stu-003",
    subjectId: null,
    riskLevelAtCreation: "HIGH",
    triggerFactors: ["Failing in 3 subjects (CS401, CS402, MA401)", "Overall attendance at 69.7%"],
    actionTitle: "Coordinated Multi-Subject Academic Support Plan",
    description: "Joint advisor meeting to restructure weekly study hours, prioritize core passing requirements in CS401/CS402/MA401, and enroll in Tuesday/Thursday department peer tutoring.",
    assignedFaculty: "Prof. Meera Krishnan",
    status: "IN_PROGRESS",
    createdDate: "2026-10-01",
    followUpDate: "2026-10-15",
    outcomeNotes: "Student joined peer tutoring cohort; completing practice problem sets for DBMS and DSA.",
    updatedAt: "2026-10-06T16:00:00Z"
  },
  {
    id: "int-004",
    studentId: "stu-008",
    subjectId: "sub-ma401",
    riskLevelAtCreation: "MEDIUM",
    triggerFactors: ["Single-subject failing score in MA401 Linear Algebra (45.7%)"],
    actionTitle: "Targeted Linear Algebra Problem-Solving Clinic",
    description: "Sana excels in programming courses (>75%) but is struggling with Eigenvalues and Probability distributions. Assigned targeted weekly problem sets with Dr. Rostova during Thursday office hours.",
    assignedFaculty: "Dr. Elena Rostova",
    status: "IN_PROGRESS",
    createdDate: "2026-10-04",
    followUpDate: "2026-10-16",
    outcomeNotes: "Completed 2 office-hour review sessions on matrix diagonalization.",
    updatedAt: "2026-10-07T11:20:00Z"
  },
  {
    id: "int-005",
    studentId: "stu-014",
    subjectId: null,
    riskLevelAtCreation: "INSUFFICIENT_DATA",
    triggerFactors: ["Missing Midterm & Assessment 2 scores across 4 subjects due to medical deferment"],
    actionTitle: "Makeup Assessment Schedule & Record Reconciliation",
    description: "Coordinate with subject instructors to schedule deferred Midterm and Lab Assessment sittings between Oct 14 and Oct 22 so complete academic standing can be evaluated.",
    assignedFaculty: "Prof. Meera Krishnan",
    status: "PLANNED",
    createdDate: "2026-10-07",
    followUpDate: "2026-10-14",
    outcomeNotes: "Medical certificate verified; makeup timetable shared with student.",
    updatedAt: "2026-10-07T15:00:00Z"
  },
  {
    id: "int-006",
    studentId: "stu-017",
    subjectId: "sub-cs401",
    riskLevelAtCreation: "MEDIUM",
    triggerFactors: ["Weak Quiz 1 score in CS401 (60.0%) and CS403 (65.0%)"],
    actionTitle: "Early Revision Plan & Algorithm Lab Coaching",
    description: "Provided structured recursion and tree-traversal practice sheets after Quiz 1 and paired student with study partner for weekly lab prep.",
    assignedFaculty: "Dr. Julian Vance",
    status: "COMPLETED",
    createdDate: "2026-08-25",
    followUpDate: "2026-09-28",
    outcomeNotes: "Resolved: Kavya improved CS401 marks from 60.0% (Quiz 1) to 72.0% (Midterm) and 83.3% (Assessment 2). Reclassified to Low Risk.",
    updatedAt: "2026-10-03T12:00:00Z"
  }
];
function createInitialSyntheticDataset() {
  return {
    students: structuredClone(SYNTHETIC_STUDENTS),
    subjects: structuredClone(SYNTHETIC_SUBJECTS),
    assessments: structuredClone(SYNTHETIC_ASSESSMENTS),
    scores: buildInitialScores(),
    attendance: buildInitialAttendance(),
    interventions: structuredClone(SYNTHETIC_INTERVENTIONS)
  };
}
export {
  DEFAULT_RISK_THRESHOLDS,
  SYNTHETIC_ASSESSMENTS,
  SYNTHETIC_INTERVENTIONS,
  SYNTHETIC_STUDENTS,
  SYNTHETIC_SUBJECTS,
  createInitialSyntheticDataset
};
