module.exports = {
  // General formatting
  printWidth: 100,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // HTML/CSS specific
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
  
  // Override for specific file types
  overrides: [
    {
      files: '*.html',
      options: {
        tabWidth: 2,
        printWidth: 120
      }
    },
    {
      files: '*.css',
      options: {
        tabWidth: 2,
        printWidth: 120
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    }
  ]
};