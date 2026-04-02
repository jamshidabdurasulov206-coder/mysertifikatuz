/**
 * Seed script — bootstraps minimal data for local development.
 * 
 * Creates: admin user, 1 sample subject, 1 sample test with 3 questions.
 * 
 * Usage:  cd server && node scripts/seed.js
 * 
 * Safe to run multiple times — skips if data already exists.
 */
require("dotenv").config();
const pool = require("../src/config/db");
const bcrypt = require("bcrypt");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Admin user
    const existingAdmin = await client.query("SELECT id FROM users WHERE email = $1", ["admin@example.com"]);
    let adminId;
    if (existingAdmin.rows.length === 0) {
      const hashedPw = await bcrypt.hash("admin123", 10);
      const res = await client.query(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING id",
        ["admin", "admin@example.com", hashedPw, "admin"]
      );
      adminId = res.rows[0].id;
      console.log("✅ Admin user created (admin@example.com / admin123)");
    } else {
      adminId = existingAdmin.rows[0].id;
      console.log("⏭️  Admin user already exists, skipping");
    }

    // 2) Sample user
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", ["user@example.com"]);
    let userId;
    if (existingUser.rows.length === 0) {
      const hashedPw = await bcrypt.hash("user123", 10);
      const res = await client.query(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING id",
        ["testuser", "user@example.com", hashedPw, "user"]
      );
      userId = res.rows[0].id;
      console.log("✅ Sample user created (user@example.com / user123)");
    } else {
      userId = existingUser.rows[0].id;
      console.log("⏭️  Sample user already exists, skipping");
    }

    // 3) Subject
    const existingSubject = await client.query("SELECT id FROM subjects WHERE name = $1", ["Matematika"]);
    let subjectId;
    if (existingSubject.rows.length === 0) {
      const res = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", ["Matematika"]);
      subjectId = res.rows[0].id;
      console.log("✅ Subject 'Matematika' created");
    } else {
      subjectId = existingSubject.rows[0].id;
      console.log("⏭️  Subject 'Matematika' already exists, skipping");
    }

    // 4) Test
    const existingTest = await client.query("SELECT id FROM tests WHERE title = $1", ["Matematika asosiy test"]);
    let testId;
    if (existingTest.rows.length === 0) {
      const res = await client.query(
        "INSERT INTO tests (title, description, subject_id, price, time_limit_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ["Matematika asosiy test", "Matematika fanidan namunaviy test", subjectId, 10000, 60]
      );
      testId = res.rows[0].id;
      console.log("✅ Test 'Matematika asosiy test' created");
    } else {
      testId = existingTest.rows[0].id;
      console.log("⏭️  Test already exists, skipping");
    }

    // 5) Questions (only if test was just created or has no questions)
    const qCount = await client.query("SELECT COUNT(*) FROM questions WHERE test_id = $1", [testId]);
    if (parseInt(qCount.rows[0].count) === 0) {
      const sampleQuestions = [
        {
          question_text: "2 + 2 = ?",
          type: "multiple",
          options: JSON.stringify(["3", "4", "5", "6"]),
          correct_option: 1,
          correct_answer_text: null,
          difficulty_level: 0.5,
        },
        {
          question_text: "9 * 9 = ?",
          type: "multiple",
          options: JSON.stringify(["72", "81", "90", "64"]),
          correct_option: 1,
          correct_answer_text: null,
          difficulty_level: 1.0,
        },
        {
          question_text: "Uchburchak yuzini hisoblash formulasini yozing",
          type: "open",
          options: JSON.stringify([]),
          correct_option: null,
          correct_answer_text: "S = (a * h) / 2",
          difficulty_level: 1.5,
        },
      ];

      for (const q of sampleQuestions) {
        await client.query(
          `INSERT INTO questions (test_id, question_text, type, options, correct_option, correct_answer_text, difficulty_level)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [testId, q.question_text, q.type, q.options, q.correct_option, q.correct_answer_text, q.difficulty_level]
        );
      }
      console.log("✅ 3 sample questions created");
    } else {
      console.log("⏭️  Questions already exist for this test, skipping");
    }

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete! You can now log in as:");
    console.log("   Admin: admin@example.com / admin123");
    console.log("   User:  user@example.com / user123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
