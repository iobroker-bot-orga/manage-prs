const fs = require('node:fs');

const content = fs.readFileSync('/tmp/test-w0040-fixkeywords/package.json', 'utf8');

function findKeywordsArray(content, keyPath) {
    const keys = keyPath.split('.');
    let searchContent = content;
    let baseOffset = 0;
    
    // Navigate through nested objects if needed
    for (let i = 0; i < keys.length - 1; i++) {
        const keyPattern = new RegExp(`"${keys[i]}"\\s*:\\s*\\{`);
        const match = searchContent.match(keyPattern);
        if (!match) return null;
        
        const sectionStart = match.index + match[0].length;
        baseOffset += sectionStart;
        searchContent = searchContent.slice(sectionStart);
    }
    
    // Find the keywords array
    const lastKey = keys[keys.length - 1];
    const keywordsPattern = new RegExp(`(\\s*)"${lastKey}"\\s*:\\s*\\[`);
    const match = searchContent.match(keywordsPattern);
    
    if (!match) return null;
    
    const indentation = match[1];
    const start = baseOffset + match.index;
    const arrayStart = baseOffset + match.index + match[0].length;
    
    // Find the end of the array
    let braceCount = 1;
    let i = arrayStart - baseOffset;
    let inString = false;
    let escapeNext = false;
    
    while (i < searchContent.length && braceCount > 0) {
        const char = searchContent[i];
        
        if (escapeNext) {
            escapeNext = false;
            i++;
            continue;
        }
        
        if (char === '\\' && inString) {
            escapeNext = true;
            i++;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
        } else if (!inString) {
            if (char === '[') braceCount++;
            if (char === ']') {
                braceCount--;
                if (braceCount === 0) {
                    const arrayEnd = baseOffset + i;
                    // Find the end of the line (including trailing comma if present)
                    let lineEnd = arrayEnd + 1;
                    while (lineEnd < content.length && content[lineEnd] !== '\n') {
                        lineEnd++;
                    }
                    if (lineEnd < content.length && content[lineEnd] === '\n') {
                        lineEnd++;
                    }
                    
                    return {
                        start,
                        end: lineEnd,
                        arrayStart,
                        arrayEnd,
                        indentation
                    };
                }
            }
        }
        i++;
    }
    
    return null;
}

const arrayInfo = findKeywordsArray(content, 'keywords');
console.log('arrayInfo:', arrayInfo);
console.log('start to arrayStart:', JSON.stringify(content.slice(arrayInfo.start, arrayInfo.arrayStart)));
console.log('arrayStart to arrayEnd:', JSON.stringify(content.slice(arrayInfo.arrayStart, arrayInfo.arrayEnd)));
console.log('arrayEnd to end:', JSON.stringify(content.slice(arrayInfo.arrayEnd, arrayInfo.end)));
console.log('After end:', JSON.stringify(content.slice(arrayInfo.end, arrayInfo.end + 50)));
