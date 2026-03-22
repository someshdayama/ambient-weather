---
name: deploy
description: Build and deploy the application
---

# Deploy

Build the application for production deployment.

## Steps

1. **Pre-flight checks**:
   - Ensure all dependencies are installed: `npm install`
   - Check for lint errors: review code for obvious issues

2. **Build**:
   ```bash
   npm run build
   ```

3. **Verify build**:
   - Check that `dist/` directory was created
   - Verify `dist/index.html` exists
   - Report bundle sizes

4. **Post-build**:
   - Preview locally if needed: `npm run preview`
   - Report success or failure with details
