# OSKO Build Save Process

This process is mandatory for every important OSKO Camera change.

## 1. Save the working code first
Before changing anything major, preserve the current working version in GitHub with a clear commit message.

## 2. Make one controlled change
Do not rewrite the whole camera at once. Change one feature or one group of closely related features.

## 3. Test the change
Confirm the camera still opens and that the changed feature works. Do not call a build finished until it has been tested on Osko's phone.

## 4. Save the new build
Commit the tested change to GitHub immediately. GitHub is the live working code and version history.

## 5. Update the notes
Record what changed, what was fixed, what still needs testing, and any phone-specific issue. Keep `SKY-READ-THIS-FIRST.md` and the project status current.

## 6. Keep backup copies
Maintain the backup chain:

Phone copy → 128 GB OSKO master USB → laptop → Google Drive backup

Do not delete the phone copy until the USB copy opens correctly. Do not replace the last known working build without preserving it first.

## 7. Recovery rule
If a future build fails, return to the last tested GitHub commit instead of restarting the project.

## Non-negotiable rule
No important OSKO build exists in only one place.
