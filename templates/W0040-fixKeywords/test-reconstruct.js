const content = `{
  "name": "test-adapter",
  "version": "1.0.0",
  "description": "Test adapter",
  "keywords": [
    "iobroker",
    "test",
    "adapter"
  ],
  "author": "Test Author"
}
`;

const arrayInfo = {
  start: 82,
  end: 146,
  arrayStart: 98,
  arrayEnd: 143,
  indentation: '\n  '
};

const newKeywords = ['ioBroker', 'test', 'adapter'];

function formatKeywordsArray(keywords, baseIndent, sampleContent) {
    if (keywords.length === 0) {
        return '[]';
    }
    
    // Detect indentation style from sample content
    let itemIndent = '    '; // default to 4 spaces
    
    // Try to detect existing indentation in the array
    const indentMatch = sampleContent.match(/\[\s*\n(\s+)"/);
    if (indentMatch) {
        const detectedIndent = indentMatch[1];
        // Calculate the additional indentation for array items
        itemIndent = detectedIndent.replace(baseIndent, '');
    }
    
    const lines = [
        '[',
        ...keywords.map((kw, idx) => {
            const comma = idx < keywords.length - 1 ? ',' : '';
            return `${baseIndent}${itemIndent}"${kw}"${comma}`;
        }),
        `${baseIndent}]`
    ];
    
    return lines.join('\n');
}

const arrayContent = content.slice(arrayInfo.arrayStart, arrayInfo.arrayEnd);
console.log('arrayContent:', JSON.stringify(arrayContent));

const formattedArray = formatKeywordsArray(newKeywords, arrayInfo.indentation, arrayContent);
console.log('\nformatted Array:');
console.log(JSON.stringify(formattedArray));

// Get what comes after the closing bracket
const afterBracket = content.slice(arrayInfo.arrayEnd);
console.log('\nafterBracket:', JSON.stringify(afterBracket.slice(0, 10)));

const trailingMatch = afterBracket.match(/^(\]\s*,?\s*\n)/);
console.log('trailingMatch:', trailingMatch);
const trailing = trailingMatch ? trailingMatch[1] : ']';
console.log('trailing:', JSON.stringify(trailing));

// Replace from start of property definition to end of array content
const beforeProperty = content.slice(0, arrayInfo.start);
const afterProperty = content.slice(arrayInfo.end);

// Get the property name and opening part
const propertyPrefix = content.slice(arrayInfo.start, arrayInfo.arrayStart);
console.log('\npropertyPrefix:', JSON.stringify(propertyPrefix));

const newContent = beforeProperty + propertyPrefix + formattedArray.slice(1) + trailing + afterProperty;

console.log('\n=== NEW CONTENT ===');
console.log(newContent);

try {
    JSON.parse(newContent);
    console.log('\n✔️ Valid JSON');
} catch (error) {
    console.log('\n❌ Invalid JSON:', error.message);
}
