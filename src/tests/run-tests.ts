import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const tests: { name: string; fn: () => Promise<void> | void }[] = [];

// ----------------------------------------------------
// Test 1: Password Hashing Verification
// ----------------------------------------------------
tests.push({
  name: "Bcrypt Hashing Integrity & Comparison Verification",
  fn: async () => {
    const rawPassword = "premiumSecurePassword123!";
    const wrongPassword = "wrongPassword123!";
    
    // Hash password
    const hash = await bcrypt.hash(rawPassword, 10);
    
    if (!hash || hash === rawPassword) {
      throw new Error("Password hash was not created properly, or returned raw text");
    }
    
    // Compare valid password
    const matchSuccess = await bcrypt.compare(rawPassword, hash);
    if (!matchSuccess) {
      throw new Error("Correct password comparison failed against valid hash");
    }
    
    // Compare invalid password
    const matchFailure = await bcrypt.compare(wrongPassword, hash);
    if (matchFailure) {
      throw new Error("Incorrect password erroneously matched the hash");
    }
  }
});

// ----------------------------------------------------
// Test 2: Task Validator Constraints
// ----------------------------------------------------
tests.push({
  name: "Task Validation Logic & Form Invariant Safeguards",
  fn: () => {
    const validateTaskData = (data: { title?: string; status?: string; priority?: string }) => {
      if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        throw new Error("Validation Failed: Title is empty or invalid format");
      }
      
      const validStatuses = ['todo', 'in-progress', 'completed'];
      if (data.status && !validStatuses.includes(data.status)) {
        throw new Error(`Validation Failed: Invalid status values "${data.status}"`);
      }

      const validPriorities = ['low', 'medium', 'high'];
      if (data.priority && !validPriorities.includes(data.priority)) {
        throw new Error(`Validation Failed: Invalid priority value "${data.priority}"`);
      }

      return {
        title: data.title.trim(),
        status: data.status || 'todo',
        priority: data.priority || 'medium'
      };
    };

    // Case A: Correct Task creation
    const taskA = validateTaskData({ title: " Complete report ", status: "in-progress", priority: "high" });
    if (taskA.title !== "Complete report" || taskA.status !== "in-progress" || taskA.priority !== "high") {
      throw new Error("Task properties were parsed incorrectly when inputs are valid");
    }

    // Case B: Blank Title (Must throw)
    try {
      validateTaskData({ title: "  " });
      throw new Error("Empty title was erroneously approved");
    } catch (e: any) {
      if (!e.message.includes("Title is empty")) throw e;
    }

    // Case C: Invalid Status (Must throw)
    try {
      validateTaskData({ title: "Clean room", status: "archived" });
      throw new Error("Invalid status field was erroneously approved");
    } catch (e: any) {
      if (!e.message.includes("Invalid status")) throw e;
    }
  }
});

// ----------------------------------------------------
// Test 3: JWT Token Generation & Verification
// ----------------------------------------------------
tests.push({
  name: "JSON Web Token Signing, Role claims, and Verification Engine",
  fn: () => {
    const mockSecret = "highly-secure-test-secret-key-9988";
    const payload = {
      uid: crypto.randomUUID(),
      email: "test@example.com",
      role: "admin" as const
    };

    // Sign token
    const token = jwt.sign(payload, mockSecret, { expiresIn: '1h' });
    if (!token) {
      throw new Error("Token signing returned an empty string");
    }

    // Verify valid token
    const decoded: any = jwt.verify(token, mockSecret);
    if (decoded.uid !== payload.uid || decoded.email !== payload.email || decoded.role !== payload.role) {
      throw new Error("Decoded payload claims did not match original sign parameters");
    }

    // Verify invalid signature failure
    try {
      const wrongSecret = "malicious-different-secret-key";
      jwt.verify(token, wrongSecret);
      throw new Error("Token with wrong signature was erroneously verified");
    } catch (e: any) {
      if (e.message !== "invalid signature") {
        throw e;
      }
    }
  }
});

// ----------------------------------------------------
// Test Runner Engine
// ----------------------------------------------------
async function main() {
  console.log("\n🧪 STARTING SYSTEM TEST SUITE: Core Authentication & Integrity Systems\n");
  const results: TestResult[] = [];
  
  for (const test of tests) {
    console.log(`⏳ Running standard test: [${test.name}]`);
    try {
      await test.fn();
      results.push({ name: test.name, passed: true });
      console.log(`✅ Passed: [${test.name}]\n`);
    } catch (err: any) {
      results.push({ name: test.name, passed: false, error: err.message });
      console.error(`❌ Failed: [${test.name}] with error: "${err.message}"\n`);
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log("----------------------------------------------------------------------");
  console.log(`📋 TEST SUMMARY: ${passedCount}/${tests.length} tests passed successfully.`);
  console.log("----------------------------------------------------------------------\n");

  if (passedCount !== tests.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
