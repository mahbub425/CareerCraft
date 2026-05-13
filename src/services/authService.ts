import { account } from '../lib/appwrite';
import { ID } from 'appwrite';
import { cvService } from './cvService';

const getEmailVerificationUrl = () => `${window.location.origin}/verify-email`;

const clearCurrentSession = async () => {
  try {
    await account.deleteSession('current');
  } catch {
    // No active session to clear.
  }
};

export const authService = {
  // Register a new user
  register: async (email: string, password: string, name: string, userType = 'Student') => {
    try {
      await clearCurrentSession();

      // First try to create the account
      let user;
      try {
        user = await account.create(ID.unique(), email, password, name);
      } catch (createError: any) {
        // If user already exists, try to login instead
        if (createError.message?.includes('already exists') || createError.code === 409) {
          try {
            // Try to login with the provided credentials
            const session = await account.createEmailPasswordSession(email, password);
            user = await account.get();

            // Check if user profile exists, create if not
            try {
              await cvService.getUserProfile(user.$id);
            } catch {
              // Profile doesn't exist, try to create it
              try {
                await cvService.createUserProfile(user, userType);
              } catch (profileError) {
                console.warn('Failed to create user profile for existing user:', profileError);
                // Don't throw here - user can still login
              }
            }

            if (!user.emailVerification) {
              try {
                await account.createVerification({ url: getEmailVerificationUrl() });
              } catch (verificationError) {
                console.warn('Failed to resend verification email for existing user:', verificationError);
              }
            }

            return { session, isNewRegistration: false };
          } catch (loginError: any) {
            // If login fails, the account exists but password is wrong
            if (loginError.message?.includes('Invalid credentials') || loginError.code === 401) {
              throw new Error('An account with this email already exists. Please try logging in with your existing password, or reset your password if you forgot it.');
            }
            throw loginError;
          }
        }
        throw createError;
      }

      // If account creation succeeded, logout before returning
      // so user needs to log in manually after the verification email is sent.
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      // Try to create user profile, but don't fail registration if it fails
      try {
        await cvService.createUserProfile(currentUser, userType);
      } catch (profileError) {
        console.warn('Failed to create user profile, but registration succeeded:', profileError);
      }

      try {
        await account.createVerification({ url: getEmailVerificationUrl() });
      } catch (verificationError) {
        console.warn('Failed to send verification email, but registration succeeded:', verificationError);
      }

      await clearCurrentSession();

      // Return success flag indicating new registration
      return { session: null, isNewRegistration: true, email };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      await clearCurrentSession();
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      try {
        let existingType: 'Student' | 'Fresh Graduate' | 'Professional' = 'Student';
        try {
          const existingProfile = await cvService.getUserProfile(user.$id);
          existingType = existingProfile.user_type;
        } catch {
          // Keep the default for first-time profile sync.
        }
        await cvService.upsertUserProfile(user.$id, {
          full_name: user.name,
          email: user.email,
          user_type: existingType,
          role: user.labels?.includes('admin') ? 'Admin' : 'User',
          status: 'Active',
          last_login: new Date().toISOString(),
        });
      } catch {
        // Profile sync is helpful but should not block login.
      }
      return session;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Resend email verification for the currently logged-in user
  sendEmailVerification: async () => {
    try {
      return await account.createVerification({ url: getEmailVerificationUrl() });
    } catch (error) {
      console.error('Email verification send error:', error);
      throw error;
    }
  },

  // Complete email verification from Appwrite redirect URL
  verifyEmail: async (userId: string, secret: string) => {
    try {
      return await account.updateVerification({ userId, secret });
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user session
  getCurrentUser: async () => {
    try {
      return await account.get();
    } catch (error) {
      // User is not logged in
      return null;
    }
  },

  isAdminUser: (user: { labels?: string[] } | null) => {
    return Boolean(user?.labels?.includes('admin'));
  },
};
