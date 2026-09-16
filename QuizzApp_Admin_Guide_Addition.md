# QuizzApp - Super Admin Guide Addition

> **Placement:** Append the following entries under item **5. Super Admin Guide** in the existing Table of Contents, then insert Sections **5.2-5.13** immediately after the existing **Section 5.1** and before **Section 6**. No existing User, Host, or Admin text needs to be replaced.

## Table of Contents Entries to Add

   * [5.2 Accessing Admin Central & Navigation](#52-accessing-admin-central--navigation)
   * [5.3 System Overview Dashboard](#53-system-overview-dashboard)
   * [5.4 User Directory & Account Administration](#54-user-directory--account-administration)
   * [5.5 Quiz Library Administration](#55-quiz-library-administration)
   * [5.6 Live Room Monitoring](#56-live-room-monitoring)
   * [5.7 Analytics & Reports](#57-analytics--reports)
   * [5.8 Achievement & Title Management](#58-achievement--title-management)
   * [5.9 Administrative Notifications](#59-administrative-notifications)
   * [5.10 System Broadcasts](#510-system-broadcasts)
   * [5.11 System Notification Settings](#511-system-notification-settings)
   * [5.12 Admin Profile, User View & Logout](#512-admin-profile-user-view--logout)
   * [5.13 Administrative Safety Notes](#513-administrative-safety-notes)

---

### 5.2 Accessing Admin Central & Navigation

1. Log in using an active **Super Admin** account.
2. Open **Admin Central** to access the administrative workspace.
3. Use the left sidebar to navigate between the available modules:
   * **Dashboard:** View platform-wide activity and operational metrics.
   * **Quizzes:** Search, create, edit, duplicate, and delete quizzes.
   * **Live Rooms:** Monitor waiting, running, and completed quiz rooms.
   * **User Directory:** Create and manage user accounts, roles, and statuses.
   * **Reports:** Review room and exam performance data and download reports.
   * **Achievements:** Create and maintain badges, titles, rewards, and unlock rules.
   * **Broadcasts:** Send or schedule announcements for all users.
   * **Settings:** Configure system-wide administrative notification preferences.
4. Use the top-right account menu to open your profile, switch to the standard User view, or log out.

> **Permission Note:** Admin Central and its management actions are restricted to authorized Super Admin accounts.

### 5.3 System Overview Dashboard

The **Dashboard** provides a consolidated view of the current platform state:

1. Review the main system metrics:
   * **Total Quizzes**
   * **Active Rooms**
   * **Total Users**
   * **Average Score**
2. Use the **Engagement** chart to observe participation trends over time.
3. Review **Hottest Quizzes** to identify the most active quiz content.
4. Use **Room Distribution** to compare room statuses across the platform.
5. Review the **Active Rooms** table for current room activity.
6. If dashboard data cannot be loaded, use **Retry** after confirming that the server connection is available.

> **Operational Tip:** Use the Dashboard for monitoring. Perform record-level changes from the corresponding management module.

### 5.4 User Directory & Account Administration

Navigate to **User Directory** to manage platform accounts.

#### Searching and Filtering Users

1. Search by a user's name, email address, or ID.
2. Filter the directory by role:
   * **All Roles**
   * **Super Admin**
   * **User**
3. Filter by account status:
   * **All Statuses**
   * **Active**
   * **Suspended**
4. Use pagination to move through large user lists.

#### Adding a User

1. Click **Add User**.
2. Enter the required account information, including the initial password.
3. Select the appropriate role and account status.
4. Review the information and save the account.

#### Viewing and Editing a User

1. Open the action menu for the required account.
2. Select **View Details** to review the user's account information and related activity.
3. Select **Edit** to update supported profile, role, verification, or status fields.
4. Save the changes and verify that the directory displays the updated information.

#### Batch Importing Users

1. Click **Batch Import**.
2. Upload a properly formatted **CSV or Excel workbook (`.xlsx`)** containing the required user fields.
3. The system validates the selected file and queues valid users for background import.
4. Large imports are processed in the background; monitor administrative notifications for completion or failure details.
5. Correct rejected rows in the source file before attempting another import.

#### Suspending or Deleting an Account

1. Use **Edit** and set the account status to **Suspended** when temporary access removal is appropriate.
2. Use **Delete** only when permanent removal is required.
3. Read the confirmation dialog carefully before completing a destructive action.

> **Built-in Safeguards:** A Super Admin cannot suspend or demote their own active administrative account. The final active Super Admin account also cannot be demoted, suspended, or deleted.

### 5.5 Quiz Library Administration

Navigate to **Quizzes** to manage the shared quiz library.

1. Search for a quiz by title, subject, or quiz ID.
2. Use the available filters to narrow the list by difficulty and subject.
3. Click **Create New Quiz** to open the standard quiz authoring workflow.
4. Use the quiz action menu to:
   * **Edit:** Update quiz metadata, questions, answer choices, media, and supported version settings.
   * **Duplicate:** Create a separate copy for reuse without changing the source quiz.
   * **Delete:** Permanently remove an eligible quiz after confirmation.
5. Review validation messages before publishing or closing the editor.

> **Deletion Rule:** A quiz cannot be deleted while it is used by a room in a waiting or running state. End the active room before trying again. Other protected references may also prevent deletion and will be shown in the error message.

> **Version Rule:** If AI-generated quiz versions are enabled, generate and review the latest version set after changing the original questions and before publishing.

### 5.6 Live Room Monitoring

Navigate to **Live Rooms** to monitor quiz sessions across the platform.

1. Search by room name, room code, quiz, or host information.
2. Filter rooms by status:
   * **All**
   * **Running**
   * **Waiting**
   * **Finished**
3. Review each room's title, code, host, participant count, and current status.
4. Select **View Details** to inspect:
   * Room, quiz, and host information
   * Current room status
   * Participant list and participation status
   * Average and highest score
   * Individual participant scores when available

> **Scope Note:** The current Admin Central room page is designed for visibility and monitoring. Room-host controls remain in the host workflow.

### 5.7 Analytics & Reports

Navigate to **Reports** to review performance information for completed room and exam activity.

1. Review the headline metrics:
   * **Average Score**
   * **Total Participants**
   * **Total Questions**
2. Search reports using the quiz, room, exam, host, or identifier information shown in the list.
3. Filter by report type:
   * **All Types**
   * **Exam**
   * **Room**
4. Review the quiz title, activity type, date, host, participant count, and average score.
5. Use pagination to move between report pages without loading the full report history at once.
6. Click the download action to export the available report package for offline review.

> **Reporting Tip:** Confirm the report type and activity identifier before exporting records for formal use.

### 5.8 Achievement & Title Management

Navigate to **Achievements** to manage rewards displayed in the user achievement experience.

1. Review achievement totals and rarity distribution.
2. Search and filter the catalog to find an existing achievement.
3. Click **Create Achievement** and configure:
   * Name and description
   * Icon and category
   * Rarity tier
   * Bonus EXP reward
   * Unlock condition and target value
4. Use **Edit** to update an achievement's supported fields.
5. Use the unlocked-user view to see which accounts have earned an achievement.
6. Use **Delete** only after confirming that the achievement is no longer required.

> **User Impact:** Changes made here affect the achievement catalog used by the standard User experience. The User achievement feature itself remains available and unchanged.

### 5.9 Administrative Notifications

Use the notification bell or open the full **Notifications** page to review administrative events.

1. Filter notifications by the available categories or status tabs.
2. Search notification titles and content when investigating a specific event.
3. Open a notification to mark it as read and follow its action link when available.
4. Use **Mark All as Read** to clear unread indicators without deleting records.
5. Delete an individual notification only when it is no longer needed.
6. Use **Clear Read** or **Delete All** carefully because these actions remove multiple notification records.

> **Important:** Administrative notifications provide operational visibility; they are not a complete system audit-log replacement.

### 5.10 System Broadcasts

Navigate to **Broadcasts** to send platform announcements to all users.

#### Sending an Immediate Broadcast

1. Enter a clear broadcast title.
2. Write the broadcast message content.
3. Optionally provide a valid internal path or an `http/https` action URL.
4. Select the appropriate event type.
5. Review the **Live Preview** to confirm how the notification will appear.
6. Click **Send Broadcast** and confirm the action.

#### Scheduling a Broadcast

1. Enable the scheduling option.
2. Select a future delivery date and time.
3. Confirm the content, destination link, and event type.
4. Click **Schedule Broadcast**.
5. Review the item in **Scheduled Broadcasts**.
6. Use **Refresh** to retrieve the latest queue state.
7. Delete a scheduled item before delivery if the announcement must be cancelled.

> **Validation Rules:** Titles must contain 3-200 characters, messages must contain 5-2,000 characters, and a scheduled delivery must be at least one minute in the future.

> **Communication Tip:** Avoid including passwords, access tokens, personal records, or other sensitive information in a broadcast.

### 5.11 System Notification Settings

Navigate to **Settings** to configure which administrative events generate in-app or email alerts.

1. Use the master email-delivery control to enable or disable administrative email alerts.
2. Configure the **System Notification Matrix** for each supported event.
3. Choose the required delivery channels:
   * **In-App**
   * **Email**
4. Configure account lifecycle events, including registration, deletion, status changes, and bulk import completion.
5. Configure security and permission events, including important role changes and critical data deletion.
6. Click **Save Changes** and wait for the saved confirmation before leaving the page.

> **Unsaved Changes:** If the page indicates pending changes, save them before navigating away or they may be lost.

### 5.12 Admin Profile, User View & Logout

1. Open the account menu from the top-right corner.
2. Select **My Profile** to update supported personal information, profile image, or password.
3. Select **Switch to User View** to open the standard User interface without changing the account's Super Admin role.
4. Return to Admin Central when administrative work is required.
5. Select **Log Out** when using a shared or public device.

### 5.13 Administrative Safety Notes

* Apply the principle of least privilege when assigning the **Super Admin** role.
* Prefer **Suspended** status when access may need to be restored later.
* Verify record identifiers before deleting users, quizzes, achievements, notifications, or scheduled broadcasts.
* Do not share administrative credentials or reuse another administrator's account.
* Review confirmation and validation messages instead of repeatedly submitting a failed action.
* Export reports only for authorized operational or academic purposes.
* Keep at least one active, accessible Super Admin account at all times.

---

> **End of Admin Guide Addition:** Continue with the existing **Section 6. Troubleshooting & FAQ** without changing its current content.
