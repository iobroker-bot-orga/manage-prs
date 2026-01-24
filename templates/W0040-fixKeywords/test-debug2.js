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

console.log('Full property section:');
console.log(JSON.stringify(content.slice(arrayInfo.start, arrayInfo.end)));

// What comes after arrayEnd?
const afterArray = content.slice(arrayInfo.arrayEnd);
console.log('\nAfter arrayEnd:');
console.log(JSON.stringify(afterArray.slice(0, 20)));

// Check if there's a comma after the ]
const afterBracket = content.slice(arrayInfo.arrayEnd);
const commaMatch = afterBracket.match(/^\]\s*,/);
console.log('\nHas trailing comma:', !!commaMatch);
