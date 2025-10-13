# Templates

This directory contains templates that can be applied to target repositories using the `createPR.js` script.

## Structure

Each template should be organized as a subdirectory under `templates/`:

```
templates/
├── example-template/
│   ├── README.md
│   └── (other template files)
└── another-template/
    └── (template files)
```

## Usage

When running the `createPR.js` script, specify the template name (directory name) as the second argument:

```bash
node createPR.js <repository-name> <template-name>
```

For example:
```bash
node createPR.js owner/repo example-template
```

## Validation

The script will validate that:
1. The specified template directory exists in `./templates/`
2. The target repository exists and is accessible (via GitHub API or gh CLI)

If either validation fails, the script will exit with an error.
