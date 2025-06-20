# Secure Message Sharer with Supabase

This project is a simple web application that allows users to save a secret message and receive a 9-digit code. This code can then be used by someone else (or the same user) to retrieve the message once, after which the message is deleted from the database.

The application is built with HTML, CSS, and vanilla JavaScript, and uses Supabase as the backend for database storage.

## Features

*   Save a message and get a unique 9-digit access code.
*   Retrieve the message using the access code.
*   Message is automatically deleted from the database after being read once.

## Project Structure

*   `index.html`: The main HTML file containing the structure of the web page.
*   `style.css`: Contains the CSS styles for the application.
*   `script.js`: Handles the application logic, including communication with Supabase.

## Setup and Configuration

To run this project, you need to have a Supabase account and project.

1.  **Clone the Repository (or download the files):**
    ```bash
    # If it were a git repo, you'd clone it
    # For now, ensure you have index.html, style.css, and script.js
    ```

2.  **Set up Supabase:**
    *   Go to [Supabase.io](https://supabase.io/) and create a new project if you don't have one.
    *   Inside your Supabase project, go to the "Table Editor" (or "Database" -> "Tables").
    *   Create a new table named `messages`.

    *   **Note:** You can either create the table and columns manually as described below, or use the provided `db.sql` script in your Supabase SQL editor to set it up quickly. The script includes table creation, column definitions, a unique constraint, and basic Row Level Security policies. (See "Using `db.sql`" subsection below).

    *   Define the following columns for the `messages` table if setting up manually:
        *   `id`: `bigint` (Primary Key, auto-incrementing). You can set this up by clicking the key icon and enabling "Is Identity".
        *   `created_at`: `timestamptz` (Timestamp with time zone, default value `now()`).
        *   `message_text`: `text` (Should allow `null` if you want, but the app expects text).
        *   `access_code`: `text` (This will store the 9-digit code).
            *   **Important:** It's highly recommended to add a **unique constraint** to the `access_code` column to prevent duplicate codes. You can do this in the table editor advanced settings or via SQL:
              ```sql
              ALTER TABLE messages
              ADD CONSTRAINT messages_access_code_key UNIQUE (access_code);
              ```
              (The application's save function has basic retry logic for duplicate codes if this constraint causes an error on insert, but a DB-level unique constraint is more robust).

    *   ### Using `db.sql`
        1. Navigate to the SQL Editor in your Supabase project (Database -> SQL Editor).
        2. Click "+ New query".
        3. Copy the entire content of the `db.sql` file from this repository.
        4. Paste it into the Supabase SQL editor.
        5. Click "RUN".
        This will create the `messages` table with the required schema and basic RLS policies.

3.  **Update Supabase Credentials in `script.js`:**
    *   Open the `script.js` file.
    *   Find the following lines:
        ```javascript
        const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- Replace this
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- Replace this
        ```
    *   Replace `'YOUR_SUPABASE_URL'` with your actual Supabase Project URL.
    *   Replace `'YOUR_SUPABASE_ANON_KEY'` with your actual Supabase Project Anon Key.
        *   You can find these in your Supabase project settings: "Project Settings" -> "API". Use the `anon` `public` key.

4.  **Open `index.html` in Your Browser:**
    *   Once the credentials are set up, simply open the `index.html` file in a web browser to use the application.

## How to Use

1.  **Saving a Message:**
    *   Type your secret message into the "Write your secret message here..." textarea.
    *   Click the "Save Message & Get Code" button.
    *   Your unique 9-digit access code will be displayed below the button. Copy this code.

2.  **Reading a Message:**
    *   Enter the 9-digit access code into the "Enter 9-digit code" input field.
    *   Click the "Read Message" button.
    *   The message will be displayed in the area below the button.
    *   Once the message is displayed, it is automatically deleted from the database and cannot be retrieved again with the same code.

## Important Notes

*   **Security of Supabase Keys:** The Supabase Anon Key is public and is meant to be used in client-side applications. Ensure your database has appropriate Row Level Security (RLS) policies if you are concerned about unauthorized access beyond what this application does. For this specific application, since messages are deleted after reading and codes are random, RLS might be overkill for basic use but is good practice for more complex apps. The `messages` table should typically allow public `insert` and `select`, and `delete` based on the access code.
*   **Code Uniqueness:** The `generateAccessCode()` function in `script.js` creates a random 9-digit code. While the chance of collision is low for a small number of messages, it's not cryptographically guaranteed to be unique for a very large number of messages. The unique constraint on the `access_code` column in Supabase is a good safeguard.
*   **Error Handling:** The application has basic error handling for common issues (e.g., message not found, database connection issues). Check the browser's developer console for more detailed error messages if needed.

This project serves as a basic example of integrating Supabase with a client-side JavaScript application.
