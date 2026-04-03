# Contributing

## Branch Strategy

This project uses a `develop → main` workflow. **Never commit directly to `main` or `develop`.**

```
feat/your-feature
       │
       ▼
   develop  ──── integration testing ────▶  main  ──── Firebase Hosting (prod)
```

### Branch Naming

| Prefix | Use | Example |
|--------|-----|---------|
| `feat/` | New feature | `feat/date-range-picker` |
| `fix/`  | Bug fix      | `fix/analytics-loading-flash` |
| `chore/`| Maintenance  | `chore/upgrade-firebase-sdk` |
| `docs/` | Docs only    | `docs/update-readme`         |

### Workflow

1. **Always branch off `develop`**:
   ```bash
   git checkout develop && git pull origin develop
   git checkout -b feat/your-feature
   ```

2. **Open PR: `feat/*` → `develop`** — code review + verify with `npm run build`

3. **After `develop` is stable, open release PR: `develop` → `main`** — then run `firebase deploy --only hosting` to push to production

### Rules

- Never force-push `main` or `develop`
- All feature branches must be based on `develop`, never on `main`
- At least one reviewer approval before merging to `main`
- Always run `npm run build` locally before opening a PR — broken builds block everyone
