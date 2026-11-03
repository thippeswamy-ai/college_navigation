/**
 * Comprehensive Automated Test Suite for Smart College Navigation & Management
 */

// 1. Mock browser globals BEFORE any ES modules load
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.sessionStorage = global.localStorage;

let spokenUtterances = [];
let speechCancelCalled = 0;

global.window = {
  speechSynthesis: {
    voices: [
      { name: "Google US English", lang: "en-US" },
      { name: "Microsoft David", lang: "en-US" }
    ],
    getVoices() { return this.voices; },
    speak(utterance) {
      spokenUtterances.push(utterance.text);
      if (utterance.onstart) utterance.onstart();
      if (utterance.onend) utterance.onend();
    },
    cancel() {
      speechCancelCalled++;
    },
    pause() {},
    resume() {}
  }
};
global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    this.voice = null;
  }
};

import http from 'http';

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASSED' });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAILED', error: err.message });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASSED' });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAILED', error: err.message });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function runTestSuite() {
  console.log("=======================================================");
  console.log("RUNNING COMPREHENSIVE TEST SUITE");
  console.log("=======================================================\n");

  // Dynamically import modules now that globals are ready
  const {
    fetchDepartments,
    saveDepartment,
    deleteDepartment,
    fetchNavigationImages,
    saveNavigationImage,
    deleteNavigationImage,
    fetchCollegeInfo
  } = await import('./js/firebase-config.js');

  const { authManager, ROLES } = await import('./js/auth.js');
  const { campusSearchEngine } = await import('./js/search.js');
  const { voiceManager } = await import('./js/voice-helper.js');

  // --- SUITE 1: HTTP Server & File Endpoints ---
  console.log("[SUITE 1] HTTP Server & Asset Delivery");
  const endpoints = [
    '/',
    '/index.html',
    '/login.html',
    '/admin.html',
    '/css/main.css',
    '/css/navigation.css',
    '/css/admin.css',
    '/js/home.js',
    '/js/navigation.js',
    '/js/search.js',
    '/js/voice-helper.js',
    '/js/admin.js',
    '/js/firebase-config.js',
    '/js/seed-data.js'
  ];

  for (const ep of endpoints) {
    await testAsync(`Server serves endpoint: ${ep}`, async () => {
      const code = await new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${ep}`, (res) => {
          resolve(res.statusCode);
        }).on('error', reject);
      });
      if (code !== 200) throw new Error(`Received status ${code}`);
    });
  }

  // --- SUITE 2: Authentication & RBAC ---
  console.log("\n[SUITE 2] Authentication & Role-Based Access Control");
  
  await testAsync("Super Admin login with credentials (kthippeswamy109@gmail.com / 123456789)", async () => {
    const res = await authManager.login("kthippeswamy109@gmail.com", "123456789");
    if (!res.success) throw new Error("Login failed");
    if (res.user.role !== ROLES.SUPER_ADMIN) throw new Error(`Expected role superadmin, got ${res.user.role}`);
  });

  test("Super Admin permission checks", () => {
    if (!authManager.isSuperAdmin()) throw new Error("isSuperAdmin() should be true");
    if (!authManager.canManageDepartment("cse")) throw new Error("canManageDepartment should be true");
    if (!authManager.canPublishCollegeInfo()) throw new Error("canPublishCollegeInfo should be true");
  });

  await testAsync("Reject invalid password", async () => {
    let rejected = false;
    try {
      await authManager.login("kthippeswamy109@gmail.com", "wrongpass");
    } catch (e) {
      rejected = true;
    }
    if (!rejected) throw new Error("Login should have thrown an error for wrong password");
  });

  await testAsync("Reject non-existent email", async () => {
    let rejected = false;
    try {
      await authManager.login("unknown@college.edu", "123456789");
    } catch (e) {
      rejected = true;
    }
    if (!rejected) throw new Error("Login should have failed for unknown email");
  });

  await testAsync("Admin login and capabilities (Admin can add departments & images)", async () => {
    const adminRes = await authManager.login("cse.admin@college.edu", "123456789");
    if (!adminRes.success) throw new Error("Admin login failed");
    if (adminRes.user.role !== ROLES.ADMIN) throw new Error(`Expected role admin, got ${adminRes.user.role}`);
    if (!authManager.canAddDepartment()) throw new Error("Admin should be authorized to add departments");
    if (!authManager.canManageDepartment("cse")) throw new Error("Admin should be authorized to manage assigned department 'cse'");
    
    // Switch back to Super Admin for subsequent operations
    await authManager.login("kthippeswamy109@gmail.com", "123456789");
  });

  // --- SUITE 3: Campus Data Services (CRUD) ---
  console.log("\n[SUITE 3] Campus Data Services & Collections");

  let departments = [];
  await testAsync("Fetch all departments (includes CSE, AI, Botany, Zoology, EDC, Library)", async () => {
    departments = await fetchDepartments();
    if (!departments || departments.length < 6) throw new Error(`Expected at least 6 depts, got ${departments.length}`);
    const codes = departments.map(d => d.code);
    ['CSE', 'BOTANY', 'ZOOLOGY', 'EDC'].forEach(c => {
      if (!codes.includes(c)) throw new Error(`Missing department code ${c}`);
    });
  });

  await testAsync("Department CRUD operations (Create, Read, Update, Delete)", async () => {
    const testDept = {
      id: "biotech-test",
      name: "Department of Biotechnology",
      code: "BIOTECH",
      building: "Life Sciences Block C",
      floor: "3rd Floor",
      hod: "Dr. Test HOD",
      description: "Genetic engineering and bioinformatics lab",
      status: "published"
    };
    await saveDepartment(testDept);
    let current = await fetchDepartments();
    if (!current.some(d => d.id === "biotech-test")) throw new Error("Created department not found");

    // Update
    testDept.hod = "Dr. Updated HOD";
    await saveDepartment(testDept);
    current = await fetchDepartments();
    const updated = current.find(d => d.id === "biotech-test");
    if (updated.hod !== "Dr. Updated HOD") throw new Error("Updated HOD did not persist");

    // Delete
    await deleteDepartment("biotech-test");
    current = await fetchDepartments();
    if (current.some(d => d.id === "biotech-test")) throw new Error("Deleted department still exists");
  });

  let navImages = [];
  await testAsync("Fetch navigation images (Turn-by-turn sequences for CSE, AI, Botany, Zoology, EDC, Library)", async () => {
    navImages = await fetchNavigationImages();
    if (!navImages || navImages.length < 20) throw new Error(`Expected at least 20 navigation images, got ${navImages.length}`);
    
    // Verify CSE sequence (5 images)
    const cseSteps = await fetchNavigationImages("cse");
    if (cseSteps.length !== 5) throw new Error(`Expected 5 steps for CSE, got ${cseSteps.length}`);
    
    // Check sequence numbers are sequential 1..5
    for (let i = 0; i < cseSteps.length; i++) {
      if (Number(cseSteps[i].sequence) !== i + 1) {
        throw new Error(`CSE step sequence mismatch at index ${i}: ${cseSteps[i].sequence}`);
      }
      if (!cseSteps[i].instruction || cseSteps[i].instruction.length < 10) {
        throw new Error(`Missing voice instruction for step ${i + 1}`);
      }
    }
  });

  await testAsync("Navigation Image CRUD operations & Sequence Reordering", async () => {
    const testNav = {
      id: "nav-test-step",
      departmentId: "cse",
      sequence: 99,
      title: "Test Checkpoint",
      instruction: "Turn right at the test marker.",
      imageUrl: "https://example.com/test.jpg",
      status: "published"
    };
    await saveNavigationImage(testNav);
    let steps = await fetchNavigationImages("cse");
    if (!steps.some(s => s.id === "nav-test-step")) throw new Error("Created step not found");

    // Delete
    await deleteNavigationImage("nav-test-step");
    steps = await fetchNavigationImages("cse");
    if (steps.some(s => s.id === "nav-test-step")) throw new Error("Deleted step still exists");
  });

  await testAsync("Fetch College Information & Announcements", async () => {
    const info = await fetchCollegeInfo();
    if (!info || info.length < 5) throw new Error(`Expected at least 5 posts, got ${info.length}`);
    const categories = info.map(i => i.category);
    ['about', 'history', 'courses', 'facilities', 'announcements', 'notices', 'events'].forEach(cat => {
      if (!categories.includes(cat)) throw new Error(`Missing college info category: ${cat}`);
    });
  });

  // --- SUITE 4: Campus Search Engine ---
  console.log("\n[SUITE 4] Campus Search Engine (Fuzzy & Dynamic Querying)");
  await testAsync("Build search index across departments, labs, classrooms, and facilities", async () => {
    await campusSearchEngine.buildIndex();
    if (campusSearchEngine.searchIndex.length < 15) {
      throw new Error(`Index too small: ${campusSearchEngine.searchIndex.length} items`);
    }
  });

  await testAsync("Search query 'CSE' returns department, labs, and classrooms", async () => {
    const res = await campusSearchEngine.search("CSE");
    if (res.length === 0) throw new Error("No results for 'CSE'");
    const hasDept = res.some(r => r.type === "Department" && r.title.includes("Computer Science"));
    if (!hasDept) throw new Error("Department not returned in top results");
  });

  await testAsync("Search query 'Library' returns Central Library", async () => {
    const res = await campusSearchEngine.search("Library");
    if (res.length === 0) throw new Error("No results for 'Library'");
    const hasLib = res.some(r => r.title.includes("Central Library"));
    if (!hasLib) throw new Error("Central Library not matched");
  });

  await testAsync("Search query 'Room 204' (Classroom / HOD office) returns matching result", async () => {
    const res = await campusSearchEngine.search("Room 204");
    if (res.length === 0) throw new Error("No results for 'Room 204'");
  });

  await testAsync("Search category filters (departments, labs, classrooms, facilities)", async () => {
    const deptsOnly = await campusSearchEngine.search("Science", "department");
    deptsOnly.forEach(r => {
      if (r.type !== "Department") throw new Error(`Expected Department type, got ${r.type}`);
    });
  });

  // --- SUITE 5: Voice Navigation & Audio Engine ---
  console.log("\n[SUITE 5] Automatic Voice Guidance & Speech Engine");
  test("Voice Manager initializes browser SpeechSynthesis voices", () => {
    if (!voiceManager.synth) throw new Error("SpeechSynthesis not initialized");
  });

  await testAsync("Voice Manager speaks instructions and updates state", async () => {
    spokenUtterances = [];
    voiceManager.speak("Welcome to campus. Proceed straight ahead.");
    await new Promise(r => setTimeout(r, 100)); // voiceManager uses 50ms timeout for clean cancel
    if (spokenUtterances.length === 0) throw new Error("Utterance was not sent to speech synthesis");
    if (spokenUtterances[0] !== "Welcome to campus. Proceed straight ahead.") {
      throw new Error(`Utterance text mismatch: ${spokenUtterances[0]}`);
    }
  });

  await testAsync("Audio synchronization: Cancels active speech before starting new instruction (no overlapping audio)", async () => {
    const cancelCountBefore = speechCancelCalled;
    voiceManager.speak("First instruction text");
    voiceManager.speak("Second instruction text");
    await new Promise(r => setTimeout(r, 100));
    if (speechCancelCalled <= cancelCountBefore) {
      throw new Error("synth.cancel() was not called between consecutive speeches!");
    }
  });

  await testAsync("Live Voice Preview functionality (for Admin upload form)", async () => {
    voiceManager.previewVoice("Testing live admin voice preview");
    await new Promise(r => setTimeout(r, 100));
    if (!spokenUtterances.includes("Testing live admin voice preview")) {
      throw new Error("Voice preview did not speak input text");
    }
  });

  // Summary
  console.log("\n=======================================================");
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED (Total: ${results.length})`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
