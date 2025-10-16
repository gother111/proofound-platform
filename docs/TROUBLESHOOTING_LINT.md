# Lint Troubleshooting

When running `npm run lint`, the script ultimately invokes the Next.js CLI. If the CLI binary is missing you will see an error like:

```
sh: 1: next: not found
```

This means dependencies have not been installed locally. Run the following from the repository root:

```
npm install
```

If the install fails with messages such as `403 Forbidden - GET https://registry.npmjs.org/...`, the registry is denying access to one or more packages. Provide the appropriate npm authentication (for example via an `.npmrc` token) or run the installation from an environment that already has access to your organization's registry mirror. Once `npm install` succeeds, rerun `npm run lint`.
