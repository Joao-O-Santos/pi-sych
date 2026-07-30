# Design Principles

1. Humans remain responsible for consequential decisions and final outputs.

2. The supervisor owns project coherence and coordination.

3. Memory is lossy, biased, and unreliable: write it down.

4. Use short-lived workers for independent review and bounded specialist tasks.

5. Give every agent the smallest complete context.

6. Choose the right model for the right task.

7. Use mechanical tools for mechanical problems; use skills and judgment for semantic problems.

8. Prefer existing tools and skills to new infrastructure.

9. Write as little code as possible.

# 1. Humans remain responsible

Agents may research, review, propose, implement, and verify. They do not assume responsibility for project direction, central claims, consequential decisions, or the final artifact.

# 2. The supervisor owns coherence

The supervisor maintains the overall understanding of the project, coordinates work, selects skills and workers, resolves competing recommendations, and integrates results.

# 3. Write important knowledge down

Conversation history and model memory will omit, distort, and overemphasize information. Decisions, evidence, constraints, conventions, and current direction belong in visible, editable project files.

## 4. Use workers for independence and specialization

Workers are valuable when an independent review, clean context, specialist capability, or parallel bounded task improves the result. They should be short-lived and return one inspectable result.

## 5. Provide the smallest complete context

Agents should receive no irrelevant material, but must receive everything necessary to work correctly—including applicable evidence, instructions, style, architecture, and project conventions.

## 6. Match models to tasks

Different tasks reward different capabilities, context sizes, speeds, and costs. Model selection should follow the task rather than a universal hierarchy or default preference.

## 7. Separate mechanical and semantic work

Formatters, linters, type checkers, schemas, hashes, and tests should handle mechanically decidable work. Skills, models, experts, and humans should handle meaning, argument, quality, authority, and judgment.

## 8. Reuse before building

Pi Sych should compose Pi, skills, MCPorter, Plannotator, and project-native tooling rather than reproduce their functionality through custom abstractions.

## 9. Write as little code as possible

"I hate code and want as little of it as possible in our product." -- Jack Diederich

Every line of permanent code creates maintenance, testing, compatibility, and failure costs. Code belongs in Pi Sych only when it provides necessary mechanical behaviour that cannot be expressed adequately through skills, instructions, or existing tools.
