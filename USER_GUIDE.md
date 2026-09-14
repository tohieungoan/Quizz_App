# 📖 QuizzApp - User Guide & Documentation

Welcome to the **QuizzApp** User Guide! This comprehensive manual provides step-by-step instructions for **Users** (acting as Participants or Room Hosts) and **Super Admins** to navigate and utilize the features of QuizzApp effectively.

---

## 📋 Table of Contents
1. [User Roles Overview](#1-user-roles-overview)
2. [Getting Started & Authentication](#2-getting-started--authentication)
   - [Registering a New Account](#21-registering-a-new-account-standard-email-flow)
   - [Logging In](#22-logging-in-standard-email-flow)
   - [Quick Sign In / Registration via Google](#23-quick-sign-in--registration-via-google-recommended)
3. [User Guide - Participant Features](#3-user-guide---participant-features)
   - [Overview Dashboard](#31-overview-dashboard)
   - [Joining a Real-Time Multiplayer Quiz](#32-joining-a-real-time-multiplayer-quiz)
   - [Join Live Room & Group Management (Sidebar Tab)](#33-join-live-room--group-management-sidebar-tab)
   - [Taking Assigned & Formal Exams](#34-taking-assigned--formal-exams)
   - [Reviewing Results & Performance](#35-reviewing-results--performance)
   - [Achievements & Missions (Sidebar Tab)](#36-achievements--missions-sidebar-tab)
   - [Account & Notification Settings (Sidebar Tab)](#37-account--notification-settings-sidebar-tab)
   - [AI Support Assistant (Quizzy)](#38-ai-support-assistant-quizzy)
4. [User Guide - Host Features](#4-user-guide---host-features)
   - [Question Bank Management & Manual Question Creation](#41-question-bank-management--manual-question-creation)
   - [AI Question Generation & Variant Creation (PDF / DOCX RAG)](#42-ai-question-generation--variant-creation-pdf--docx-rag)
   - [Hosting Real-Time Quiz Lobbies](#43-hosting-real-time-quiz-lobbies)
   - [Creating & Distributing Exam Papers](#44-creating--distributing-exam-papers)
   - [Creating & Managing Study Groups (My Study Groups Sidebar)](#45-creating--managing-study-groups-my-study-groups-sidebar)
   - [Managing & Grading Assigned Exams (My Assigned Exams Sidebar)](#46-managing--grading-assigned-exams-my-assigned-exams-sidebar)
   - [Analytics & Performance Reports](#47-analytics--performance-reports)
5. [Super Admin Guide](#5-super-admin-guide)
   - [Super Admin Overview](#51-super-admin-overview)
   - [Accessing Admin Central & Navigation](#52-accessing-admin-central--navigation)
   - [System Overview Dashboard](#53-system-overview-dashboard)
   - [User Directory & Account Administration](#54-user-directory--account-administration)
   - [Quiz Library Administration](#55-quiz-library-administration)
   - [Live Room Monitoring](#56-live-room-monitoring)
   - [Analytics & Reports](#57-analytics--reports)
   - [Achievement & Title Management](#58-achievement--title-management)
   - [Administrative Notifications](#59-administrative-notifications)
   - [System Broadcasts](#510-system-broadcasts)
   - [System Notification Settings](#511-system-notification-settings)
   - [Admin Profile, User View & Logout](#512-admin-profile-user-view--logout)
   - [Administrative Safety Notes](#513-administrative-safety-notes)
6. [Troubleshooting & FAQ](#6-troubleshooting--faq)

---

## 1. User Roles Overview

QuizzApp relies on a streamlined role architecture:
* 👤 **User (Default Role):** Every registered account is a `User`. A standard User has full access to both **Participant** capabilities (joining live rooms, taking exams, tracking scores) and **Host** capabilities (creating question banks, generating AI quizzes, hosting live rooms, creating exam papers).
* 🛡️ **Super Admin:** Oversees system health, manages user accounts, resets passwords, monitors active quiz rooms, and configures application settings.

---

## 2. Getting Started & Authentication

### 2.1 Registering a New Account (Standard Email Flow)
1. Open the QuizzApp homepage (`http://localhost:5173`).
2. Click **Get Started** in the top navigation bar.
3. Switch to the **Sign Up** tab.
4. Enter your **Full Name**, **Email**, and **Password**.
5. Click **Sign Up**. An activation link will be sent to your registered email address.
6. Open your email inbox and click the verification link to activate your account.
7. Return to QuizzApp, switch to the **Sign In** tab, and log in with your credentials.

### 2.2 Logging In (Standard Email Flow)
1. Open the authentication dialog/page.
2. Ensure the **Sign In** tab is active.
3. Enter your registered **Email** and **Password**.
4. Click **Sign In** to access your dashboard.

### 2.3 Quick Sign In / Registration via Google (Recommended)
You can bypass manual email activation by signing in directly with your Google account:
1. Click **Get Started** on the homepage.
2. Click **Continue with Google** (or **Sign in with Google**).
3. Authenticate with your Google account credentials.
4. Your account will be automatically created, verified, and logged in instantly.

---

## 3. User Guide - Participant Features

### 3.1 Overview Dashboard
Upon logging in, the User Dashboard provides a central hub showcasing key stats, performance widgets, and activity breakdowns:

* 📊 **Average Score:** Displays your real-time cumulative score average across all completed quizzes and formal exams.
* 💎 **Points (EXP) & Rewards:** Tracks earned Experience Points (EXP) accumulated from completing quizzes, maintaining study streaks, and unlocking platform rewards.
* 🎓 **Completed Exams:** Displays total formal exams completed alongside your completion rate (e.g., *100% Clear*).
* 🔥 **Streak Tracker:** Monitors consecutive days of learning activity. Displays active streak days and warns if a streak reset is imminent.
* 📋 **Assigned Exams Widget:** Lists pending exams assigned by hosts/instructors with quick-access links (e.g., *No pending assigned exams. All clear!*).
* ⏱️ **Recent Activity Timeline:** Tracks your latest actions, including recently completed exams, joined rooms, or created quizzes.
* 📈 **Quiz & Activity Breakdown:** Provides visual pie/bar charts showing the distribution of your total activities:
  - **Exams Completed**
  - **Live Quizzes Joined**
  - **Quizzes Created**
  - **Live Rooms Hosted**
* 📚 **Subject Proficiency:** Displays mastery levels and skill progress across enrolled subject categories.

### 3.2 Joining a Real-Time Multiplayer Quiz
1. **Enter Room PIN:** From the User Dashboard, locate the **"Join Live Room"** card, enter the **6-digit PIN code** provided by the room host, and click **Join Lobby**.
2. **Waiting Room:** View connected players in real time and wait for the host to start the game.
3. **During the Live Game (Classic Mode Mechanics):**
   - **Scoring System:** Select your answer before the countdown ends. Points depend on **accuracy** and **answer speed**.
   - **Power-Up Items:** Activate strategic items during questions:
     - 🌟 **Double Points (2x):** Doubles the points earned for a correct response.
     - 🌗 **50:50:** Eliminates half of the incorrect options.
     - 🛡️ **Streak Shield:** Protects your active streak, keeping it intact even if you answer incorrectly.
   - **Streak System & Strategic Skipping:**
     - Consecutive correct answers build a **Streak**, awarding incremental bonus points.
     - **Streak Preservation:** You can deliberately choose **not to answer** (skip) a difficult question to preserve your current streak!
   - **Live Leaderboard:** View updated player rankings and points after each question.
4. **Post-Game Q&A & Question Voting:**
   - **Question Flagging:** If you encounter a problematic or ambiguous question, click **Vote/Flag Question**.
   - **Live Q&A Session:** At the end of the game, join the Q&A session to discuss flagged questions directly with the Host using **voice mic** or **live chat**.

### 3.3 Join Live Room & Group Management (Sidebar Tab)
Navigate to **Join Live Room** from the left sidebar navigation menu to access live quiz lobbies and private study groups:

1. **Join Live Room via PIN:**
   - Enter the **6-digit PIN code** provided by the Host to immediately join a public or private live quiz lobby.
2. **Join Private Group:**
   - Enter a **Group Join Code** or use an invitation link provided by your instructor or group leader to enroll in a private study group or class.
3. **Joined Groups & Membership Management:**
   - **View Joined Groups:** Browse all active private groups you are currently enrolled in, view group announcements, shared study sets, and class rosters.
   - **Leave Group:** To exit a group, select the target group card, open **Group Options**, and click **Leave Group** to confirm your withdrawal.

### 3.4 Taking Assigned & Formal Exams
Navigate to **Assigned Exams** from the sidebar menu to view your exam schedule, deadlines, and assigned tests:

1. **Exam Calendar & Deadline Filtering:**
   - **Overdue Exams:** Assigned tests whose deadline has passed.
   - **Due Soon:** High-priority exams approaching their submission cutoff.
   - **Upcoming Exams:** Scheduled exams that will open for attempts in the near future.
2. **Starting an Assigned Exam:**
   - Select an assigned exam card or calendar entry and click **Start Exam**.
3. **Real-Time Exam Rules & Exit/Resume Mechanics:**
   - **Official Timer Countdown:** Once you click **Start Exam**, the official exam timer immediately begins counting down.
   - **Continuous Background Timer:** If you exit the page, close your browser tab, or lose internet connection, you can return and resume your exam. **However, the exam timer continues counting down uninterrupted in the background while you are away.**
   - **Question Submission:** Answer questions (Single Choice, Multiple Choice, True/False) and click **Submit Exam** when finished. If the timer reaches `00:00`, the system will automatically submit your current progress.

### 3.5 Reviewing Results & Performance
1. After submitting an exam or finishing a live quiz, view your instant score breakdown.
2. Visit **History & Analytics** to track score progression over time, accuracy per category, and detailed question explanations.

### 3.6 Achievements & Missions (Sidebar Tab)
Navigate to **Achievements** from the left sidebar navigation menu to track your study quests, earn gamified rewards, and unlock prestigious titles:

1. **Daily & Weekly Missions:**
   - View active learning quests and challenges (e.g., *Complete 3 Live Quizzes*, *Maintain a 5-Day Study Streak*, *Score 90%+ on 2 Formal Exams*).
   - Track real-time mission progress bars and claim Experience Points (EXP) upon completion.
2. **Achievements & Milestone Badges:**
   - Unlock special achievement badges for reaching learning milestones (e.g., *Speed Demon*, *Quiz Master*, *Flawless Victory*, *Streak Legend*).
   - View locked vs unlocked badges along with their specific completion criteria.
3. **Titles & Profile Badges:**
   - Completing specific high-tier missions and achievements awards unique **Titles** (e.g., *Scholar*, *Trivia Champion*, *Grandmaster Host*).
   - Equip earned titles and badges to showcase on your public user profile and live game lobbies!

### 3.7 Account & Notification Settings (Sidebar Tab)
Navigate to **Settings** from the left sidebar navigation menu to customize your profile, update credentials, and manage notification preferences:

1. **Profile & Account Settings (Profile Tab):**
   - **Update Full Name:** Modify your display name shown in lobbies, scoreboards, and certificates.
   - **Avatar Customization:** Upload or change your profile picture/avatar.
   - **Password Security:** Change your account password by entering your current password, new password, and password confirmation.
2. **Notification Settings (Notification Settings Tab):**
   - **Notification Email:** Specify or update the email address designated for receiving system alerts and exam notifications.
   - **Delivery Channels:** Enable or disable **Email Notifications** and **In-App Alerts**.
   - **Event Preferences:** Toggle specific notification triggers:
     - 🔔 System Announcements & Maintenance Alerts.
     - 📝 Exam Assignments & Due Date Reminders.
     - 🎮 Live Quiz Room Invites.
     - 📊 Exam Results & Grade Publications.

### 3.8 AI Support Assistant (Quizzy)
QuizzApp includes an intelligent AI Support Chatbot (**Quizzy**) available on all pages to provide instant help, answer platform questions, and assist with user workflows:

1. **How to Access the AI Assistant:**
   - **Header Bar:** Click **AI Help** in the top navigation header.
   - **Floating Chat Bubble:** Click the floating **Chat Bubble** icon located at the bottom-right corner of your screen.
2. **AI Assistant Capabilities:**
   - **App Guidance:** Ask how to navigate features, join live rooms, or create study groups.
   - **Troubleshooting:** Get quick solutions for connection issues, password resets, or exam submission rules.
   - **Study & Quiz Tips:** Ask for explanations of study topics, question strategies, or platform features.

---

## 4. User Guide - Host Features

Any registered User can act as a Host to create and manage quiz content:

### 4.1 Question Bank Management & Manual Question Creation
The **Question Bank** is a centralized storage repository where hosts can create, organize, and manage questions for future reuse across multiple quizzes and formal exams.

1. **Navigation Path:** From the sidebar menu, click **Host Studio** -> select **Create New Quiz** -> navigate to the **Question Bank** tab.
2. **Adding a Question:** Click **Add Question**.
3. **Choose Question Type:**
   - **Single Choice:** One correct answer option.
   - **Multiple Choice:** Multiple valid answer choices.
   - **True / False:** Binary choice statement.
4. **Configure Question Metadata:**
   - Enter the question prompt and option text.
   - Set difficulty levels (**Easy**, **Medium**, **Hard**).
   - Assign points/score weight.
5. **Save & Re-use:** Save the question to your personal repository or subject category for quick assembly into future quiz sets and exams.

### 4.2 AI Question Generation & Variant Creation (PDF / DOCX RAG)
Save hours of manual question drafting with our integrated **Google Gemini & LangChain RAG Engine** located directly within the **Host Studio -> Create New Quiz** suite:

1. **Document Upload (PDF & DOCX):**
   - Upload lecture slides, syllabus files, or textbook documents in **PDF** (`.pdf`) or Word **DOCX** (`.docx`) format.
2. **Prompt & Difficulty Configuration:**
   - Enter custom generation instructions/prompts (e.g., *Focus on Chapter 3 key definitions and formula applications*).
   - Select target difficulty levels (**Easy**, **Medium**, **Hard**) and quantity of questions to generate.
3. **AI Question Variant Generator:**
   - **Create Question Variants:** Use AI to automatically generate multiple **paraphrased variants** or alternative question versions from a single base question.
   - **Exam Diversification:** Having multiple question variants ensures diverse question sets across different exam papers, preventing plagiarism and cheating.
4. **Review & Import to Question Bank:**
   - Review, edit, or fine-tune AI-generated questions and variants, then click **Import to Question Bank** to save them for reuse.

### 4.3 Hosting Real-Time Quiz Lobbies
1. Go to **Live Rooms** and click **Create Room**.
2. Select a quiz set from your Question Bank.
3. Configure room settings:
   - **Time per Question** (e.g., 15s, 30s, 60s).
   - **Max Players** capacity.
   - **Shuffle Options & Questions** toggle.
4. Click **Launch Room** to generate a unique **PIN Code**.
5. Share the PIN code or room QR code with your participants.
6. Once players have joined the lobby, click **Start Game**.

### 4.4 Creating & Distributing Exam Papers
1. Navigate to **Exam Papers** -> **Create Paper**.
2. Fill in paper title, time duration (e.g., 45 minutes), and passing score percentage.
3. Select questions manually or click **Auto-Assemble** to randomly pick questions based on difficulty filters.
4. Publish the exam paper and assign it to specific student classes or groups.

### 4.5 Creating & Managing Study Groups (My Study Groups Sidebar)
Navigate to **My Study Groups** from the left sidebar navigation menu to create private study communities, invite members, and monitor group progress:

1. **Creating a New Study Group:**
   - Click **Create Group** on the My Study Groups page.
   - Enter group name, description, category, and privacy settings (Public vs Private).
   - Generate a unique **Group Join Code** or invite link to share with participants.
2. **Inviting & Managing Members:**
   - Share the Group Join Code with students or peers to allow instant enrollment.
   - View the active **Group Roster / Member List**.
   - Manage member roles, approve pending join requests, or remove inactive members if necessary.
3. **Exporting Member Progress & Performance Reports:**
   - Access the **Group Analytics & Progress** tab.
   - Track member metrics, including average scores, number of exams taken/completed, quiz participation rates, and study streaks.
   - Click **Export Progress Report** to download comprehensive member performance data in Excel (`.xlsx`) or CSV format for grading and progress tracking.

### 4.6 Managing & Grading Assigned Exams (My Assigned Exams Sidebar)
Navigate to **My Assigned Exams** from the sidebar menu to issue exams to study groups, review individual member scores, adjust grades, and analyze question difficulty:

1. **Assigning Exams to Study Groups:**
   - Select an exam paper from your published collection.
   - Choose target **Study Groups** or individual members, configure submission deadlines, and click **Assign Exam**.
2. **Reviewing Member Scores & Answer Submissions:**
   - Open the **Exam Results Dashboard** for any assigned exam.
   - Inspect individual member scores, completion timestamps, time spent per question, and submission status.
3. **Question Error Analysis (Most Missed Questions):**
   - View **Item Analysis** to identify questions with high error rates (questions most frequently answered incorrectly by group members).
   - Identify specific knowledge gaps to address during review sessions.
4. **Manual Score Editing & Grade Override:**
   - Click on any member's submission card to inspect their exact answers.
   - **Grade Adjustment:** Manually edit or override scores for specific question responses (e.g., partial credit or regrading disputed items).
   - Save adjustments to automatically update the member's official score and group ranking.
5. **Exporting Group Exam Reports:**
   - Click **Export to Excel** to download comprehensive exam results in Excel (`.xlsx`) format, including full score sheets, member breakdown, and question accuracy statistics.

### 4.7 Analytics & Performance Reports
1. Navigate to **Analytics** from the Host menu.
2. View average scores, grade distributions, and completion rates.
3. Inspect **Question Difficulty Analysis** to identify topics where participants faced the most difficulty.
4. Click **Export Report** to download results in Excel/CSV format.

---

## 5. Super Admin Guide

### 5.1 Super Admin Overview
A **Super Admin** oversees platform-wide operations and administration, including:
* Monitoring system activity and performance.
* Managing user accounts, roles, and account statuses.
* Managing quizzes and monitoring live rooms.
* Reviewing reports and administrative notifications.
* Managing achievements and system broadcasts.
* Configuring system-wide notification settings.
Detailed instructions for each administrative function are provided in the following sections.
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

## 6. Troubleshooting & FAQ

#### Q: The WebSocket connection drops during a live quiz room. What should I do?
* **A:** Check your internet connection. QuizzApp will automatically attempt to reconnect to the Redis/WebSocket pub-sub server. If the connection fails, refresh the page and re-enter the room PIN.

#### Q: What file formats are supported for AI Quiz Generation?
* **A:** Currently, PDF (`.pdf`) and plain text (`.txt`) files up to 10MB are supported.

#### Q: How is scoring calculated in live multiplayer rooms?
* **A:** Scores combine **correctness** (base score) and **response speed** (bonus score). Faster correct answers yield higher points!

---

*For further assistance or technical support, please contact the system administrator.*
