# Manual Update Check Feature - User Guide

## Overview

The manual update check feature is now accessible in **two convenient locations**:

## 1. Settings Panel (Primary Location) ⭐

### How to Access:
1. Click the **Settings icon** (⚙️) in the top-right corner of the application
2. Scroll to the bottom of the Settings Panel
3. Find the **"Application Updates"** section

### What You'll See:

```
┌─────────────────────────────────────────┐
│  Application Updates        v1.0.1      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔄  Check for Updates            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Automatically checks for updates       │
│  every 6 hours                          │
└─────────────────────────────────────────┘
```

### Features:
- **Current Version Display**: Shows your current app version (e.g., v1.0.1)
- **Check Button**: Click to manually check for updates
- **Visual Feedback**: 
  - Spinning icon (🔄) while checking
  - Button disabled during check
  - Button text changes to "Checking..."
- **Status Messages**:
  - ✅ "You are already running the latest version!" (no update available)
  - 🎉 "Update available! Check the notification." (update found)
  - ⚠️ Error message if check fails
- **Auto-dismiss**: Messages automatically disappear after 3-5 seconds

## 2. Floating Button (Secondary Location)

### How to Access:
- Look at the **bottom-right corner** of the application
- The button appears when:
  - No update notification is currently shown
  - You've dismissed an update notification

### What You'll See:

```
                                   ┌────────────────────┐
                                   │ 🔄 Check for       │
                                   │    Updates         │
                                   └────────────────────┘
                                          ↑
                                   Bottom-right corner
```

### Features:
- **Always accessible**: Available even when Settings Panel is closed
- **Non-intrusive**: Small floating button that doesn't block the UI
- **Quick access**: One-click update check

## Update Check Workflow

```
User clicks "Check for Updates"
         ↓
Button shows "Checking..." with spinning icon
         ↓
System checks GitHub Releases API
         ↓
┌────────────────────────────────────┐
│                                    │
│  If NO update available:           │
│  → "Already on latest version"     │
│  → Message auto-dismisses          │
│                                    │
│  If UPDATE available:              │
│  → "Update available!" message     │
│  → Notification appears with       │
│     download option                │
│                                    │
│  If ERROR occurs:                  │
│  → Shows error message             │
│  → Message auto-dismisses          │
│                                    │
└────────────────────────────────────┘
```

## When to Use Manual Check

Use the manual update check when you want to:
- ✅ Check for updates immediately (don't wait for auto-check)
- ✅ Verify you're running the latest version
- ✅ Check after hearing about a new release
- ✅ Troubleshoot update-related issues

## Automatic vs Manual Updates

| Feature | Automatic Check | Manual Check |
|---------|----------------|--------------|
| **Frequency** | Every 6 hours | On-demand |
| **User Action** | None required | Click button |
| **Access Point** | Background | Settings Panel or Floating Button |
| **When to Use** | Normal operation | When you want to check immediately |

## Screenshots

### Settings Panel Location:

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                              [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Provider:  ○ OpenRouter  ● Ollama                     │
│                                                             │
│  Model:  [deepseek-r1t2-chimera                       ▼]    │
│                                                             │
│  System Prompt:                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ You are a helpful AI assistant...                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Temperature: [━━━━━━━━━━━○━━━━━━━━━━] 1.0                 │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  [🔄 Reset System Prompt to Default]                       │
│  Use this to update old chats with the latest system       │
│  prompt improvements                                        │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  Application Updates                            v1.0.1     │ ← NEW!
│                                                             │
│  [🔄 Check for Updates]                                    │ ← NEW!
│                                                             │
│  Automatically checks for updates every 6 hours            │ ← NEW!
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### While Checking:

```
│  Application Updates                            v1.0.1     │
│                                                             │
│  [🔄 Checking...]  ← Button disabled, icon spinning        │
│                                                             │
│  Automatically checks for updates every 6 hours            │
```

### After Check (No Update):

```
│  Application Updates                            v1.0.1     │
│                                                             │
│  [🔄 Check for Updates]                                    │
│                                                             │
│  You are already running the latest version!               │ ← Feedback
│  Automatically checks for updates every 6 hours            │
```

### After Check (Update Available):

```
│  Application Updates                            v1.0.1     │
│                                                             │
│  [🔄 Check for Updates]                                    │
│                                                             │
│  Update available! Check the notification.                 │ ← Feedback
│  Automatically checks for updates every 6 hours            │
```

And simultaneously, a notification appears in the bottom-right:

```
                        ┌──────────────────────────────────┐
                        │ Update Available              [X] │
                        │                                   │
                        │ Version 1.0.2 is available       │
                        │ (current: 1.0.1)                 │
                        │                                   │
                        │ Release Notes:                    │
                        │ ┌───────────────────────────────┐ │
                        │ │ • New features                │ │
                        │ │ • Bug fixes                   │ │
                        │ │ • Performance improvements    │ │
                        │ └───────────────────────────────┘ │
                        │                                   │
                        │ [⬇ Download]  [Later]            │
                        └──────────────────────────────────┘
```

## Benefits of This Implementation

✅ **Dual Access Points**: Users can check from Settings Panel or floating button  
✅ **Clear Feedback**: Immediate visual response to update checks  
✅ **Non-Intrusive**: Messages auto-dismiss, don't block workflow  
✅ **Version Transparency**: Current version always visible in Settings  
✅ **User Control**: Check on-demand without waiting for auto-check  
✅ **Accessibility**: Easy to find in commonly-used Settings Panel  

## Technical Details

- **API Used**: `window.electron.updater.checkForUpdates()`
- **Response Time**: Typically 1-3 seconds
- **Error Handling**: Graceful fallback with clear error messages
- **State Management**: Prevents duplicate checks during active check
- **Animation**: Smooth spinning icon using existing CSS animation

## Tips

💡 **Tip 1**: Open Settings Panel to see your current version at any time  
💡 **Tip 2**: If Settings Panel is closed, use the floating button for quick access  
💡 **Tip 3**: Check manually after major announcements or before important work  
💡 **Tip 4**: Don't spam the button - it's disabled while checking to prevent duplicate requests  

---

**Implementation Date**: February 2026  
**Feature Status**: ✅ Production Ready
