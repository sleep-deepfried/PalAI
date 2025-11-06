// Parse and validate the AI response for treatment data
const input = $input.item.json;

// Debug: Log input structure
console.log('=== VALIDATE RESPONSE DEBUG ===');
console.log('Keys in input:', Object.keys(input));

// Handle different response structures
let responseText = '';

// Check if response has output property (common with AI Agent)
if (input.output) {
  responseText = typeof input.output === 'string' ? input.output : JSON.stringify(input.output);
  console.log('Source: input.output (type:', typeof input.output, ')');
} else if (input.text) {
  responseText = input.text;
  console.log('Source: input.text');
} else if (typeof input === 'string') {
  responseText = input;
  console.log('Source: input as string');
} else {
  responseText = JSON.stringify(input);
  console.log('Source: stringified input');
}

console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
console.log('Raw response length:', responseText.length);

// Remove markdown code blocks if present (robust handling)
let cleanText = responseText.trim();

// AGGRESSIVE markdown removal - handle all variations
// Remove ```json\n...\n``` pattern
cleanText = cleanText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
console.log('After removing ```json markers, starts with:', cleanText.substring(0, 50));

// Remove any remaining ``` markers
cleanText = cleanText.replace(/^```\s*/i, '').replace(/\s*```$/, '');
console.log('After removing ``` markers, starts with:', cleanText.substring(0, 50));

// Remove any "json" word at the start
cleanText = cleanText.replace(/^json\s*/i, '');
console.log('After removing "json" word, starts with:', cleanText.substring(0, 50));

// Remove any leading/trailing non-JSON characters
const jsonStart = cleanText.indexOf('{');
const jsonEnd = cleanText.lastIndexOf('}');
if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
  console.log(`✓ Extracting JSON from position ${jsonStart} to ${jsonEnd}`);
  cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
}

console.log('Clean text (first 500 chars):', cleanText.substring(0, 500));
console.log('Clean text (last 100 chars):', cleanText.substring(Math.max(0, cleanText.length - 100)));

// Helper function to attempt JSON repair
function tryParseJSON(text) {
  // Try 1: Parse as-is
  try {
    return JSON.parse(text);
  } catch (e1) {
    console.log('❌ Attempt 1 failed:', e1.message);
    
    // Try 2: Fix common issues - replace smart quotes with regular quotes
    try {
      let fixed = text
        .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
        .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
        .replace(/[\u2013\u2014]/g, '-'); // Em/en dashes
      console.log('🔧 Attempt 2: Trying with smart quotes replaced...');
      return JSON.parse(fixed);
    } catch (e2) {
      console.log('❌ Attempt 2 failed:', e2.message);
      
      // Try 3: Fix duplicate braces ([\n{ or {\n{ patterns)
      try {
        let fixed = text
          .replace(/\[\s*{\s*\n\s*{/g, '[{')  // Fix [{\n{ → [{
          .replace(/{\s*\n\s*{/g, '{')         // Fix {\n{ → {
          .replace(/}\s*\n\s*}/g, '}');        // Fix }\n} → }
        console.log('🔧 Attempt 3: Trying with duplicate braces removed...');
        return JSON.parse(fixed);
      } catch (e3) {
        console.log('❌ Attempt 3 failed:', e3.message);
        
      // Try 4: Fix missing commas between array elements (}\n{) or (}\n\s*{)
      try {
        let fixed = text
          .replace(/}\s*\n\s*{/g, '},\n{')  // Add commas between objects
          .replace(/}\s+{/g, '}, {');        // Add commas between objects (spaces)
        console.log('🔧 Attempt 4: Trying with missing commas fixed...');
        return JSON.parse(fixed);
      } catch (e4) {
        console.log('❌ Attempt 4 failed:', e4.message);
        
        // Try 5: Combination - fix braces, quotes, and commas
        try {
          let fixed = text
            .replace(/\[\s*{\s*\n\s*{/g, '[{')  // Fix duplicate braces
            .replace(/{\s*\n\s*{/g, '{')
            .replace(/}\s*\n\s*}/g, '}')
            .replace(/[\u201C\u201D]/g, '"')      // Fix smart quotes
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/}\s*\n\s*{/g, '},\n{')     // Fix missing commas
            .replace(/}\s+{/g, '}, {');
          console.log('🔧 Attempt 5: Trying with combined fixes (braces + quotes + commas)...');
          return JSON.parse(fixed);
        } catch (e5) {
          console.log('❌ Attempt 5 failed:', e5.message);
          
          // Try 6: Fix newlines in strings
          try {
            let fixed = text.replace(/([^\\])"([^"]*)\n([^"]*)"([^\\])/g, '$1"$2\\n$3"$4');
            console.log('🔧 Attempt 6: Trying with newlines escaped...');
            return JSON.parse(fixed);
          } catch (e6) {
            console.log('❌ All 6 attempts failed!');
            
            // Show detailed error context for the ORIGINAL error
            const errorPos = parseInt(e1.message.match(/position (\d+)/)?.[1] || '0');
            if (errorPos > 0) {
              const start = Math.max(0, errorPos - 200);
              const end = Math.min(text.length, errorPos + 200);
              console.error('\n=== ERROR CONTEXT (±200 chars from position', errorPos, ') ===');
              const before = text.substring(start, errorPos);
              const after = text.substring(errorPos, end);
              console.error(before + '<<<ERROR HERE>>>' + after);
              console.error('\n=== CHARACTER AT ERROR ===');
              console.error('Character:', JSON.stringify(text.charAt(errorPos)));
              console.error('Char code:', text.charCodeAt(errorPos));
              console.error('Next 10 chars:', JSON.stringify(text.substring(errorPos, errorPos + 10)));
            }
            
            throw e1; // Throw original error
          }
        }
      }
      }
    }
  }
}

// Parse the JSON with repair attempts
let treatmentData;
try {
  treatmentData = tryParseJSON(cleanText);
  console.log('✓ JSON parsed successfully!');
  console.log('Keys in parsed data:', Object.keys(treatmentData));
} catch (e) {
  console.error('✗ All JSON parse attempts failed:', e.message);
  throw new Error(`Failed to parse JSON after multiple attempts: ${e.message}. Check browser console for details.`);
}

// Validate and normalize preventionSteps
if (!Array.isArray(treatmentData.preventionSteps)) {
  throw new Error('preventionSteps must be an array. Got: ' + typeof treatmentData.preventionSteps);
}

const preventionSteps = treatmentData.preventionSteps.map((step, index) => {
  if (!step.titleEn || !step.titleTl || !step.descriptionEn || !step.descriptionTl) {
    throw new Error(`Prevention step ${index + 1} missing required fields. Has: ${Object.keys(step).join(', ')}`);
  }
  return {
    step: step.step || (index + 1),
    titleEn: String(step.titleEn),
    titleTl: String(step.titleTl),
    descriptionEn: String(step.descriptionEn),
    descriptionTl: String(step.descriptionTl)
  };
});

console.log(`✓ Validated ${preventionSteps.length} prevention steps`);

// Validate and normalize treatmentSteps
if (!Array.isArray(treatmentData.treatmentSteps)) {
  throw new Error('treatmentSteps must be an array. Got: ' + typeof treatmentData.treatmentSteps);
}

const treatmentSteps = treatmentData.treatmentSteps.map((step, index) => {
  if (!step.titleEn || !step.titleTl || !step.descriptionEn || !step.descriptionTl) {
    throw new Error(`Treatment step ${index + 1} missing required fields. Has: ${Object.keys(step).join(', ')}`);
  }
  return {
    step: step.step || (index + 1),
    titleEn: String(step.titleEn),
    titleTl: String(step.titleTl),
    descriptionEn: String(step.descriptionEn),
    descriptionTl: String(step.descriptionTl)
  };
});

console.log(`✓ Validated ${treatmentSteps.length} treatment steps`);

// Validate and normalize sources
if (!Array.isArray(treatmentData.sources)) {
  throw new Error('sources must be an array. Got: ' + typeof treatmentData.sources);
}

const sources = treatmentData.sources.map((source, index) => {
  if (!source.title || !source.url) {
    throw new Error(`Source ${index + 1} missing required fields (title, url). Has: ${Object.keys(source).join(', ')}`);
  }
  // Basic URL validation
  if (!source.url.startsWith('http://') && !source.url.startsWith('https://')) {
    throw new Error(`Source ${index + 1} has invalid URL: ${source.url}`);
  }
  return {
    title: String(source.title),
    url: String(source.url)
  };
});

console.log(`✓ Validated ${sources.length} sources`);

// Validation checks
if (preventionSteps.length < 1 || preventionSteps.length > 10) {
  throw new Error(`Invalid number of prevention steps: ${preventionSteps.length}. Expected 1-10.`);
}

if (treatmentSteps.length < 1 || treatmentSteps.length > 10) {
  throw new Error(`Invalid number of treatment steps: ${treatmentSteps.length}. Expected 1-10.`);
}

if (sources.length < 1 || sources.length > 10) {
  throw new Error(`Invalid number of sources: ${sources.length}. Expected 1-10.`);
}

console.log('✓ All validations passed!');

// Return validated treatment data
return {
  preventionSteps: preventionSteps,
  treatmentSteps: treatmentSteps,
  sources: sources
};

