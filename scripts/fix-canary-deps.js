const fs = require('fs');
const path = require('path');

function findPackageJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findPackageJsonFiles(filePath, fileList);
    } else if (file === 'package.json') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function removeCaretFromDeps(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let modified = false;

  ['dependencies', 'peerDependencies', 'devDependencies'].forEach((depType) => {
    if (pkg[depType]) {
      Object.keys(pkg[depType]).forEach((dep) => {
        if (typeof pkg[depType][dep] === 'string' && pkg[depType][dep].startsWith('^')) {
          pkg[depType][dep] = pkg[depType][dep].substring(1);
          modified = true;
        }
      });
    }
  });

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${pkgPath}`);
  }
}

function main() {
  const distDir = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    console.error(`Error: dist directory not found at ${distDir}`);
    process.exit(1);
  }

  const packageJsonFiles = findPackageJsonFiles(distDir);

  if (packageJsonFiles.length === 0) {
    console.warn('Warning: No package.json files found in dist directory');
    return;
  }

  packageJsonFiles.forEach(removeCaretFromDeps);
  console.log(`Processed ${packageJsonFiles.length} package.json file(s)`);
}

main();
