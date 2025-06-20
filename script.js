// script.js

// -----------------------------------------------------------------------------
// Supabase Configuration
// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// -----------------------------------------------------------------------------
const SUPABASE_URL = 'https://ukklianxnqsvbbcdwrep.supabase.co'; // <-- Replace this
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVra2xpYW54bnFzdmJiY2R3cmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzgxNDMsImV4cCI6MjA2NTk1NDE0M30.-fAOjri2cLNcg2G-7wyThMy4451Opk8cfWwzkuT1xMY'; // <-- Replace this

let supabaseClient; // Renamed to avoid confusion
try {
    // The global 'supabase' object is provided by the Supabase CDN script
    // We destructure createClient from it.
    const { createClient } = supabase;
    if (typeof createClient !== 'function') {
        throw new Error("Supabase createClient function not found. Ensure Supabase JS v2 library is loaded correctly.");
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error("Error initializing Supabase client:", e);
    alert("Could not connect to the database. Please check the console for more details. Ensure Supabase URL and Key are correct and the library is loaded.");
}


// -----------------------------------------------------------------------------
// DOM Element References
// -----------------------------------------------------------------------------
const messageInput = document.getElementById('messageInput');
const saveMessageButton = document.getElementById('saveMessageButton');
const accessCodeDisplay = document.getElementById('accessCodeDisplay');

const codeInput = document.getElementById('codeInput');
const readMessageButton = document.getElementById('readMessageButton');
const messageDisplayArea = document.getElementById('messageDisplayArea');

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Generates a random 9-digit string.
 * This is a simple implementation. For true uniqueness guarantee in a high-traffic
 * scenario, the backend (Supabase function or database trigger) might need to
 * ensure code uniqueness before insertion or retry generation.
 * @returns {string} A 9-digit numeric string.
 */
function generateAccessCode() {
    let code = '';
    for (let i = 0; i < 9; i++) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code;
}

/**
 * Displays a temporary message to the user in a given element.
 * @param {HTMLElement} element - The HTML element to display the message in.
 * @param {string} message - The message to display.
 * @param {string} type - 'success' or 'error' to style the message.
 */
function showFeedback(element, message, type = 'error') {
    element.textContent = message;
    element.style.color = type === 'error' ? 'red' : 'green';
    // For non-persistent messages, you might want to clear them after a timeout
}

// Placeholder for next steps (event listeners and Supabase interactions)
console.log("script.js loaded. Supabase client initialized (check console for errors if any).");
console.log("Access code function ready:", generateAccessCode());

// -----------------------------------------------------------------------------
// Event Listener for Saving a Message
// -----------------------------------------------------------------------------
if (saveMessageButton) {
    saveMessageButton.addEventListener('click', async () => {
        if (!supabaseClient) {
            showFeedback(accessCodeDisplay, "Database not connected. Admin: Check credentials.", 'error');
            console.error("Supabase client not initialized.");
            return;
        }

        const messageText = messageInput.value.trim();
        accessCodeDisplay.textContent = '- - - - - - - - -'; // Reset code display
        messageDisplayArea.textContent = 'Your retrieved message will appear here.'; // Reset message display

        if (!messageText) {
            showFeedback(accessCodeDisplay, "Please enter a message.", 'error');
            // Or use a dedicated error display element for the save section
            // For now, reusing accessCodeDisplay for feedback
            return;
        }

        // Disable button to prevent multiple submissions
        saveMessageButton.disabled = true;
        saveMessageButton.textContent = 'Saving...';
        accessCodeDisplay.style.color = '#333'; // Reset color

        const accessCode = generateAccessCode();

        try {
            const { data, error } = await supabaseClient
                .from('messages') // Assuming your table is named 'messages'
                .insert([{ message_text: messageText, access_code: accessCode }])
                .select(); // .select() is optional here, but can be useful

            if (error) {
                console.error('Error saving message:', error);
                let userErrorMessage = 'Could not save message. ';
                if (error.message.includes("violates unique constraint") && error.message.includes("access_code")) {
                    userErrorMessage += 'The generated code already exists. Please try again.';
                } else if (error.message.includes("relation \"messages\" does not exist")) {
                    userErrorMessage += 'Admin: The "messages" table does not exist in the database.';
                } else {
                    userErrorMessage += 'Database error.';
                }
                showFeedback(accessCodeDisplay, userErrorMessage, 'error');
            } else {
                // console.log('Message saved:', data);
                accessCodeDisplay.textContent = accessCode;
                accessCodeDisplay.style.color = '#28a745'; // Green for success
                messageInput.value = ''; // Clear the input field
                showFeedback(messageDisplayArea, 'Message saved successfully! Use the code above to retrieve it.', 'success');

            }
        } catch (err) {
            console.error('Unexpected error saving message:', err);
            showFeedback(accessCodeDisplay, 'An unexpected error occurred. Please try again.', 'error');
        } finally {
            // Re-enable button
            saveMessageButton.disabled = false;
            saveMessageButton.textContent = 'Save Message & Get Code';
        }
    });
} else {
    console.error("Save Message Button not found in the DOM.");
}

// -----------------------------------------------------------------------------
// Event Listener for Reading a Message
// -----------------------------------------------------------------------------
if (readMessageButton) {
    readMessageButton.addEventListener('click', async () => {
        if (!supabaseClient) {
            showFeedback(messageDisplayArea, "Database not connected. Admin: Check credentials.", 'error');
            console.error("Supabase client not initialized.");
            return;
        }

        const enteredCode = codeInput.value.trim();
        messageDisplayArea.textContent = 'Your retrieved message will appear here.'; // Reset message display
        messageDisplayArea.style.color = '#555'; // Reset color

        if (!enteredCode || enteredCode.length !== 9 || !/^\d{9}$/.test(enteredCode)) {
            showFeedback(messageDisplayArea, "Please enter a valid 9-digit code.", 'error');
            return;
        }

        // Disable button
        readMessageButton.disabled = true;
        readMessageButton.textContent = 'Reading...';

        try {
            // 1. Fetch the message
            const { data: messages, error: fetchError } = await supabaseClient
                .from('messages')
                .select('id, message_text') // Select id for deletion, and message_text
                .eq('access_code', enteredCode)
                .single(); // Use .single() as access_code should be unique

            if (fetchError || !messages) {
                if (fetchError && fetchError.code === 'PGRST116') { // PostgREST error for "Fetched zero rows"
                     showFeedback(messageDisplayArea, 'Message not found or already read.', 'error');
                } else if (fetchError) {
                    console.error('Error fetching message:', fetchError);
                    showFeedback(messageDisplayArea, 'Could not retrieve message. Database error.', 'error');
                } else {
                     showFeedback(messageDisplayArea, 'Message not found or already read.', 'error');
                }
                return;
            }

            // Message found
            const messageText = messages.message_text;
            const messageId = messages.id; // Assuming you have an 'id' column

            showFeedback(messageDisplayArea, messageText, 'success'); // Display the message
            codeInput.value = ''; // Clear the code input field

            // 2. Delete the message
            // We use the messageId for a more precise deletion, if available.
            // Otherwise, could delete by access_code again but ID is safer if codes weren't strictly unique.
            const { error: deleteError } = await supabaseClient
                .from('messages')
                .delete()
                .eq(messageId ? 'id' : 'access_code', messageId ? messageId : enteredCode);

            if (deleteError) {
                console.error('Error deleting message:', deleteError);
                // Optionally inform user, but the primary goal (reading) was achieved.
                // Maybe add a small note or log it.
                // For now, just logging it.
                alert("The message was displayed, but an error occurred while trying to delete it from the database. It might still exist.");
            } else {
                console.log('Message deleted successfully after reading.');
                 // Add a small confirmation if desired, e.g., append to messageDisplayArea or a new status line.
            }

        } catch (err) {
            console.error('Unexpected error reading message:', err);
            showFeedback(messageDisplayArea, 'An unexpected error occurred. Please try again.', 'error');
        } finally {
            // Re-enable button
            readMessageButton.disabled = false;
            readMessageButton.textContent = 'Read Message';
        }
    });
} else {
    console.error("Read Message Button not found in the DOM.");
}
