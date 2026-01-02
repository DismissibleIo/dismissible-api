<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
  <!-- The MCP isn't working yet -->
  <!-- - You have access to the Nx MCP server and its tools, use them to help the user -->
  <!-- - When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies -->
- Run all `nx` commands without the daemon eg `NX_DAEMON=false nx <command>`.
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# Testing Guidelines

- Always use `Mock<T>` from `ts-jest-mocker` instead of `jest.Mocked<T>` for type annotations of mocked objects
- Import `Mock` from `ts-jest-mocker`: `import { mock, Mock } from 'ts-jest-mocker';`
- Use `Mock<TypeName>` for type annotations, e.g., `let mockService: Mock<MyService>;`
