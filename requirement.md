**UniTree**
**Product Requirements Document**

**1. INTRODUCTION**

**1.1 Purpose**
The "UniTree" application encourages university/college students to attend classes by rewarding points for time connected to the institution's designated WiFi network. These points can be redeemed for real seedlings planted on their behalf. Students can track their corresponding virtual tree and its growth through the app, thereby fostering environmental awareness, a sense of contribution, and engagement with academic commitments.

**1.2 Scope**
*   **Target Users:** University/college students.
*   **Platform:** Mobile application (iOS and Android).
*   **Key Features:**
    *   Campus WiFi-based class presence/attendance tracking.
    *   Point accumulation for connecting to campus WiFi during valid periods.
    *   Redemption of points for seedlings or mature trees (event-dependent).
    *   Virtual tree profile and growth tracking linked to a real planted tree.
    *   Admin dashboard for user management, redemption processing, tree data management, and event creation.
    *   Group/class point accumulation feature.

**2. FUNCTIONAL REQUIREMENTS**

**2.1 User Registration & Authentication**
*   **FR1: Student Registration:**
    *   Users will be able to register using their official university email address, student ID (optional, for internal verification if needed), and a secure password.
    *   The system will verify student status by validating the university email domain (e.g., @university.edu).
    *   Password policies (e.g., minimum length, complexity) will be enforced.
*   **FR2: Login/Logout:**
    *   Users will be able to log in securely using their registered email and password.
    *   The system will provide a "Forgot Password" recovery mechanism.
    *   Users will be able to log out of their accounts.

**2.2 WiFi-based Presence & Time Tracking**
*   **FR3: Automatic Campus WiFi Detection:**
    *   The application will automatically detect when the user's device connects to one of the pre-designated campus WiFi networks (by SSID).
    *   The application will periodically re-validate the connection to ensure it is still active on the designated campus WiFi.
*   **FR4: Valid Tracking Timeframes:**
    *   The system will only track connection time during pre-defined valid periods (e.g., standard university operating hours, weekdays).
    *   (Future Enhancement, Post-MVP): Integration with the university timetable to only track time during students' scheduled class hours. This requires access to timetable data.
    *   The system will ignore connection time outside these valid timeframes (e.g., weekends, holidays, late nights unless specified).
*   **FR5: Time-to-Point Conversion:**
    *   The system will convert continuous connection time within valid timeframes into points. Standard rate: 1 hour of connection = 100 points.
    *   Points will be calculated and credited to the user's account, typically daily or at the end of a valid connection session.
    *   There will be a daily earnable point limit, configurable by administrators (e.g., equivalent to 8 hours).

**2.3 Points & Redemption System**
*   **FR6: Points Dashboard:**
    *   Users will be able to view their current total points.
    *   Users will be able to view their history of earning and redeeming points.
    *   The dashboard will display the points needed to redeem a seedling (e.g., "1000 points needed to redeem 1 seedling").
*   **FR6.1: Leaderboard and Redeemed Items Display:**
    *   Users can view their personal point leaderboard.
    *   Users can view the history of trees/items they have redeemed.
    *   (Details about group leaderboards will be described in the Group/Class Point Accumulation section).
*   **FR7: Seedling/Event Tree Redemption:**
    *   **Seedling Redemption:** Users will be able to redeem a certain number of points for a seedling (e.g., 1000 points = 1 seedling). This tree will be planted by organizers/partners.
    *   **Event Tree Redemption:** During special events, users may have the option to use points to redeem a small mature tree to take home and care for themselves (instead of a seedling planted on their behalf). The conditions and redemption points for this case will be specified in each event.
    *   Upon redemption, a request will be sent to administrators for approval (especially for sponsored planted seedlings).
    *   Users will receive a confirmation screen and notification when the redemption request is successful and subsequently approved (if applicable).
    *   A unique Tree ID will be assigned to the user after the seedling is confirmed planted (for the sponsored planting case).

**2.4 Tree Growth Tracking (Applicable for sponsored planted trees)**
*   **FR8: Virtual Tree Profile:**
    *   After a redemption (for a sponsored planted tree) is approved and the tree is planted, the user will have access to a virtual tree profile in the app.
    *   The profile will display:
        *   Assigned Tree ID.
        *   Tree species (can be generic if specific information is initially too complex).
        *   Planting date.
        *   Approximate GPS location or general planting area (respecting privacy/access restrictions of planting sites).
        *   Growth milestones (e.g., "Planted," "Sprouted," "1 Year Old").
*   **FR9: Tree Progress Updates:**
    *   Administrators will be able to upload images and text updates for specific Tree IDs or batches of trees.
    *   Users will receive push notifications when there are new updates or images for their tree(s).

**2.5 Notifications**
*   **FR10: System Notifications:**
    *   Notify users upon successful point accumulation.
    *   Notify users about redemption status (requested, approved, tree planted/received).
    *   Notify users when their tree profile is updated (new photo, new milestone) (applies to sponsored planted trees).
    *   Notify when individual, group, or class points are deducted (e.g., due to violations, or admin adjustments).
*   **FR10.1: Engagement Reminders (Optional, Post-MVP):**
    *   Notify users to connect to campus WiFi if they are detected on campus (via approximate location) but not connected during valid hours.

**2.7 Anti-Fraud Mechanisms**
*   **FR16: WiFi Validation:**
    *   Primarily rely on SSID matching for designated campus WiFi.
    *   (Advanced, Post-MVP): Investigate IP range validation or other network identification methods if spoofing becomes a significant issue. VPN/Hotspot detection is complex and often unreliable.
*   **FR17: Session Monitoring:**
    *   Limit point accumulation to one active session per user account.
    *   Flag accounts with unusually long continuous connection times (e.g., >18 hours/day for extended periods) for admin review.
    *   Add a provision that if a student comes to campus but is marked 'absent' (for a specific class, if timetable integration exists), the accumulated points for that day might be deducted or not counted for the absent period. (Mechanism for detecting 'absent' needs clarification).

**2.8 Group/Class Point Accumulation**
*   **FR18: Group Creation and Management:**
    *   **Group Creation Condition:** A group must have a minimum number of members (e.g., over 15 accounts) to be considered valid and participate in group activities/leaderboards. This number should be configurable by administrators.
    *   **Group Creation Process:** Users (or designated group leaders) can create new groups, set group names, and invite other members to join.
    *   **Group Name:** Determine whether group names can be duplicated. It is recommended that group names be unique for easy management and identification.
    *   **Group Join Limit:** A user account can join a maximum number of groups (e.g., 1 or 2 groups) to simplify point management and statistics.
    *   **Waiting Period for Sufficient Members:** If a newly created group does not reach the required number of members within a specified timeframe (e.g., 2-3 days), the group may be automatically canceled or set to inactive.
*   **FR19: Group and Individual-in-Group Leaderboards:**
    *   Group members will be able to see their group's accumulated points leaderboard compared to other groups.
    *   Members can also view the individual point leaderboard of members within their own group.
*   **FR20: Display of Group's Redeemed Trees/Items:**
    *   Accounts within a group can see the total number of trees (or other items) that the group has collectively redeemed (if there is a common redemption mechanism for the group) or an aggregation from its members.
    *   Clarify how group points are accumulated (e.g., sum of member points, average points, or specific group activities).

**3. NON-FUNCTIONAL REQUIREMENTS**
*   **NFR1: Performance:**
    *   App responsiveness: UI interactions must be smooth.
    *   Point display: Accumulated points should update on the dashboard within a reasonable time after a session ends or daily processing (e.g., within minutes of session end, or next login after daily batch processing). Visual tracking of current session duration can be immediate.
*   **NFR2: Security:**
    *   All user data (passwords, emails, student IDs) must be encrypted at rest and in transit.
    *   Secure API endpoints for app-backend communication.
    *   Protection against common vulnerabilities (e.g., OWASP Top 10).
*   **NFR3: Compatibility:**
    *   Support iOS (latest version and one major version prior, e.g., v16+ if current is v17).
    *   Support Android (latest version and several major versions prior due to fragmentation, e.g., v10+).
*   **NFR4: Usability:**
    *   Intuitive and user-friendly UI/UX.
    *   Clear visual feedback for actions.
    *   (Post-MVP): Incorporate gamification elements like progress bars, visual representation of increasing points, badges for milestones.
*   **NFR5: Scalability:**
    *   The backend system should be designed to handle an initial load of up to 2000 concurrent users, with the ability to scale further.
*   **NFR6: Reliability:**
    *   The application must operate reliably with minimal crashes or errors.
    *   WiFi detection must be consistent.
*   **NFR7: Data Integrity:**
    *   Point calculations and redemptions must be accurate and auditable.

**4. DEPENDENCIES**
*   **D1:** Campus WiFi Infrastructure: Access to the list of official campus WiFi SSIDs.
*   **D2:** Tree Planting Partnerships: Collaboration with campus facilities or local environmental organizations to source and plant seedlings (or provide trees for events).
*   **D3:** Supabase Account: A free or paid Supabase account for backend services.
*   **D4:** App Store Accounts: Developer accounts for Apple App Store and Google Play Store for distribution.

**5. ASSUMPTIONS**
*   **A1:** Students generally own and use smartphones capable of WiFi connectivity on campus.
*   **A2:** University/college administration is supportive of this initiative and will provide necessary information (SSIDs, general operating hours).
*   **A3:** A reliable mechanism/partnership for planting and tracking real trees (or providing event trees) can be established and maintained.
*   **A4:** Students will grant necessary app permissions (e.g., WiFi state, notifications, possibly coarse location for future features).

**MINIMUM VIABLE PRODUCT (MVP) FOR "UniTree"**
The MVP will focus on the core loop: connect to campus WiFi -> earn points -> redeem for a tree -> view basic tree profile.
*   **Main MVP Goals:**
    *   Validate the core incentive mechanism.
    *   Test student adoption and engagement.
    *   Establish basic operational flow for redemption and tree planting.
*   **MVP Features - INCLUDED:**
    *   **User Management (Mobile App):**
        *   FR1: Student Registration (University email, password; domain validation).
        *   FR2: Login/Logout (including Forgot Password).
    *   **WiFi Tracking & Points (Mobile App):**
        *   FR3 (Simplified): Automatic detection of connection to a single, primary campus WiFi SSID.
        *   FR4 (Simplified): Track time only during general weekdays (e.g., Mon-Fri, 8 AM - 6 PM), configurable by admin. No complex timetable sync.
        *   FR5: Time-to-Point Conversion (e.g., 1 hr = 100 points), daily limit, daily batch crediting.
    *   **Redemption & Tree (Mobile App):**
        *   FR6: Basic Points Dashboard (current points, points needed for seedling).
        *   FR7 (Simplified): Seedling Redemption (fixed points, only sponsored planted seedling type), request sent to admin. Request confirmation.
        *   FR8 (Simplified): Basic Tree Profile (Tree ID, species (generic like "Deciduous Tree" or "Conifer" if specifics too hard), planting date, general location/area, one initial photo). User views this after admin approval and planting.
    *   **Notifications (Mobile App):**
        *   FR10 (Subset): Notifications for redemption request submitted, redemption approved/tree planted.
    *   **Admin Dashboard (Simple Web Interface):**
        *   FR11 (Subset): View users, activate/deactivate accounts.
        *   FR12: Redemption Management (View requests, Approve/Deny).
        *   FR13 (Subset): For approved redemptions: Assign Tree ID, input basic tree data (species, plant date, area, upload one photo).
        *   FR14 (Simplified): View total users, total redeemed seedlings.

*   **Features - NOT INCLUDED in MVP (for later versions):**
    *   FR3 (Advanced): Multi-SSID support, advanced spoofing validation (IP ranges).
    *   FR4 (Advanced): Synchronization with university timetables for class-specific tracking.
    *   FR6.1 (Full): Detailed leaderboards, detailed redemption history.
    *   FR7 (Advanced): Multiple seedling/item redemption types, including the option to redeem event trees for self-care.
    *   FR8 (Advanced): Detailed growth milestones, interactive maps for GPS.
    *   FR9: Continuous tree progress updates and images beyond the initial photo.
    *   FR10.1: Engagement reminders (connect to WiFi).
    *   FR10 (Full): Point deduction notifications.
    *   FR11 (Advanced): Detailed student analytics for admins.
    *   FR13 (Advanced): Batch updates for trees.
    *   FR14 (Advanced): Comprehensive admin analytics (engagement rates, point trends).
    *   FR15: Full Event Management CMS.
    *   FR16 & FR17 (Advanced): Complex anti-fraud mechanisms beyond basic SSID checks and session limits, mechanism for point deduction for "absent."
    *   **Entire Section 2.8 Group/Class Point Accumulation.**
    *   NFR4 (Advanced): Extended gamification elements (badges, full leaderboards).
    *   Push notifications for point accumulation or tree updates unrelated to redemption.
    *   Student ID as a mandatory field during registration.
    *   Detailed redemption history on the user dashboard.

*   **Key Considerations for MVP Development:**
    *   Simplify WiFi Tracking: Start with one known SSID and broad timeframes.
    *   Manual Admin Processes: Redemption approval and initial tree data entry will be manual for MVP.
    *   Tree Planting Logistics: The process for planting trees post-redemption needs to be solid, even if initially small scale.
    *   Clear Communication: Manage user expectations regarding tree planting timelines and update frequency.