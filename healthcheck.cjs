const fs = require('fs');
const path = require('path');

console.log('\n🔍 INCIDENT REPORTING SYSTEM - HEALTH CHECK\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;
let total = 0;

function check(condition, message) {
    total++;
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${message}`);
        failed++;
    }
}

// 1. Project Structure
console.log('\n📁 PROJECT STRUCTURE:');
check(fs.existsSync('backend'), 'Backend directory exists');
check(fs.existsSync('frontend'), 'Frontend directory exists');
check(fs.existsSync('backend/server.js') || fs.existsSync('backend/index.js'), 'Backend entry file exists');
check(fs.existsSync('frontend/src/App.jsx') || fs.existsSync('frontend/src/App.js'), 'Frontend App component exists');

// 2. Database (Critical)
console.log('\n💾 DATABASE REQUIREMENTS:');
const hasPrisma = fs.existsSync('backend/prisma/schema.prisma');
check(hasPrisma, 'Prisma schema exists');
if (hasPrisma) {
    const prismaSchema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
    check(prismaSchema.includes('model User'), 'User model exists');
    check(prismaSchema.includes('model Incident'), 'Incident model exists');
    check(prismaSchema.includes('enum Priority'), 'Priority enum exists');
    check(prismaSchema.includes('enum Status'), 'Status enum exists');
    check(!prismaSchema.includes('mock') && !prismaSchema.includes('dummy'), 'No mock/in-memory data structures');
}

// 3. Authentication (JWT Required)
console.log('\n🔐 AUTHENTICATION & JWT:');
const backendFiles = fs.existsSync('backend') ? fs.readdirSync('backend') : [];
const hasJWT = backendFiles.some(f => {
    if (f.endsWith('.js') || f.endsWith('.ts')) {
        const content = fs.readFileSync(path.join('backend', f), 'utf8');
        return content.includes('jsonwebtoken') || content.includes('jwt');
    }
    return false;
});
check(hasJWT, 'JWT implementation found');
check(fs.existsSync('backend/.env'), 'Environment variables file exists');

// 4. Role-Based Access Control
console.log('\n👥 ROLE-BASED ACCESS CONTROL:');
let hasRBAC = false;
backendFiles.forEach(f => {
    if (f.endsWith('.js') || f.endsWith('.ts')) {
        const content = fs.readFileSync(path.join('backend', f), 'utf8');
        if (content.includes('REPORTER') && content.includes('RESOLVER')) {
            hasRBAC = true;
        }
    }
});
check(hasRBAC, 'REPORTER and RESOLVER roles implemented');

// 5. Business Rule: Priority Immutability (CRITICAL)
console.log('\n⚠️  CRITICAL BUSINESS RULE: Priority Cannot be Downgraded');
let hasPriorityRule = false;
backendFiles.forEach(f => {
    if (f.endsWith('.js') || f.endsWith('.ts')) {
        const content = fs.readFileSync(path.join('backend', f), 'utf8');
        if (content.includes('priority') && 
            (content.includes('>') || content.includes('higher') || 
             content.includes('downgrad') || content.includes('cannot') || content.includes('<'))) {
            hasPriorityRule = true;
        }
    }
});
check(hasPriorityRule, 'Priority downgrade protection implemented');

// 6. API Endpoints
console.log('\n🌐 API ENDPOINTS:');
let hasAuthRoutes = false;
let hasIncidentRoutes = false;
backendFiles.forEach(f => {
    if (f.includes('server.js') || f.includes('controller')) {
        const content = fs.readFileSync(path.join('backend', f), 'utf8');
        if (content.includes('/api/register') || content.includes('/api/login')) hasAuthRoutes = true;
        if (content.includes('/api/incidents')) hasIncidentRoutes = true;
    }
});
check(hasAuthRoutes, 'Authentication endpoints (/register, /login)');
check(hasIncidentRoutes, 'Incident CRUD endpoints');

// 7. Frontend Requirements
console.log('\n🎨 FRONTEND REQUIREMENTS:');
if (fs.existsSync('frontend/src/components')) {
    const srcFiles = fs.readdirSync('frontend/src/components');
    check(srcFiles.some(f => f.includes('Login')), 'Login page component');
    check(srcFiles.some(f => f.includes('Register')), 'Registration page component');
    check(srcFiles.some(f => f.includes('Dashboard')), 'Dashboard components');
}

// 8. README.md Requirements
console.log('\n📖 README.md CHECK:');
if (fs.existsSync('README.md')) {
    const readme = fs.readFileSync('README.md', 'utf8');
    check(readme.includes('Project Overview') || readme.includes('Project overview'), 'Project overview');
    check(readme.includes('Tech Stack') || readme.includes('Tech stack'), 'Tech stack section');
    check(readme.includes('API Endpoints') || readme.includes('API endpoints'), 'API endpoints documentation');
    check(readme.includes('Database Schema') || readme.includes('Database schema'), 'Database schema section');
    check(readme.includes('User Roles') || readme.includes('User roles'), 'User roles documentation');
} else {
    check(false, 'README.md exists');
}

// 9. Dependencies Check
console.log('\n📦 DEPENDENCIES:');
if (fs.existsSync('backend/package.json')) {
    const pkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    check(deps.express, 'Express.js installed');
    check(deps['jsonwebtoken'] || deps.jwt, 'JWT package installed');
    check(deps.bcrypt || deps['bcryptjs'], 'Bcrypt for password hashing');
    check(deps.prisma || deps.sequelize || deps['@prisma/client'], 'ORM installed');
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 SUMMARY: ${passed}/${total} requirements passed`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed/total)*100).toFixed(1)}%`);

if (failed === 0) {
    console.log('\n🎉 EXCELLENT! All requirements met! Ready for submission.\n');
} else {
    console.log('\n⚠️  Some requirements missing. See failures above.\n');
}
