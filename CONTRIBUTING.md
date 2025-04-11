# Contributing to EzerAI

Thank you for considering contributing to EzerAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand what behavior is expected.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue tracker to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** after following the steps
- **Explain which behavior you expected to see instead**
- **Include screenshots or animated GIFs** if possible
- **Include details about your environment** (OS, browser, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title** for the issue
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and **explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful** to most EzerAI users

### Pull Requests

- Fill in the required template
- Follow the style guides
- Document new code
- Include tests for new features or bug fixes
- End all files with a newline
- Avoid platform-dependent code

## Development Process

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork locally
3. Install dependencies
4. Create a new branch for your feature or bug fix

```bash
# Clone your fork
git clone https://github.com/your-username/ezerai.git
cd ezerai

# Install dependencies
cd server
npm install
cd ../client
npm install

# Create a new branch
git checkout -b feature/your-feature-name
```

### Style Guides

#### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

#### JavaScript Style Guide

This project uses ESLint and Prettier to enforce a consistent code style. Please make sure your code passes the linting checks before submitting a pull request.

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix
```

#### Documentation Style Guide

- Use Markdown for documentation
- Reference code using backticks (`)
- Include code examples when relevant
- Keep documentation up-to-date with code changes

## Testing

Please write tests for any new features or bug fixes. We use Jest for testing both the frontend and backend.

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## Submitting Changes

1. Push your changes to your fork
2. Submit a pull request to the main repository
3. The core team will review your pull request and provide feedback
4. Once approved, your changes will be merged

## Additional Resources

- [Issue tracker](https://github.com/organization/ezerai/issues)
- [Project documentation](docs/)
- [Development roadmap](docs/roadmap.md)

Thank you for contributing to EzerAI!
