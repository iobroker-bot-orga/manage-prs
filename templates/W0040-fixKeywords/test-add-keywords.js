const content = `{
  "name": "test-adapter",
  "version": "1.0.0",
  "description": "Test adapter",
  "author": "Test Author"
}
`;

const trimmedContent = content.trimEnd();
const lastBraceIndex = trimmedContent.lastIndexOf('}');

console.log('lastBraceIndex:', lastBraceIndex);
console.log('Content before brace:');
console.log(JSON.stringify(trimmedContent.slice(0, lastBraceIndex)));

const indentMatch = content.match(/\n(\s+)"/);
const indent = indentMatch ? indentMatch[1] : '  ';
console.log('\nIndent:', JSON.stringify(indent));

const beforeBrace = trimmedContent.slice(0, lastBraceIndex).trimEnd();
console.log('\nBefore brace (trimmed):', JSON.stringify(beforeBrace.slice(-50)));
console.log('Has trailing comma:', beforeBrace.endsWith(','));

// Find the last line
const contentBeforeBrace = trimmedContent.slice(0, lastBraceIndex);
const lastNewlineBeforeBrace = contentBeforeBrace.lastIndexOf('\n');
console.log('\nlastNewlineBeforeBrace:', lastNewlineBeforeBrace);

const lastLine = contentBeforeBrace.slice(lastNewlineBeforeBrace).trimEnd();
console.log('lastLine:', JSON.stringify(lastLine));
console.log('lastLine without indent:', JSON.stringify(lastLine.slice(indent.length)));
