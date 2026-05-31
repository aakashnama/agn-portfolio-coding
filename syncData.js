const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const API_KEY = "...."; //  Replace with your key
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// Master list: display name -> safe file name
const courses = [
  { display: "Assembly",        file: "Assembly" },
  { display: "C",               file: "C" },
  { display: "C++",             file: "Cpp" },
  { display: "C#",              file: "CSharp" },
  { display: "Java",            file: "Java" },
  { display: "JavaScript",      file: "JavaScript" },
  { display: "TypeScript",      file: "TypeScript" },
  { display: "Python",          file: "Python" },
  { display: "Ruby",            file: "Ruby" },
  { display: "Go (Golang)",     file: "Go" },
  { display: "Rust",            file: "Rust" },
  { display: "PHP",             file: "PHP" },
  { display: "Swift",           file: "Swift" },
  { display: "Kotlin",          file: "Kotlin" },
  { display: "SQL",             file: "SQL" },
  { display: "R",               file: "R" },
  { display: "MATLAB",          file: "MATLAB" },
  { display: "Dart",            file: "Dart" },
  { display: "Scala",           file: "Scala" },
  { display: "Perl",            file: "Perl" },
  { display: "Lua",             file: "Lua" },
  { display: "Haskell",         file: "Haskell" },
  { display: "Objective-C",     file: "Objective-C" },
  { display: "Shell (Bash)",    file: "Shell-Bash" },
  { display: "Julia",           file: "Julia" },
  { display: "F#",              file: "FSharp" },
  { display: "Solidity",        file: "Solidity" },
  { display: "VHDL / Verilog",  file: "VHDL-Verilog" },
  { display: "Fortran",         file: "Fortran" },
  { display: "COBOL",           file: "COBOL" },
  { display: "Erlang / Elixir", file: "Erlang-Elixir" },
  { display: "Groovy",          file: "Groovy" },
  { display: "Ada",             file: "Ada" },
  { display: "Prolog",          file: "Prolog" },
  { display: "Lisp / Clojure",  file: "Lisp-Clojure" },
];

const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

async function fetchAndSave() {
  for (let course of courses) {
    const filePath = path.join(dataDir, `${course.file}.txt`);

    if (fs.existsSync(filePath)) {
      console.log(`Skipped (already exists): ${course.file}.txt`);
      continue;
    }

    // ULTRA-STRICT PROMPT TO PREVENT HALLUCINATIONS
    const strictPromptTemplate = `
You are a senior computer science professor and curriculum architect with 20+ years of industry experience.
Your task is to produce a complete, accurate, and beginner-friendly course guide for: {{NAME}}

ABSOLUTE RULES:
1. NO HALLUCINATIONS: Do not invent book titles, URLs, course names, tool names, or library names.
2. VERIFIED TOOLS ONLY: Only mention frameworks, libraries, and tools that are confirmed, actively maintained industry standards as of 2024.
3. NO MARKDOWN: Output plain text only. No asterisks, no hash symbols, no dashes for bullets, no code fences. Use only numbers and plain sentences.
4. NO FILLER: Every sentence must deliver real, actionable information.
5. PROJECTS MUST BE REALISTIC: All suggested projects must be concrete and buildable.

OUTPUT FORMAT — Follow this EXACT structure. Do not skip or add any section.

================================================================
{{NAME_UPPER}}
================================================================

SECTION 1: WHAT IS {{NAME_UPPER}}
Write 3 to 5 factual sentences covering its origin, core paradigm (compiled/interpreted, typed/untyped, object-oriented/functional), and primary domain (systems, web, data science, mobile, etc.).

SECTION 2: WHY LEARN {{NAME_UPPER}}
Write 5 to 7 numbered points with specific, verifiable reasons. Mention real job roles, industries, or platforms. Do not write vague statements.

1.
2.
3.
4.
5.

SECTION 3: COMPLETE ROADMAP

STAGE 1 — FOUNDATIONS (Beginner)
Topics: Write 6 to 10 numbered topics covering syntax, data types, variables, operators, control flow, loops, and functions.
Beginner Project: One simple, realistic project in 2 to 3 sentences.

---

STAGE 2 — INTERMEDIATE CONCEPTS
Topics: Write 6 to 10 numbered topics covering OOP or functional programming features, error handling, file I/O, and memory management if applicable.
Intermediate Project: One intermediate project in 2 to 3 sentences.

---

STAGE 3 — STANDARD LIBRARY AND ECOSYSTEM
Topics: Write 5 to 8 numbered topics covering verified standard library modules and the official package manager or dependency tool.

---

STAGE 4 — FRAMEWORKS, TOOLS, AND ADVANCED CONCEPTS
Topics: Write 6 to 10 numbered topics covering real, widely-used frameworks, concurrency, design patterns, performance, and testing.
Advanced Project: One advanced, real-world project in 2 to 3 sentences.

---

STAGE 5 — PROFESSIONAL AND PRODUCTION READINESS
Topics: Write 5 to 8 numbered topics covering testing strategies, CI/CD, code review, deployment, documentation, and performance profiling.
Capstone Project: One capstone project combining multiple roadmap stages in 3 to 4 sentences.

---

ESTIMATED LEARNING TIME
Provide a time estimate for three phases: Beginner (Stage 1 to 2), Intermediate (Stage 3 to 4), and Professional (Stage 5). Assume 1 to 2 hours of daily practice. Express each as a range in weeks or months.

================================================================
END OF GUIDE
================================================================
`;

    // THE PLACEHOLDERS WITH THE ACTUAL LANGUAGE NAME
    const strictPrompt = strictPromptTemplate
      .replace(/\{\{NAME\}\}/g, course.display)
      .replace(/\{\{NAME_UPPER\}\}/g, course.display.toUpperCase());

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{
            role: "system",
            content: "You are a factual computer science curriculum generator. You never hallucinate resources. You only output plain text without markdown formatting."
          }, {
            role: "user",
            content: strictPrompt.trim() // Now uses the replaced text
          }],
          temperature: 0.13
        })
      });

      const data = await res.json();

      if (data.choices && data.choices.length > 0) {
        let text = data.choices[0].message.content.trim();

        // Cleanup any accidental markdown artifacts (like bold asterisks) just in case
        text = text.replace(/\*\*/g, '').replace(/##/g, '').replace(/__/g, '');

        fs.writeFileSync(filePath, text, 'utf8');
        console.log(`Saved: ${course.file}.txt (${course.display})`);
      } else {
        console.error(`API Error for ${course.display}:`, data);
      }
    } catch (err) {
      console.error(`Fetch failed for ${course.display}:`, err.message);
    }

    // Delay to respect rate limits (adjust if needed based on your Groq tier)
    await new Promise(r => setTimeout(r, 2000));
  }
}

fetchAndSave();