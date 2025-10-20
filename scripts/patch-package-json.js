#!/usr/bin/env node

/**
 * 🔧 Package.json Patcher for APAAI Migration
 * Updates package.json files to migrate from TRACE to APAAI Protocol
 * Usage: node scripts/patch-package-json.js <package.json-path>
 */

const fs = require('fs');
const path = require('path');

function patchPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    let modified = false;
    
    // Update package name
    if (pkg.name) {
      if (pkg.name === 'apaai-protocol') {
        pkg.name = 'apaai-protocol';
        modified = true;
      } else if (pkg.name === '@apaai-protocol/client') {
        pkg.name = '@apaai/client';
        modified = true;
      } else if (pkg.name === 'trace-server') {
        pkg.name = 'apaai-server';
        modified = true;
      } else if (pkg.name.includes('trace')) {
        pkg.name = pkg.name.replace(/trace/g, 'apaai');
        modified = true;
      }
    }
    
    // Update description
    if (pkg.description && pkg.description.includes('TRACE')) {
      pkg.description = pkg.description
        .replace(/TRACE Protocol/g, 'APAAI Protocol')
        .replace(/TRACE Labs/g, 'apaAI Labs');
      modified = true;
    }
    
    // Update keywords
    if (pkg.keywords && Array.isArray(pkg.keywords)) {
      pkg.keywords = pkg.keywords.map(keyword => {
        if (typeof keyword === 'string') {
          return keyword.replace(/trace/g, 'apaai');
        }
        return keyword;
      });
      modified = true;
    }
    
    // Update homepage
    if (pkg.homepage && pkg.homepage.includes('apaai.org')) {
      pkg.homepage = pkg.homepage.replace(/apaai\.org/g, 'apaaiprotocol.org');
      modified = true;
    }
    
    // Update repository
    if (pkg.repository) {
      if (typeof pkg.repository === 'string') {
        if (pkg.repository.includes('apaai-protocol')) {
          pkg.repository = pkg.repository.replace(/apaai-protocol/g, 'apaai-protocol');
          modified = true;
        }
      } else if (pkg.repository.url && pkg.repository.url.includes('apaai-protocol')) {
        pkg.repository.url = pkg.repository.url.replace(/apaai-protocol/g, 'apaai-protocol');
        modified = true;
      }
    }
    
    // Update author information
    if (pkg.author) {
      if (typeof pkg.author === 'string' && pkg.author.includes('TRACE Labs')) {
        pkg.author = pkg.author.replace(/TRACE Labs/g, 'apaAI Labs');
        modified = true;
      } else if (pkg.author.name && pkg.author.name.includes('TRACE Labs')) {
        pkg.author.name = pkg.author.name.replace(/TRACE Labs/g, 'apaAI Labs');
        modified = true;
      }
    }
    
    // Update authors array
    if (pkg.authors && Array.isArray(pkg.authors)) {
      pkg.authors = pkg.authors.map(author => {
        if (typeof author === 'string') {
          return author.replace(/TRACE Labs/g, 'apaAI Labs');
        } else if (author.name) {
          author.name = author.name.replace(/TRACE Labs/g, 'apaAI Labs');
        }
        return author;
      });
      modified = true;
    }
    
    // Update dependencies that reference trace packages
    if (pkg.dependencies) {
      Object.keys(pkg.dependencies).forEach(dep => {
        if (dep.includes('trace')) {
          const newDep = dep.replace(/trace/g, 'apaai');
          pkg.dependencies[newDep] = pkg.dependencies[dep];
          delete pkg.dependencies[dep];
          modified = true;
        }
      });
    }
    
    // Update devDependencies that reference trace packages
    if (pkg.devDependencies) {
      Object.keys(pkg.devDependencies).forEach(dep => {
        if (dep.includes('trace')) {
          const newDep = dep.replace(/trace/g, 'apaai');
          pkg.devDependencies[newDep] = pkg.devDependencies[dep];
          delete pkg.devDependencies[dep];
          modified = true;
        }
      });
    }
    
    // Update scripts that reference trace
    if (pkg.scripts) {
      Object.keys(pkg.scripts).forEach(scriptName => {
        if (pkg.scripts[scriptName].includes('trace')) {
          pkg.scripts[scriptName] = pkg.scripts[scriptName].replace(/trace/g, 'apaai');
          modified = true;
        }
      });
    }
    
    // Write back if modified
    if (modified) {
      const updatedContent = JSON.stringify(pkg, null, 2) + '\n';
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: node scripts/patch-package-json.js <package.json-path>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

patchPackageJson(filePath);
