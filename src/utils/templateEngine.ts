/**
 * Simple Template Engine for Pedro Pathing Visualizer
 * Supports:
 * - {{ variable }} placeholders (with dot notation)
 * - {% for item in collection %} loops (with loop.index, loop.first, loop.last)
 * - {% if condition %} blocks (truthy check, or equality/inequality)
 * - {% else %} blocks
 * - Comments aren't explicitly stripped but can be part of the text
 */

type Context = any;

interface Token {
  type: "text" | "expression" | "block_start" | "block_end" | "else";
  content: string;
}

export function renderTemplate(template: string, context: Context): string {
  try {
    const tokens = tokenize(template);
    return parseAndRender(tokens, context);
  } catch (e: any) {
    return `// Error rendering template: ${e.message}`;
  }
}

export function validateTemplate(template: string, context: Context): string[] {
  const errors: string[] = [];
  try {
    const tokens = tokenize(template);
    // Simple structural check
    let stack = 0;
    for (const token of tokens) {
      if (token.type === "block_start") {
        if (
          token.content.startsWith("for ") ||
          token.content.startsWith("if ")
        ) {
          stack++;
        }
      } else if (token.type === "block_end") {
        if (token.content === "endfor" || token.content === "endif") {
          stack--;
        }
      }
    }
    if (stack !== 0) {
      errors.push("Mismatched block tags (for/if/endfor/endif)");
    }

    // Try rendering to catch runtime errors (e.g. missing variables)
    // Note: This requires the context to be fully populated or mocked.
    // If context is real, this is a good check.
    try {
      parseAndRender(tokens, context);
    } catch (e: any) {
      errors.push(e.message);
    }
  } catch (e: any) {
    errors.push(e.message);
  }
  return errors;
}

function tokenize(template: string): Token[] {
  const tokens: Token[] = [];
  // Split by tags: {{ ... }} or {% ... %}
  // The regex captures the delimiters and content
  // Group 1: {{ ... }} content
  // Group 2: {% ... %} content
  const regex = /{{(.*?)}}|{%(.*?)%}/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(template)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: template.substring(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Expression {{ ... }}
      tokens.push({
        type: "expression",
        content: match[1].trim(),
      });
    } else if (match[2] !== undefined) {
      // Block {% ... %}
      const content = match[2].trim();
      if (content.startsWith("for ") || content.startsWith("if ")) {
        tokens.push({
          type: "block_start",
          content: content,
        });
      } else if (content === "endfor" || content === "endif") {
        tokens.push({
          type: "block_end",
          content: content,
        });
      } else if (content === "else") {
        tokens.push({
          type: "else",
          content: content,
        });
      } else {
        // Unknown block, treat as text or ignore?
        // Let's treat as text to be safe, or throw error.
        // For now, ignore invalid blocks or keep as is?
        // Better to treat as text if it's not a known command
        // But the user intended a block.
        throw new Error(`Unknown block tag: ${content}`);
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < template.length) {
    tokens.push({
      type: "text",
      content: template.substring(lastIndex),
    });
  }

  return tokens;
}

function parseAndRender(tokens: Token[], context: Context): string {
  let output = "";
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "text") {
      output += token.content;
      i++;
    } else if (token.type === "expression") {
      output += evaluateExpression(token.content, context);
      i++;
    } else if (token.type === "block_start") {
      // Handle Blocks
      const blockContent = token.content;
      if (blockContent.startsWith("for ")) {
        // {% for item in collection %}
        const match = blockContent.match(/^for\s+(\w+)\s+in\s+(.+)$/);
        if (!match) throw new Error(`Invalid for loop syntax: ${blockContent}`);
        const itemName = match[1];
        const collectionPath = match[2];

        // Find the matching endfor
        let stack = 1;
        let j = i + 1;
        let loopTokens: Token[] = [];
        while (j < tokens.length) {
          if (
            tokens[j].type === "block_start" &&
            tokens[j].content.startsWith("for ")
          ) {
            stack++;
          } else if (
            tokens[j].type === "block_end" &&
            tokens[j].content === "endfor"
          ) {
            stack--;
            if (stack === 0) break;
          }
          loopTokens.push(tokens[j]);
          j++;
        }

        if (stack !== 0) throw new Error("Missing endfor");

        // Execute Loop
        const collection = getValue(collectionPath, context);
        if (Array.isArray(collection)) {
          collection.forEach((item, index) => {
            const loopContext = {
              ...context,
              [itemName]: item,
              loop: {
                index: index,
                index1: index + 1,
                first: index === 0,
                last: index === collection.length - 1,
                length: collection.length,
              },
            };
            output += parseAndRender(loopTokens, loopContext);
          });
        }

        i = j + 1; // Move past endfor
      } else if (blockContent.startsWith("if ")) {
        // {% if condition %}
        const condition = blockContent.substring(3).trim();

        // Find matching endif or else
        let stack = 1;
        let j = i + 1;
        let trueBlock: Token[] = [];
        let falseBlock: Token[] = [];
        let inElse = false;

        while (j < tokens.length) {
          if (
            tokens[j].type === "block_start" &&
            tokens[j].content.startsWith("if ")
          ) {
            stack++;
            if (inElse) falseBlock.push(tokens[j]);
            else trueBlock.push(tokens[j]);
          } else if (
            tokens[j].type === "block_end" &&
            tokens[j].content === "endif"
          ) {
            stack--;
            if (stack === 0) break;
            if (inElse) falseBlock.push(tokens[j]);
            else trueBlock.push(tokens[j]);
          } else if (tokens[j].type === "else" && stack === 1) {
            inElse = true;
          } else {
            if (inElse) falseBlock.push(tokens[j]);
            else trueBlock.push(tokens[j]);
          }
          j++;
        }

        if (stack !== 0) throw new Error("Missing endif");

        if (evaluateCondition(condition, context)) {
          output += parseAndRender(trueBlock, context);
        } else if (falseBlock.length > 0) {
          output += parseAndRender(falseBlock, context);
        }

        i = j + 1; // Move past endif
      } else {
        throw new Error(`Unknown block: ${blockContent}`);
      }
    } else if (token.type === "block_end" || token.type === "else") {
      // Should not be encountered at top level if parsed correctly in blocks
      // But if we have loose block ends, ignore or error
      // Let's ignore for robustness if it happens, but technically it's a syntax error
      i++;
    } else {
      i++;
    }
  }

  return output;
}

function getValue(path: string, context: Context): any {
  // Handle array access [0]
  // regex to split by . but keep [index] attached to property or separate?
  // Let's support simple property.access and property[index]

  // Quick and dirty: replace [x] with .x
  const normalizedPath = path.replace(/\[(\w+)\]/g, ".$1");
  const parts = normalizedPath.split(".");

  let current = context;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function evaluateExpression(expr: string, context: Context): string {
  // Basic math support? Or just variable access?
  // Let's support simple math: loop.index + 1
  // And string literals?

  try {
    // Check for simple arithmetic: var + number
    if (expr.includes("+")) {
      const [left, right] = expr.split("+").map((s) => s.trim());
      const leftVal = getValueOrLiteral(left, context);
      const rightVal = getValueOrLiteral(right, context);
      return String(leftVal + rightVal);
    }

    const val = getValue(expr, context);
    if (val === undefined) {
      // throw new Error(`Variable not found: ${expr}`);
      return "undefined"; // Or empty string?
    }
    return String(val);
  } catch (e) {
    return `{{Error: ${expr}}}`;
  }
}

function getValueOrLiteral(str: string, context: Context): any {
  if (!isNaN(Number(str))) return Number(str);
  if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
  return getValue(str, context);
}

function evaluateCondition(condition: string, context: Context): boolean {
  // Support ==, !=
  if (condition.includes("==")) {
    const [left, right] = condition.split("==").map((s) => s.trim());
    const leftVal = getValueOrLiteral(left, context);
    const rightVal = getValueOrLiteral(right, context);
    return leftVal == rightVal;
  }
  if (condition.includes("!=")) {
    const [left, right] = condition.split("!=").map((s) => s.trim());
    const leftVal = getValueOrLiteral(left, context);
    const rightVal = getValueOrLiteral(right, context);
    return leftVal != rightVal;
  }

  // Truthy check
  return !!getValue(condition, context);
}
