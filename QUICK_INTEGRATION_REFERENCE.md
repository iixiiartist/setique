# Quick Integration Reference - Final 2 Tabs

## 🎯 CurationRequestsTab - Exact Replacement

### Line Range to Replace
**Start**: Line ~1171 (look for `{/* My Curation Requests Tab */}`)  
**End**: Line ~1372 (line before `{/* Pro Curator Tab */}`)  
**Lines to remove**: ~201 lines

### Search Pattern (Exact Start)
```javascript
          {/* My Curation Requests Tab */}
          {activeTab === 'curation-requests' && (
            <div>
```

### Search Pattern (Exact End)
```javascript
            </div>
          )}

          {/* Pro Curator Tab */}
```

### Complete Replacement
```javascript
          {/* My Curation Requests Tab */}
          {activeTab === 'curation-requests' && (
            <CurationRequestsTab
              myCurationRequests={myCurationRequests}
              curationRequestModal={curationRequestModal}
              proposalsModal={proposalsModal}
              fetchDashboardData={fetchDashboardData}
              setError={setError}
            />
          )}

          {/* Pro Curator Tab */}
```

---

## 🎯 ProCuratorTab - Exact Replacement

### Line Range to Replace
**Start**: Line ~1374 (look for `{/* Pro Curator Tab */}`)  
**End**: Line ~1611 (line before `{/* Activity Feed Tab */}`)  
**Lines to remove**: ~237 lines

### Search Pattern (Exact Start)
```javascript
          {/* Pro Curator Tab */}
          {activeTab === 'pro-curator' && (
            <div className="space-y-8">
```

### Search Pattern (Exact End)
```javascript
            </div>
          )}

          {/* Activity Feed Tab */}
```

### Complete Replacement
```javascript
          {/* Pro Curator Tab */}
          {activeTab === 'pro-curator' && (
            <ProCuratorTab
              curatorProfile={curatorProfile}
              curatorAssignedRequests={curatorAssignedRequests}
              openCurationRequests={openCurationRequests}
              curationRequestModal={curationRequestModal}
              proposalSubmissionModal={proposalSubmissionModal}
              curatorSubmissionModal={curatorSubmissionModal}
            />
          )}

          {/* Activity Feed Tab */}
```

---

## 📝 Imports to Uncomment

**Location**: Lines 29-30

**Change from**:
```javascript
// TODO: Integrate these final 2 tabs (components ready, just need to replace inline JSX)
// import { CurationRequestsTab } from '../components/dashboard/tabs/CurationRequestsTab'
// import { ProCuratorTab } from '../components/dashboard/tabs/ProCuratorTab'
```

**To**:
```javascript
import { CurationRequestsTab } from '../components/dashboard/tabs/CurationRequestsTab'
import { ProCuratorTab } from '../components/dashboard/tabs/ProCuratorTab'
```

---

## 🔧 PowerShell Commands

### Find Line Numbers
```powershell
# Find CurationRequestsTab location
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "My Curation Requests Tab" | Select-Object LineNumber

# Find ProCuratorTab location  
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "Pro Curator Tab" | Select-Object LineNumber

# Check current line count
(Get-Content "src\pages\DashboardPage.jsx" | Measure-Object -Line).Lines
```

### Quick Verification
```powershell
# After integration, verify imports are active
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "import.*CurationRequestsTab"
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "import.*ProCuratorTab"

# Verify component usage
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "<CurationRequestsTab"
Select-String -Path "src\pages\DashboardPage.jsx" -Pattern "<ProCuratorTab"
```

---

## ✅ Final Checks

```bash
# 1. Lint
npm run lint

# 2. Test
npm test

# 3. Manual test
npm run dev
# Navigate to dashboard, test both tabs

# 4. Verify line count (should be ~1,476)
(Get-Content "src\pages\DashboardPage.jsx" | Measure-Object -Line).Lines
```

---

## 🎯 One-Command Integration (if using replace tool)

If you have access to a code editor's find/replace with multiline support:

**Pattern 1 (CurationRequestsTab)**:
- Find: Everything from `{/* My Curation Requests Tab */}\n\s*{activeTab === 'curation-requests' && \(` to `\)\}\n\n\s*{/\* Pro Curator Tab \*/}`
- Replace with the component call from above

**Pattern 2 (ProCuratorTab)**:
- Find: Everything from `{/* Pro Curator Tab */}\n\s*{activeTab === 'pro-curator' && \(` to `\)\}\n\n\s*{/\* Activity Feed Tab \*/}`
- Replace with the component call from above

---

**Pro Tip**: Look at lines 1613-1620 to see how ActivityTab was successfully integrated - use that as a template! The pattern is identical, just different props.
