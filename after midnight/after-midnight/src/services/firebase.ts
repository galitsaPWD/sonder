import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import * as Application from 'expo-application';
import { Filter } from 'bad-words';

// Initialize profanity filter
const filter = new Filter();

// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD96rrf0G-CD5JfzFIr27bMynpwBwdJZro",
    authDomain: "after-midnight-4fe34.firebaseapp.com",
    projectId: "after-midnight-4fe34",
    storageBucket: "after-midnight-4fe34.firebasestorage.app",
    messagingSenderId: "460176647110",
    appId: "1:460176647110:android:99c26ea88a0b49ab5a08c7"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
const auth = getAuth(app);

// Authentication State Management
let authPromise: Promise<User> | null = null;

export const ensureAuth = (): Promise<User> => {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    if (authPromise) return authPromise;

    authPromise = new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                unsubscribe();
                resolve(user);
            } else {
                try {
                    const cred = await signInAnonymously(auth);
                    unsubscribe();
                    resolve(cred.user);
                } catch (err) {
                    reject(err);
                }
            }
        });
    });

    return authPromise;
};

// Initialize auth immediately
ensureAuth().catch(err => console.error("[Firebase] Auth Init Failed:", err));

export type Message = {
    id: string;
    text: string;
    userId: string;
    createdAt: Timestamp;
};

// Get unique device ID
let cachedUserId: string | null = null;
export const getUserId = async (): Promise<string> => {
    try {
        const user = await ensureAuth();
        return user.uid;
    } catch (err) {
        console.error("[Firebase] Failed to get Auth UID, falling back to Device ID", err);
        if (cachedUserId) return cachedUserId;

        let userId: string | null = null;
        try {
            userId = await Application.getIosIdForVendorAsync();
        } catch {
            try {
                userId = await Application.getAndroidId();
            } catch {
                userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
        }
        cachedUserId = userId || 'unknown';
        return cachedUserId;
    }
};

// Check if user has already posted a message today
export const hasUserPosted = async (): Promise<boolean> => {
    const userId = await getUserId();
    const cutoff = getTodaysCutoff();

    const q = query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        where('createdAt', '>=', cutoff)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

// Get today's cutoff time (4 AM)
const getTodaysCutoff = (): Date => {
    const now = new Date();
    const cutoff = new Date(now);

    // If it's before 4 AM, the cutoff is yesterday at 4 AM
    if (now.getHours() < 4) {
        cutoff.setDate(cutoff.getDate() - 1);
    }

    cutoff.setHours(4, 0, 0, 0);
    return cutoff;
};

// Post a message (enforces one message per user)
export const postMessage = async (text: string): Promise<{ success: boolean; error?: string }> => {
    if (text.length === 0 || text.length > 300) {
        return { success: false, error: 'Message must be between 1 and 300 characters' };
    }

    // Check for profanity
    if (filter.isProfane(text)) {
        return { success: false, error: 'Please keep thoughts clean and kind' };
    }

    // Check if user has already posted
    const alreadyPosted = await hasUserPosted();
    if (alreadyPosted) {
        return { success: false, error: 'You have already released a thought tonight' };
    }

    const userId = await getUserId();

    try {
        await addDoc(collection(db, 'messages'), {
            text,
            userId,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error("Firebase Post Error:", error);
        if (error.code === 'permission-denied') {
            return { success: false, error: 'Permission denied. Check Firebase Rules.' };
        }
        if (error.code === 'failed-precondition') {
            return { success: false, error: 'Missing Index. Check console for link.' };
        }
        return { success: false, error: error.message || 'Failed to post thought to the void' };
    }
};

// Delete all messages (called at 4 AM)
export const deleteAllMessages = async (): Promise<void> => {
    const snapshot = await getDocs(collection(db, 'messages'));
    const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'messages', document.id)));
    await Promise.all(deletePromises);
};

// Subscribe to messages with auto-delete check
export const subscribeToMessages = (callback: (messages: Message[]) => void) => {
    const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
        const now = new Date();
        const cutoff = getTodaysCutoff();

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Message[];

        // NEW LOGIC: Only trigger a full deletion if we actually see "old" messages from a previous session.
        // This prevents deleting fresh messages during daytime testing.
        const oldMessages = messages.filter(m => {
            if (!m.createdAt) return false;
            return m.createdAt.toDate() < cutoff;
        });

        if (oldMessages.length > 0) {
            console.log(`[Firebase] Found ${oldMessages.length} expired messages. Cleaning up...`);
            await deleteAllMessages();
            callback([]);
            return;
        }

        // Filter for messages from current night session (after last 4 AM)
        const currentNightMessages = messages.filter(m => {
            if (!m.createdAt) return true; // Include pending messages
            return m.createdAt.toDate() >= cutoff;
        });

        callback(currentNightMessages);
    });
};

// Report a message
export const reportMessage = async (messageId: string, reason: string = 'inappropriate'): Promise<boolean> => {
    try {
        const userId = await getUserId();
        const reportsRef = collection(db, 'reports');
        await addDoc(reportsRef, {
            messageId,
            reportedBy: userId,
            reason,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error reporting message: ", error);
        return false;
    }
};
