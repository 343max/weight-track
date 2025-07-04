### **Project Requirements Document: Simple Weight Tracker**

---

### **1. Introduction**

#### **1.1 Project Overview**

This document outlines the requirements for a simple, collaborative weight tracking web application. The primary purpose is to allow a small, trusted group of friends to log their weight weekly and view each other's progress in a shared interface. The application prioritizes simplicity, real-time updates, and ease of use over security and complex user management.

#### **1.2 Target Audience**

A small, private group of friends who trust each other with full access to the application's data.

#### **1.3 Key Goals**

- Provide a single, shared view of all participants' weight entries.
- Enable real-time updates so users can see changes as they happen.
- Offer a simple and intuitive data entry process.
- Visualize weekly weight changes (gain/loss).
- Ensure the interface is functional on both mobile and desktop devices.

---

### **2. Scope**

#### **2.1 In-Scope Features**

- A single-page web application built with React.
- Shared access via a URL with a secret GET parameter.
- A table-based UI displaying users and their weight entries.
- Manual data entry and editing of weight values.
- Automatic saving of data on input blur or after a short typing delay.
- Visual indicators for weekly weight gain, loss, or no change.
- Backend data storage using an SQLite database and powered by the Bun runtime.

#### **2.2 Out-of-Scope Features**

- **User Authentication:** No individual user logins, passwords, or session management.
- **User Management UI:** There will be no interface for creating, deleting, or editing users. This will be handled manually via direct database access.
- **Complex Security:** The application will not have robust security measures. Access is controlled solely by the shared secret link.
- **Advanced Analytics:** No complex charts or reporting features are required for this version.
- **User Roles/Permissions:** All users with the link have full administrative/editing rights.

---

### **3. Functional Requirements**

#### **3.1 Access Control**

- **Shared Secret Link:** Access to the application is gated by a secret token.
- **GET Parameter:** The token must be provided as a GET parameter named `secret` in the URL.
  - **Example:** `https://weighttracker.example/?secret=donttellanyone`
- **Server-Side Validation:** The backend server will validate the `secret` value from the URL against a value configured via an environment variable (see section 5.3).
- **Access Denial:** If the `secret` parameter is missing or does not match the configured value, the server should serve a simple page displaying an "You are not authorized" message.

#### **3.2 User Interface (UI) and Interaction**

- **Layout:** The primary UI will be a single data table rendered as a React component.
- Pinch to zoom should be disabled
- all weight columns should have a fixed width of 80px
- **Responsiveness:** The layout must be responsive for both mobile and desktop screens.
- **Dark/Light Mode:** The application will automatically adapt to the user's operating system's dark or light mode preference using CSS media queries (`prefers-color-scheme`). No manual toggle switch will be provided.
- **Table Structure:**
  - **Rows:** Each row will represent a single user.
  - **First Column (User Names):** The first column will display the user's name. The user's assigned color may be used as a background for this cell.
  - **Subsequent Columns (Dates):** Each subsequent column will represent a specific date where weight has been logged.
- **Horizontal Scrolling:** The table body shall scroll horizontally to accommodate a growing number of entries.
- **Sticky First Column:** The first column, containing user names, must remain fixed ("sticky") on the left side of the viewport while the date columns are scrolled horizontally.
- **Default Scroll Position:** Upon initial page load, the horizontal scroll position of the table must be automatically set to the far right, ensuring the most recent date columns are immediately visible.

#### **3.3 Data Entry & Management**

- **Input Fields:** Users will enter their weight in kilograms into HTML input fields with `type="number"`. This provides a more appropriate user interface on mobile devices (e.g., showing a number pad).
- **Input Validation:** If a user enters an invalid value (e.g., non-numeric text), the input field shall perform a "shake" animation and immediately revert to its last known valid value.
- **Data Precision:**
  - Users can enter values with any number of decimal places (e.g., `85.25`).
  - The system shall round the input to one decimal place before storing it (e.g., `85.25` becomes `85.3`).
- **Editing:** Users can edit any weight entry for any date at any time.
- **Auto-Save:** Data must be saved to the server automatically. This is triggered by whichever of the following events occurs first:
  1.  When an input field loses focus (**On Blur**).
  2.  2 seconds after the user has stopped typing in an input field.

#### **3.5 Weekly Change Indicator**

- **Trigger:** This feature activates after a weight value has been successfully saved and the input field is no longer active.
- **Logic:** The system will compare the newly entered weight with that user's most recent previous entry.
- **Display Format:** The indicator will appear behind the weight value in the following format:
  - **Weight Loss:** The text will be colored **green**. Example: `85.5 kg (↓ 0.5)`
  - **Weight Gain:** The text will be colored **red**. Example: `86.7 kg (↑ 1.2)`
  - **No Change:** Example: `85.5 kg (–)`

#### **3.6 Date Column Generation Logic**

The application shall dynamically generate the date columns based on the following rules:

- **Rule 1: Initial State (No Data)**

  - If the database contains no weight entries, the table will display a single date column. The date for this column will be today's date if it is a Friday, otherwise it will be the date of the most recent past Friday.

- **Rule 2: Existing Data State**
  - If data exists, the application will display columns for all dates that have entries.
  - It will identify the most recent date with any entry (`lastEntryDate`).
  - It will then determine the target date (today's date if it's a Friday, or the most recent past Friday).
  - The application will automatically generate empty placeholder columns for **every Friday** that falls between `lastEntryDate` and the target date, ensuring no weekly slot is missed.

---

### **4. Non-Functional Requirements**

- **Performance:** The UI should be fast and responsive, with real-time updates appearing with minimal latency.
- **Usability:** The interface must be extremely simple and self-explanatory.

---

### **5. Technical Stack & Data Model**

#### **5.1 Architecture**

- **Backend:** A JavaScript/TypeScript application running on the **Bun** runtime. It will be responsible for:
  - Hosting the API endpoints.
  - Validating the access secret.
  - Serving the static frontend application files.
- **Frontend:** A Single-Page Application (SPA) developed using the **React** library.
  - **Build Tool:** **Vite** will be used for development and building.
  - **Styling:** **Tailwind CSS** will be used for all styling.
- **Database:** **SQLite**. A single database file will be stored on the server.

#### **5.2 Data Model**

The database will contain two primary tables:

**1. `Users` Table**

- Schema:
  - `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
  - `name` (TEXT, NOT NULL)
  - `color` (TEXT) - e.g., `#FF5733`

**2. `Weights` Table**

- Schema:
  - `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
  - `user_id` (INTEGER, NOT NULL, FOREIGN KEY(`Users.id`))
  - `date` (TEXT, NOT NULL) - Format: `YYYY-MM-DD`
  - `weight_kg` (REAL, NOT NULL)
- Constraint: `UNIQUE(user_id, date)`

#### **5.3 Configuration**

- Application configuration will be managed via environment variables.
- **`APP_SECRET`**: This environment variable will store the secret token required for access control. The server should not start if this variable is not set.
- **`DATABASE_PATH`**: This environment variable will specify the file path for the SQLite database (e.g., `./data/tracker.db`). The server will use this path to connect to the database.
