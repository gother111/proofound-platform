/**
 * Test Script for Local AI Skill Extraction
 *
 * Usage: npx tsx scripts/test-local-skill-extraction.ts
 *
 * This script tests the local skill extraction pipeline with sample CV text
 * to verify the NLP + semantic embedding approach works correctly.
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Sample CV texts for testing
const SAMPLE_CVS = {
  softwareEngineer: `
    Senior Software Engineer with 8+ years of experience in full-stack development.
    
    SKILLS:
    - Programming Languages: JavaScript, TypeScript, Python, Java
    - Frontend: React, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
    - Backend: Node.js, Express, Django, Spring Boot
    - Databases: PostgreSQL, MongoDB, Redis
    - Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, GitHub Actions
    - Tools: Git, Jira, Figma
    
    EXPERIENCE:
    
    Senior Software Engineer | Tech Company Inc. | 2020 - Present
    - Led development of a microservices architecture serving 1M+ users
    - Implemented CI/CD pipelines reducing deployment time by 60%
    - Mentored junior developers and conducted code reviews
    - Proficient in agile methodologies and scrum practices
    
    Software Engineer | Startup XYZ | 2016 - 2020
    - Built React-based dashboard with real-time data visualization
    - Developed RESTful APIs using Node.js and Express
    - Integrated third-party payment systems and OAuth authentication
    - Experience with machine learning models for recommendation systems
    
    EDUCATION:
    B.S. Computer Science, MIT, 2016
  `,

  dataScientist: `
    Data Scientist | Machine Learning Engineer
    
    5 years of experience in data science and machine learning, specializing in 
    natural language processing and computer vision applications.
    
    Technical Skills:
    • Python, R, SQL
    • TensorFlow, PyTorch, Scikit-learn
    • Pandas, NumPy, Matplotlib, Seaborn
    • NLP: BERT, GPT, Transformers, SpaCy
    • Computer Vision: OpenCV, YOLO, ResNet
    • Cloud: AWS SageMaker, Google Cloud AI Platform
    • Data Engineering: Spark, Airflow, dbt
    
    Professional Experience:
    
    Lead Data Scientist @ AI Startup (2021-Present)
    - Developed production ML pipelines processing 10TB+ daily
    - Built NLP models achieving 95% accuracy on sentiment analysis
    - Expertise in deep learning architectures and neural networks
    - Strong analytical and problem-solving skills
    
    Data Scientist @ Analytics Corp (2019-2021)
    - Created predictive models for customer churn with 85% accuracy
    - Implemented A/B testing frameworks
    - Proficient in statistical analysis and hypothesis testing
  `,

  productManager: `
    Product Manager with expertise in B2B SaaS products
    
    8 years of experience driving product strategy and execution for enterprise software.
    
    Core Competencies:
    - Product Strategy & Roadmap Planning
    - Agile/Scrum Methodologies
    - User Research & Customer Discovery
    - Data-Driven Decision Making
    - Cross-functional Team Leadership
    - Stakeholder Management
    
    Tools: Jira, Confluence, Figma, Amplitude, Mixpanel, SQL
    
    Experience:
    
    Senior Product Manager | Enterprise SaaS | 2020-Present
    - Launched 3 major product features generating $5M ARR
    - Led agile ceremonies for team of 12 engineers and designers
    - Conducted user interviews and usability testing
    - Strong communication and presentation skills
    
    Product Manager | FinTech Startup | 2016-2020
    - Owned product backlog and prioritization
    - Defined KPIs and success metrics
    - Collaborated with engineering, design, and sales teams
  `,
};

async function testLocalExtraction() {
  console.log('🧪 Testing Local AI Skill Extraction\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Dynamically import to ensure env vars are loaded
  const { extractSkillsLocal } = await import('../src/lib/ai/local-skill-extractor');

  for (const [profileType, cvText] of Object.entries(SAMPLE_CVS)) {
    console.log(`📄 Testing: ${profileType}`);
    console.log('───────────────────────────────────────────────────────────────\n');

    try {
      const startTime = Date.now();
      const result = await extractSkillsLocal(cvText, 'cv');
      const elapsed = Date.now() - startTime;

      console.log(`✅ Extraction completed in ${elapsed}ms`);
      console.log(`📊 Skills found: ${result.skills.length}`);
      console.log(`📝 Summary: ${result.summary}`);

      if (result.totalExperienceYears) {
        console.log(`⏱️  Total experience: ${result.totalExperienceYears} years`);
      }

      if (result.roles && result.roles.length > 0) {
        console.log(`👤 Roles detected: ${result.roles.join(', ')}`);
      }

      if (result.industries && result.industries.length > 0) {
        console.log(`🏢 Industries: ${result.industries.join(', ')}`);
      }

      console.log('\n📋 Top 10 Skills:');
      console.log('─────────────────────────────────────────');

      result.skills.slice(0, 10).forEach((skill, index) => {
        const confidence = (skill.confidence * 100).toFixed(0);
        const matchType = skill.matchType;
        const taxonomyBadge = skill.taxonomyCode ? '✓' : '○';

        console.log(
          `  ${index + 1}. ${taxonomyBadge} ${skill.skillName.padEnd(25)} ` +
            `[${confidence}%] [${matchType}]` +
            (skill.yearsExperience ? ` (${skill.yearsExperience}y)` : '')
        );
      });

      console.log('\n');
    } catch (error) {
      console.error(`❌ Error testing ${profileType}:`, error);
      console.log('\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Testing complete!\n');
  console.log('Legend:');
  console.log('  ✓ = Matched to taxonomy');
  console.log('  ○ = Not in taxonomy (but detected)');
  console.log('  [pattern] = Found via NLP pattern matching');
  console.log('  [semantic] = Found via embedding similarity');
  console.log('  [hybrid] = Found via both methods');
}

// Run the test
testLocalExtraction()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
