# Contributing to Company Knowledge Graph Agent

Thank you for considering contributing to our project! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs
- Use the [issue tracker](https://github.com/rohanlearner/company-graph/issues)
- Please include steps to reproduce, expected vs actual behavior, and environment details
- Label your issue as "bug"

### Suggesting Features
- Use the [issue tracker](https://github.com/rohanlearner/company-graph/issues)
- Label your issue as "enhancement"
- Please provide clear use cases and benefits

### Submitting Changes
1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure your code follows our style guidelines
5. Add tests if applicable
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js >= 16.x
- npm
- FalkorDB running locally (default port 6379)
- Ruflo CLI installed globally

### Installation
```bash
# Clone your fork
git clone https://github.com/your-username/company-graph.git
cd company-graph

# Install dependencies
npm install

# Initialize Ruflo
npx @claude-flow/cli@latest init --wizard

# Start Ruflo daemon
npx @claude-flow/cli@latest daemon start
```

### Running Tests
```bash
npm test
```

### Code Style
Please follow the existing code style in the repository. We use:
- ES6+ syntax
- Consistent indentation (2 spaces)
- Descriptive variable and function names
- JSDoc comments for public APIs

## Pull Request Process

1. Update README.md if needed
2. The PR will be reviewed by maintainers
3. Address any feedback promptly
4. Once approved, maintainers will merge

## Getting Help
If you need help, please:
- Check the documentation in the `docs/` directory
- Look at existing issues for similar problems
- Ask in the GitHub discussions

Thank you for contributing!