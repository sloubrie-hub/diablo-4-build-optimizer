const fs = require("fs");

function evaluateFormulaGraphsFile(filePath, options = {}) {
  const graphs = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return evaluateFormulaGraphs(graphs, options);
}

function evaluateCanonicalVariablesFile(filePath, options = {}) {
  const canonicalExport = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return evaluateCanonicalVariables(canonicalExport, options);
}

function buildCanonicalContextTemplateFile(filePath) {
  const canonicalExport = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return buildCanonicalContextTemplate(canonicalExport);
}

function evaluateFormulaGraphs(graphExport, options = {}) {
  const context = buildDefaultContext(options.context ?? {});
  const maxGraphs = options.maxGraphs ?? graphExport.graphs.length;
  const results = [];
  const errors = [];

  for (const graph of graphExport.graphs.slice(0, maxGraphs)) {
    const graphResult = {
      assetId: graph.assetId,
      source: graph.source,
      tags: graph.tags,
      nodes: [],
    };

    for (const node of graph.nodes) {
      try {
        const ast = parseFormula(node.expression);
        const value = evaluateAst(ast, context);
        graphResult.nodes.push({
          id: node.id,
          offset: node.offset,
          expression: node.expression,
          value,
          ast,
          status: "ok",
        });
      } catch (error) {
        const failure = {
          id: node.id,
          offset: node.offset,
          expression: node.expression,
          status: "error",
          error: error.message,
        };
        graphResult.nodes.push(failure);
        errors.push({
          assetId: graph.assetId,
          nodeId: node.id,
          expression: node.expression,
          error: error.message,
        });
      }
    }

    if (graphResult.nodes.length) results.push(graphResult);
  }

  const okNodes = results.flatMap((result) => result.nodes).filter((node) => node.status === "ok");
  const errorNodes = results.flatMap((result) => result.nodes).filter((node) => node.status === "error");

  return {
    evaluatedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: graphExport.exportedAt,
      summary: graphExport.summary,
    },
    context,
    summary: {
      graphs: results.length,
      nodes: okNodes.length + errorNodes.length,
      ok: okNodes.length,
      errors: errorNodes.length,
      errorKinds: sortCounts(
        errors.reduce((counts, error) => {
          counts[error.error] = (counts[error.error] ?? 0) + 1;
          return counts;
        }, {})
      ),
    },
    results,
    errors,
  };
}

function evaluateCanonicalVariables(canonicalExport, options = {}) {
  const variableBindings = buildCanonicalVariableBindings(canonicalExport.variables, options.values ?? {});
  const context = buildDefaultContext({
    ...(options.context ?? {}),
    variables: {
      ...(options.context?.variables ?? {}),
      ...variableBindings.variables,
    },
    refs: {
      ...(options.context?.refs ?? {}),
      ...variableBindings.variables,
    },
  });
  applyCanonicalTableValues(canonicalExport.variables, variableBindings.valuesByCanonicalId, context);
  const results = [];
  const errors = [];

  for (const asset of canonicalExport.assets) {
    const assetResult = {
      assetId: asset.assetId,
      source: asset.source,
      tags: asset.tags,
      formulas: [],
    };

    for (const formula of asset.formulas.filter((item) => item.canonicalRefs.length)) {
      const safeExpression = replaceCanonicalIdsWithSafeNames(formula.canonicalExpression, variableBindings.byCanonicalId);
      try {
        const ast = parseFormula(safeExpression);
        const value = evaluateAst(ast, context);
        assetResult.formulas.push({
          nodeId: formula.nodeId,
          offset: formula.offset,
          expression: formula.expression,
          canonicalExpression: formula.canonicalExpression,
          safeExpression,
          canonicalRefs: formula.canonicalRefs,
          value,
          status: "ok",
        });
      } catch (error) {
        const failure = {
          nodeId: formula.nodeId,
          offset: formula.offset,
          expression: formula.expression,
          canonicalExpression: formula.canonicalExpression,
          safeExpression,
          canonicalRefs: formula.canonicalRefs,
          status: "error",
          error: error.message,
        };
        assetResult.formulas.push(failure);
        errors.push({
          assetId: asset.assetId,
          nodeId: formula.nodeId,
          expression: formula.canonicalExpression,
          error: error.message,
        });
      }
    }

    if (assetResult.formulas.length) results.push(assetResult);
  }

  const formulas = results.flatMap((asset) => asset.formulas);
  const ok = formulas.filter((formula) => formula.status === "ok");
  const failed = formulas.filter((formula) => formula.status === "error");

  return {
    evaluatedAt: new Date().toISOString(),
    schemaVersion: 1,
    source: {
      exportedAt: canonicalExport.exportedAt,
      summary: canonicalExport.summary,
    },
    context: {
      canonicalVariableValues: variableBindings.valuesByCanonicalId,
      safeNameMap: variableBindings.safeNameMap,
      baseContext: context,
    },
    summary: {
      assets: results.length,
      formulas: formulas.length,
      ok: ok.length,
      errors: failed.length,
      variables: Object.keys(canonicalExport.variables ?? {}).length,
      errorKinds: sortCounts(
        errors.reduce((counts, error) => {
          counts[error.error] = (counts[error.error] ?? 0) + 1;
          return counts;
        }, {})
      ),
      topValues: ok
        .slice()
        .sort((a, b) => Math.abs(Number(b.value ?? 0)) - Math.abs(Number(a.value ?? 0)))
        .slice(0, 20)
        .map((formula) => ({
          assetId: results.find((asset) => asset.formulas.includes(formula))?.assetId ?? null,
          nodeId: formula.nodeId,
          value: formula.value,
          canonicalExpression: formula.canonicalExpression,
        })),
    },
    results,
    errors,
  };
}

function buildCanonicalContextTemplate(canonicalExport) {
  const bindings = buildCanonicalVariableBindings(canonicalExport.variables, {});
  const context = {
    variables: {
      sLevel: 100,
      Attacks_Per_Second_Total: 1.2,
      Bonus_Healing_Received_Percent: 0.1,
      Core_Stat_Bonus_Healing_Received_Percent: 0.05,
    },
    sf: buildSequentialSfContext(80),
    mods: {
      UpgradeA: false,
      UpgradeB: false,
      UpgradeC: false,
    },
    tables: {
      34: buildLinearTable(1, 100, 1),
      35: buildLinearTable(1, 100, 0.1),
    },
    missingValue: 0,
  };
  bindings.valuesByCanonicalId = materializeCanonicalTableValues(
    canonicalExport.variables,
    bindings.valuesByCanonicalId,
    buildDefaultContext(context)
  );
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      exportedAt: canonicalExport.exportedAt,
      summary: canonicalExport.summary,
    },
    note: "Edit canonicalValues to test rolls/build assumptions. Values here are placeholders, not confirmed Diablo IV values.",
    canonicalValues: bindings.valuesByCanonicalId,
    context,
  };
}

function buildSequentialSfContext(max) {
  const sf = {};
  for (let i = 0; i <= max; i += 1) sf[i] = i + 1;
  return sf;
}

function buildCanonicalVariableBindings(variables, overrides = {}) {
  const byCanonicalId = {};
  const safeNameMap = {};
  const valuesByCanonicalId = {};
  const variableValues = {};
  let index = 0;

  for (const canonicalId of Object.keys(variables ?? {}).sort()) {
    const safeName = `CREF_${String(index).padStart(3, "0")}`;
    const value = Object.prototype.hasOwnProperty.call(overrides, canonicalId)
      ? overrides[canonicalId]
      : placeholderValueForCanonicalVariable(variables[canonicalId], index);
    byCanonicalId[canonicalId] = safeName;
    safeNameMap[safeName] = canonicalId;
    valuesByCanonicalId[canonicalId] = value;
    variableValues[safeName] = value;
    index += 1;
  }

  return {
    byCanonicalId,
    safeNameMap,
    valuesByCanonicalId,
    variables: variableValues,
  };
}

function placeholderValueForCanonicalVariable(variable, index) {
  if (variable.kind === "affix-value") return 10 + index;
  if (variable.kind === "power-script-formula") return 1 + index / 10;
  if (variable.kind === "hash-ref") return 0.1 + index / 100;
  if (variable.kind === "table") return 1;
  if (variable.kind === "script-formula-local") return Number(variable.sfIndex ?? 0) + 1;
  return index + 1;
}

function materializeCanonicalTableValues(variables, values, context) {
  const nextValues = { ...values };
  for (const [canonicalId, variable] of Object.entries(variables ?? {})) {
    if (variable.kind !== "table") continue;
    const resolved = resolveCanonicalTableValue(canonicalId, context);
    if (Number.isFinite(resolved)) nextValues[canonicalId] = resolved;
  }
  return nextValues;
}

function applyCanonicalTableValues(variables, values, context) {
  for (const [canonicalId, variable] of Object.entries(variables ?? {})) {
    if (variable.kind !== "table") continue;
    if (!Object.prototype.hasOwnProperty.call(values, canonicalId)) continue;
    const parsed = parseCanonicalTableId(canonicalId);
    if (!parsed) continue;
    const row = resolveTableRow(parsed.rowKey, context);
    if (!Number.isFinite(row)) continue;
    const tableId = String(parsed.tableId);
    context.tables[tableId] = {
      ...(context.tables[tableId] ?? {}),
      [Math.round(row)]: values[canonicalId],
    };
  }
}

function resolveCanonicalTableValue(canonicalId, context) {
  const parsed = parseCanonicalTableId(canonicalId);
  if (!parsed) return null;
  const row = resolveTableRow(parsed.rowKey, context);
  if (!Number.isFinite(row)) return null;
  return context.tables[String(parsed.tableId)]?.[Math.round(row)] ?? context.missingValue;
}

function parseCanonicalTableId(canonicalId) {
  const match = String(canonicalId).match(/^table:([^:]+):(.+)$/);
  if (!match) return null;
  return {
    tableId: Number(match[1]),
    rowKey: match[2],
  };
}

function resolveTableRow(rowKey, context) {
  const numeric = Number(rowKey);
  if (Number.isFinite(numeric)) return numeric;
  return Number(context.variables?.[rowKey]);
}

function replaceCanonicalIdsWithSafeNames(expression, byCanonicalId) {
  let result = expression;
  const ids = Object.keys(byCanonicalId).sort((a, b) => b.length - a.length);
  for (const canonicalId of ids) {
    result = result.split(canonicalId).join(byCanonicalId[canonicalId]);
  }
  return result;
}

function buildDefaultContext(overrides = {}) {
  const sf = {};
  for (let i = 0; i <= 80; i += 1) {
    sf[i] = i + 1;
  }

  return {
    variables: {
      sLevel: 100,
      Attacks_Per_Second_Total: 1.2,
      Bonus_Healing_Received_Percent: 0.1,
      Core_Stat_Bonus_Healing_Received_Percent: 0.05,
      ...overrides.variables,
    },
    sf: {
      ...sf,
      ...overrides.sf,
    },
    mods: {
      UpgradeA: false,
      UpgradeB: false,
      UpgradeC: false,
      ...overrides.mods,
    },
    tables: {
      34: buildLinearTable(1, 100, 1),
      35: buildLinearTable(1, 100, 0.1),
      ...overrides.tables,
    },
    refs: {
      ...overrides.refs,
    },
    missingValue: overrides.missingValue ?? 0,
  };
}

function parseFormula(expression) {
  const parser = new Parser(tokenize(expression));
  const ast = parser.parseExpression();
  parser.expect("eof");
  return ast;
}

function evaluateFormula(expression, context = buildDefaultContext()) {
  return evaluateAst(parseFormula(expression), context);
}

function tokenize(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '"') {
      let end = index + 1;
      while (end < input.length && input[end] !== '"') end += 1;
      if (end >= input.length) throw new Error(`Unterminated string at ${index}`);
      tokens.push({ type: "string", value: input.slice(index + 1, end) });
      index = end + 1;
      continue;
    }

    const numberMatch = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const two = input.slice(index, index + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      tokens.push({ type: "operator", value: two });
      index += 2;
      continue;
    }

    if ("+-*/()?:,<>.".includes(char)) {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    const identifierMatch = input.slice(index).match(/^[A-Za-z_][A-Za-z0-9_#]*/);
    if (identifierMatch) {
      tokens.push({ type: "identifier", value: identifierMatch[0] });
      index += identifierMatch[0].length;
      continue;
    }

    throw new Error(`Unexpected character '${char}' at ${index}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  current() {
    return this.tokens[this.index];
  }

  match(value) {
    if (this.current().value !== value) return false;
    this.index += 1;
    return true;
  }

  expect(value) {
    if (value === "eof" && this.current().type === "eof") {
      this.index += 1;
      return;
    }
    if (!this.match(value)) {
      throw new Error(`Expected '${value}', got '${this.current().value}'`);
    }
  }

  parseExpression() {
    return this.parseTernary();
  }

  parseTernary() {
    const test = this.parseLogicalOr();
    if (!this.match("?")) return test;
    const consequent = this.parseExpression();
    this.expect(":");
    const alternate = this.parseExpression();
    return { type: "conditional", test, consequent, alternate };
  }

  parseLogicalOr() {
    return this.parseBinary(() => this.parseLogicalAnd(), ["||"]);
  }

  parseLogicalAnd() {
    return this.parseBinary(() => this.parseComparison(), ["&&"]);
  }

  parseComparison() {
    return this.parseBinary(() => this.parseAdditive(), ["==", "!=", ">=", "<=", ">", "<"]);
  }

  parseAdditive() {
    return this.parseBinary(() => this.parseMultiplicative(), ["+", "-"]);
  }

  parseMultiplicative() {
    return this.parseBinary(() => this.parseUnary(), ["*", "/"]);
  }

  parseBinary(nextParser, operators) {
    let left = nextParser();
    while (operators.includes(this.current().value)) {
      const operator = this.current().value;
      this.index += 1;
      left = {
        type: "binary",
        operator,
        left,
        right: nextParser(),
      };
    }
    return left;
  }

  parseUnary() {
    if (this.match("+")) return this.parseUnary();
    if (this.match("-")) return { type: "unary", operator: "-", argument: this.parseUnary() };
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.current();
    if (token.type === "number") {
      this.index += 1;
      return { type: "number", value: token.value };
    }

    if (token.type === "identifier") {
      this.index += 1;
      let name = token.value;
      while (this.match(".")) {
        const next = this.current();
        if (next.type !== "identifier" && next.type !== "string") {
          throw new Error(`Expected member after '.', got '${next.value}'`);
        }
        this.index += 1;
        name += `.${next.value}`;
      }

      if (this.match("(")) {
        const args = [];
        if (!this.match(")")) {
          do {
            args.push(this.parseExpression());
          } while (this.match(","));
          this.expect(")");
        }
        return { type: "call", name, args };
      }

      return { type: "identifier", name };
    }

    if (this.match("(")) {
      const expression = this.parseExpression();
      this.expect(")");
      return expression;
    }

    throw new Error(`Unexpected token '${token.value}'`);
  }
}

function evaluateAst(ast, context) {
  switch (ast.type) {
    case "number":
      return ast.value;
    case "identifier":
      return resolveIdentifier(ast.name, context);
    case "unary":
      return -evaluateAst(ast.argument, context);
    case "binary":
      return evaluateBinary(ast.operator, evaluateAst(ast.left, context), evaluateAst(ast.right, context));
    case "conditional":
      return truthy(evaluateAst(ast.test, context))
        ? evaluateAst(ast.consequent, context)
        : evaluateAst(ast.alternate, context);
    case "call":
      return evaluateCall(ast.name, ast.args.map((arg) => evaluateAst(arg, context)), context);
    default:
      throw new Error(`Unknown AST node '${ast.type}'`);
  }
}

function resolveIdentifier(name, context) {
  const sfMatch = name.match(/^SF_([0-9]+)$/);
  if (sfMatch) return context.sf[Number(sfMatch[1])] ?? context.missingValue;

  if (name.startsWith("Mod.")) {
    return context.mods[name.slice(4)] ? 1 : 0;
  }

  if (Object.prototype.hasOwnProperty.call(context.variables, name)) {
    return context.variables[name];
  }

  if (Object.prototype.hasOwnProperty.call(context.refs, name)) {
    return context.refs[name];
  }

  return context.missingValue;
}

function evaluateBinary(operator, left, right) {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? null : left / right;
    case "==":
      return left === right ? 1 : 0;
    case "!=":
      return left !== right ? 1 : 0;
    case ">":
      return left > right ? 1 : 0;
    case "<":
      return left < right ? 1 : 0;
    case ">=":
      return left >= right ? 1 : 0;
    case "<=":
      return left <= right ? 1 : 0;
    case "&&":
      return truthy(left) && truthy(right) ? 1 : 0;
    case "||":
      return truthy(left) || truthy(right) ? 1 : 0;
    default:
      throw new Error(`Unsupported operator '${operator}'`);
  }
}

function evaluateCall(name, args, context) {
  const lowered = name.toLowerCase();
  if (lowered === "table") {
    const tableId = Number(args[0]);
    const argument = Number(args[1]);
    const table = context.tables[tableId];
    if (!table) return context.missingValue;
    return table[Math.round(argument)] ?? context.missingValue;
  }
  if (lowered === "min") return Math.min(...args);
  if (lowered === "max") return Math.max(...args);
  if (lowered === "floor") return Math.floor(args[0]);
  if (lowered === "ceil") return Math.ceil(args[0]);
  if (lowered === "pow") return Math.pow(args[0], args[1]);
  if (lowered === "abs") return Math.abs(args[0]);

  return resolveIdentifier(`${name}(${args.join(",")})`, context);
}

function truthy(value) {
  return value !== null && value !== 0 && value !== false;
}

function buildLinearTable(startLevel, endLevel, multiplier) {
  const table = {};
  for (let level = startLevel; level <= endLevel; level += 1) {
    table[level] = level * multiplier;
  }
  return table;
}

function sortCounts(counts) {
  return Object.fromEntries(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  );
}

module.exports = {
  buildCanonicalContextTemplate,
  buildCanonicalContextTemplateFile,
  buildDefaultContext,
  evaluateCanonicalVariables,
  evaluateCanonicalVariablesFile,
  evaluateAst,
  evaluateFormula,
  evaluateFormulaGraphs,
  evaluateFormulaGraphsFile,
  parseFormula,
  tokenize,
};
