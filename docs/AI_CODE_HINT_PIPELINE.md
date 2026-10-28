# AI pipeline: read code, return a short hint

## 1. Goal

Codey does not need to produce a full solution. Its job is to find the learner's nearest obstacle
and return **one short hint that can be acted on immediately**.

The in-depth AI assistant is a separate flow: it may analyse the whole solution and its complexity,
and suggest refactoring.

## 2. Data sent to the backend

The frontend sends data only when the user asks Codey, or after running the tests:

```ts
interface CodeHintRequest {
  problemId: string;
  language: "c" | "cpp" | "java" | "python" | "javascript";
  sourceCode: string;
  cursor?: { line: number; column: number };
  selectedCode?: string;
  compilerDiagnostics?: Array<{
    line: number;
    column: number;
    severity: "error" | "warning";
    message: string;
  }>;
  testSummary?: Array<{
    input: string;
    expected: string;
    actual?: string;
    passed: boolean;
  }>;
  question?: string;
}
```

Do not send on every keystroke. When automatic analysis is needed, debounce by about 1–2 seconds
and send only if the hash of the code has changed.

## 3. Proposed processing

### Step 1 — Normalise and protect the input

1. Limit the source code size.
2. Strip tokens, passwords or secret URLs if any are detected.
3. Normalise line endings and remove generated code that is not needed.
4. Compute `codeHash = SHA256(problemId + language + normalizedCode + testSummary)` to cache results.

### Step 2 — Deterministic analysis with the compiler and an AST

Prefer deterministic tools before calling a language model:

1. Compile or parse the code in the sandbox.
2. Collect syntax errors, type errors and warnings.
3. Build an AST with Tree-sitter or the language's own parser.
4. Extract functions, loops, conditional branches, variables and calls.
5. Match failing tests to find the branch most likely at fault.

Example: if `delta < 0` fails and the AST has no branch for negative numbers, a rule can produce
the hint without calling the AI.

### Step 3 — Fast hint rules

Applied in priority order:

1. `compiler_error`: hint at the first error line.
2. `runtime_error`: explain the error type and the input that caused it.
3. `failed_test`: compare expected/actual and the related conditional branch.
4. `edge_case_missing`: find edge cases the AST does not handle.
5. `complexity_risk`: warn when the algorithm's structure cannot meet the constraints.
6. Only when no rule is confident enough, send a reduced context to the LLM.

### Step 4 — Build the LLM context

The context should hold more than the source code:

- The problem statement and constraints.
- The language in use.
- The source code with line numbers.
- The cursor position or the selected snippet.
- Compiler diagnostics.
- A pass/fail test summary — never sensitive hidden inputs.
- Key AST nodes and the estimated complexity.
- The learner's current question.

The system prompt should state:

```text
You are Codey, a short-hint assistant.
- Never write a complete solution.
- Point out only the single most important problem.
- At most 60 words, in Vietnamese.
- Where possible, mention the related line or construct.
- End with one action the learner can take right now.
```

### Step 5 — Enforce structured output

```ts
interface CodeHintResponse {
  category: "syntax" | "logic" | "edge_case" | "complexity" | "testing";
  line?: number;
  hint: string;
  nextAction: string;
  confidence: number;
  source: "rule" | "llm";
}
```

The backend must validate the schema, cap the length and strip solution code before returning to
the frontend.

## 4. Pseudocode

```text
function generateShortHint(request):
    normalized = sanitizeAndNormalize(request)
    cached = cache.get(hash(normalized))
    if cached exists:
        return cached

    diagnostics = compileInSandbox(normalized)
    astSummary = parseAndSummarizeAST(normalized.sourceCode)
    testAnalysis = compareTestResults(normalized.testSummary)

    ruleHint = applyHintRules(diagnostics, astSummary, testAnalysis)
    if ruleHint.confidence >= 0.85:
        return validateAndCache(ruleHint)

    context = buildCompactContext(
        problem,
        normalized,
        diagnostics,
        astSummary,
        testAnalysis
    )

    aiHint = llm.generate(context, SHORT_HINT_SCHEMA)
    return validateAndCache(aiHint)
```

## 5. Codey vs. the AI assistant

| | Codey | AI assistant |
|---|---|---|
| Purpose | Unblock the learner while coding | In-depth analysis |
| Context | Latest error, latest test, cursor position | Full problem, code, Q&A history |
| Length | One hint under 60 words | May explain in several steps |
| Frequency | Fast, heavily cached | Only when the user opens it |
| Full answer | No | Still prefers guidance over doing it for them |

## 6. Minimal API

```http
POST /api/ai/code-hint
Authorization: Bearer <token>
Content-Type: application/json
```

Response (hints are returned in Vietnamese):

```json
{
  "category": "edge_case",
  "line": 8,
  "hint": "Nhánh hiện tại mới xử lý delta dương và bằng 0.",
  "nextAction": "Thêm trường hợp delta âm và kiểm tra output yêu cầu.",
  "confidence": 0.94,
  "source": "rule"
}
```

## 7. Safety and operations

- Compile code in a sandbox with CPU, memory and time limits.
- Never write source code to regular logs.
- Rate-limit per user and per exercise.
- Never send the full hidden test cases to the model.
- Cache by code hash to cut cost and latency.
- Tag each response with a `requestId`, the response time and its `rule/llm` source to track quality.
- Let learners rate a hint "Helpful / Not helpful" to improve the rules and the prompt.
