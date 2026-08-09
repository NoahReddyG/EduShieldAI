const TESTS_KEY = 'edushield_tests';
const RESULTS_KEY = 'edushield_results';

const SEED_TESTS = [
  {
    id: 'test-demo-001',
    title: 'CS401: Artificial Intelligence — Midterm',
    topic: 'Artificial Intelligence',
    duration: 45,
    description: 'Midterm examination covering fundamental AI concepts including bias, fairness, and interdisciplinary frameworks.',
    instructions: 'Read all questions and the passage carefully. Your face must remain visible to the camera at all times. You have 45 minutes.',
    passage: 'Artificial intelligence systems are increasingly deployed in high-stakes domains such as medical diagnosis, criminal justice, and educational assessment. These systems rely on large datasets to identify patterns and generate predictions. However, the empirical implications of algorithmic bias on socioeconomic equity present a multifaceted challenge to practitioners and policymakers alike. Researchers must navigate the cognitive friction between technical optimization objectives and broader societal value alignment. This necessitates an interdisciplinary framework that integrates statistical rigor with ethical deliberation, thereby ensuring that AI systems are not merely technically proficient but also epistemically just and socially accountable.',
    questions: [
      {
        id: 1,
        text: 'Which of the following best describes the primary challenge when deploying AI in high-stakes domains?',
        options: [
          'Insufficient computational resources for processing',
          'Algorithmic bias affecting socioeconomic equity',
          'Lack of user interface design standards',
          'Excessive data storage requirements',
        ],
        correct: 1,
      },
      {
        id: 2,
        text: 'The term "cognitive friction" in the passage refers to:',
        options: [
          'Memory limitations in AI hardware',
          'Difficulty in user adoption of AI tools',
          'Tension between optimization goals and societal values',
          'Processing delay in neural network inference',
        ],
        correct: 2,
      },
      {
        id: 3,
        text: 'An "epistemically just" AI system implies that it:',
        options: [
          'Achieves 100% classification accuracy',
          'Operates faster than human decision-making',
          'Fairly accounts for diverse knowledge and perspectives',
          'Requires no human oversight after deployment',
        ],
        correct: 2,
      },
      {
        id: 4,
        text: 'What does the author argue is essential for addressing algorithmic bias?',
        options: [
          'Larger training datasets exclusively',
          'Interdisciplinary frameworks combining statistics and ethics',
          'Restricting AI use to non-critical applications',
          'Open-sourcing all AI model weights',
        ],
        correct: 1,
      },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    createdBy: 'professor@admin.com',
    status: 'active',
  },
  {
    id: 'test-demo-002',
    title: 'CS201: Data Structures & Algorithms — Quiz 3',
    topic: 'Data Structures & Algorithms',
    duration: 20,
    description: 'Short assessment on trees, graphs, sorting algorithms, and time complexity.',
    instructions: 'Answer all questions. Focus on time complexity analysis. 20 minutes allowed.',
    passage: 'Efficient algorithms form the cornerstone of computer science. The choice of data structure fundamentally impacts both time complexity and space complexity. Binary search trees offer O(log n) average case for search, insert, and delete operations, making them superior to linear structures for large datasets. However, worst-case degeneration to O(n) occurs in unbalanced trees. Red-Black trees and AVL trees address this by maintaining balance through rotations. Graph traversal algorithms such as BFS and DFS have O(V+E) complexity, where V is vertices and E is edges. Understanding these trade-offs is critical for designing scalable software systems.',
    questions: [
      {
        id: 1,
        text: 'What is the average-case time complexity of search in a Binary Search Tree?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correct: 1,
      },
      {
        id: 2,
        text: 'Which condition causes a BST to degenerate to O(n) search complexity?',
        options: [
          'Too many nodes in the tree',
          'Inserting elements in sorted order (fully unbalanced)',
          'Deleting the root node repeatedly',
          'Using non-integer keys',
        ],
        correct: 1,
      },
      {
        id: 3,
        text: 'The time complexity of BFS and DFS graph traversal is:',
        options: ['O(V²)', 'O(V log V)', 'O(V + E)', 'O(E²)'],
        correct: 2,
      },
    ],
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdBy: 'professor@admin.com',
    status: 'active',
  },
];

/** Initialize localStorage with seed data on first load */
export function initializeTests() {
  if (!localStorage.getItem(TESTS_KEY)) {
    localStorage.setItem(TESTS_KEY, JSON.stringify(SEED_TESTS));
  }
}

/** Retrieve all tests */
export function getAllTests() {
  try {
    initializeTests();
    return JSON.parse(localStorage.getItem(TESTS_KEY) || '[]');
  } catch {
    return SEED_TESTS;
  }
}

/** Retrieve a single test by ID */
export function getTestById(id) {
  return getAllTests().find(t => t.id === id) || null;
}

/** Tests created by a specific teacher */
export function getTeacherTests(teacherEmail) {
  return getAllTests().filter(t => t.createdBy === teacherEmail);
}

export function createTest(data) {
  const tests = getAllTests();
  const test = {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  tests.unshift(test); 
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  return test;
}

export function saveTestResult(result) {
  try {
    const all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    
    const filtered = all.filter(
      r => !(r.testId === result.testId && r.studentEmail === result.studentEmail)
    );
    filtered.unshift({ ...result, completedAt: new Date().toISOString() });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('saveTestResult failed:', err);
  }
}

/** All student results for a specific test (for teacher view) */
export function getTestResults(testId) {
  try {
    const all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    return all.filter(r => r.testId === testId);
  } catch {
    return [];
  }
}

/** Get a specific student's result for a test */
export function getStudentResult(testId, studentEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    return all.find(r => r.testId === testId && r.studentEmail === studentEmail) || null;
  } catch {
    return null;
  }
}

/** Get result by sessionId (for report page) */
export function getResultBySessionId(sessionId) {
  try {
    const all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    return all.find(r => String(r.sessionId) === String(sessionId)) || null;
  } catch {
    return null;
  }
}

/** All results for a student (for student dashboard past exams) */
export function getStudentAllResults(studentEmail) {
  try {
    const all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    return all.filter(r => r.studentEmail === studentEmail);
  } catch {
    return [];
  }
}

/** Integrity status label from trust score */
export function getTrustLabel(score) {
  if (score >= 80) return 'Clean';
  if (score >= 60) return 'Warning';
  return 'Flagged';
}

/** Color for integrity status */
export function getTrustColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}
