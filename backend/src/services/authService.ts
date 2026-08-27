import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../database/client';
import { generateToken } from '../utils/jwt';
import { config } from '../config';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface GoogleAuthDTO {
  credential?: string; // Google ID token
}

// In-Memory Resilient Fallback Store
const memoryUsers = new Map<string, any>();
const memoryResetTokens = new Map<string, { email: string; expires: number }>();
const memoryWatchlists = new Map<string, any[]>();
const memoryPortfolios = new Map<string, any>();

export class AuthService {
  // Password Strength Validator
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw { statusCode: 400, message: 'Password must be at least 8 characters long.' };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || (!hasNumber && !hasSpecial)) {
      throw {
        statusCode: 400,
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character.',
      };
    }
  }

  // Email format validator
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw { statusCode: 400, message: 'Please enter a valid email address.' };
    }
  }

  // 1. Email + Password Sign Up
  public async register(dto: RegisterDTO) {
    this.validateEmail(dto.email);
    this.validatePasswordStrength(dto.password);

    const emailLower = dto.email.toLowerCase().trim();
    const nameTrimmed = dto.name ? dto.name.trim() : emailLower.split('@')[0];

    // Try PostgreSQL via Prisma
    try {
      const existing = await prisma.user.findUnique({ where: { email: emailLower } });
      if (existing) {
        throw { statusCode: 400, message: 'An account with this email address already exists.' };
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const user = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email: emailLower,
            passwordHash,
            name: nameTrimmed,
            authProvider: 'email',
            lastLoginAt: new Date(),
            virtualCash: 100000.00,
          },
        });

        await tx.portfolio.create({
          data: {
            userId: newUser.id,
            cashBalance: 100000.00,
            investedAmount: 0.00,
            realizedPnL: 0.00,
          },
        });

        await tx.watchlist.create({
          data: {
            userId: newUser.id,
            name: 'Main Tech Watchlist',
            isDefault: true,
            items: {
              create: [
                { symbol: 'AAPL' },
                { symbol: 'TSLA' },
                { symbol: 'NVDA' },
                { symbol: 'MSFT' },
                { symbol: 'BTCUSDT' },
              ],
            },
          },
        });

        await tx.userPreference.create({
          data: {
            userId: newUser.id,
            defaultTimeframe: '1D',
            defaultIndicators: JSON.stringify(['SMA_20', 'RSI_14']),
          },
        });

        return newUser;
      });

      const token = generateToken({ userId: user.id, email: user.email });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: (user as any).profileImage || null,
          authProvider: (user as any).authProvider || 'email',
          googleId: (user as any).googleId || null,
          virtualCash: Number(user.virtualCash),
          createdAt: user.createdAt,
        },
      };
    } catch (err: any) {
      if (err.statusCode === 400) throw err;
      console.warn('[AuthService] PostgreSQL unavailable, utilizing resilient in-memory session.');
    }

    // In-memory fallback
    if (memoryUsers.has(emailLower)) {
      throw { statusCode: 400, message: 'An account with this email address already exists.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const userId = 'user_' + Math.random().toString(36).substring(2, 9);

    const userObj = {
      id: userId,
      email: emailLower,
      passwordHash,
      name: nameTrimmed,
      profileImage: null,
      authProvider: 'email',
      googleId: null,
      virtualCash: 100000.00,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    memoryUsers.set(emailLower, userObj);

    memoryPortfolios.set(userId, {
      id: 'port_' + userId,
      userId,
      cashBalance: 100000.00,
      investedAmount: 0.00,
      realizedPnL: 0.00,
      holdings: [],
    });

    memoryWatchlists.set(userId, [
      {
        id: 'wl_default_' + userId,
        userId,
        name: 'Main Tech Watchlist',
        isDefault: true,
        items: [
          { id: '1', symbol: 'AAPL', name: 'Apple Inc.' },
          { id: '2', symbol: 'TSLA', name: 'Tesla, Inc.' },
          { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp.' },
          { id: '4', symbol: 'MSFT', name: 'Microsoft Corp.' },
          { id: '5', symbol: 'BTCUSDT', name: 'Bitcoin (BTC/USDT)' },
        ],
      },
    ]);

    const token = generateToken({ userId, email: emailLower });
    return {
      token,
      user: {
        id: userId,
        email: emailLower,
        name: nameTrimmed,
        profileImage: null,
        authProvider: 'email',
        googleId: null,
        virtualCash: 100000.00,
        createdAt: userObj.createdAt,
      },
    };
  }

  // 2. Email + Password Login
  public async login(dto: LoginDTO) {
    this.validateEmail(dto.email);
    if (!dto.password) {
      throw { statusCode: 400, message: 'Password is required.' };
    }

    const emailLower = dto.email.toLowerCase().trim();

    // Try PostgreSQL via Prisma
    try {
      const user = await prisma.user.findUnique({ where: { email: emailLower } });

      if (!user || !user.passwordHash) {
        throw { statusCode: 400, message: 'Invalid email or password' };
      }

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw { statusCode: 400, message: 'Invalid email or password' };
      }

      // Update lastLoginAt
      try {
        await (prisma.user as any).update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch {}

      const token = generateToken({ userId: user.id, email: user.email });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: (user as any).profileImage || null,
          authProvider: (user as any).authProvider || 'email',
          googleId: (user as any).googleId || null,
          virtualCash: Number(user.virtualCash),
          createdAt: user.createdAt,
        },
      };
    } catch (err: any) {
      if (err.statusCode === 400) throw err;
      console.warn('[AuthService] DB query failed, attempting in-memory authentication check.');
    }

    // In-memory fallback
    const memUser = memoryUsers.get(emailLower);
    if (!memUser || !memUser.passwordHash) {
      throw { statusCode: 400, message: 'Invalid email or password' };
    }

    const isMatch = await bcrypt.compare(dto.password, memUser.passwordHash);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Invalid email or password' };
    }

    memUser.lastLoginAt = new Date();

    const token = generateToken({ userId: memUser.id, email: memUser.email });
    return {
      token,
      user: {
        id: memUser.id,
        email: memUser.email,
        name: memUser.name,
        profileImage: memUser.profileImage || null,
        authProvider: memUser.authProvider || 'email',
        googleId: memUser.googleId || null,
        virtualCash: memUser.virtualCash,
        createdAt: memUser.createdAt,
      },
    };
  }

  // 3. Google Sign-In & Registration
  public async googleAuth(dto: GoogleAuthDTO) {
    if (!dto || !dto.credential) {
      throw { statusCode: 400, message: 'Google authentication failed: credential ID token is required.' };
    }

    if (!config.googleClientId) {
      throw { statusCode: 500, message: 'Google Client ID is not configured on the backend server.' };
    }

    let googleId: string;
    let emailLower: string;
    let finalName: string;
    let picture: string | null;

    try {
      const client = new OAuth2Client(config.googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: dto.credential,
        audience: config.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google ID token payload.');
      }

      const iss = payload.iss;
      if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
        throw new Error('Invalid Google ID token issuer.');
      }

      if (payload.aud !== config.googleClientId) {
        throw new Error('Google ID token audience mismatch.');
      }

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Google ID token has expired.');
      }

      if (payload.email_verified !== true) {
        throw new Error('Google account email is not verified.');
      }

      if (!payload.sub || typeof payload.sub !== 'string' || !payload.email) {
        throw new Error('Invalid Google ID token: missing sub or email.');
      }

      googleId = payload.sub;
      emailLower = payload.email.toLowerCase().trim();
      finalName = payload.name || payload.given_name || emailLower.split('@')[0];
      picture = payload.picture || null;
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw { statusCode: 400, message: err.message || 'Google token verification failed.' };
    }

    // Try PostgreSQL via Prisma
    try {
      // First search for returning user by verified Google sub
      let user = await (prisma.user as any).findFirst({
        where: { googleId },
      });

      if (user) {
        // Returning Google user: update last login and profile image
        user = await (prisma.user as any).update({
          where: { id: user.id },
          data: {
            profileImage: picture || user.profileImage,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // User not found by googleId. Check if email already exists in system.
        const existingEmailUser = await (prisma.user as any).findFirst({
          where: { email: emailLower },
        });

        if (existingEmailUser) {
          // Reject request to avoid automatically linking unlinked email/password accounts
          throw {
            statusCode: 400,
            message: 'An account with this email address already exists. Please log in using your password.',
          };
        }

        // Register new Google user
        user = await prisma.$transaction(async (tx: any) => {
          const newUser = await tx.user.create({
            data: {
              email: emailLower,
              name: finalName,
              googleId,
              profileImage: picture,
              authProvider: 'google',
              lastLoginAt: new Date(),
              virtualCash: 100000.00,
            },
          });

          await tx.portfolio.create({
            data: {
              userId: newUser.id,
              cashBalance: 100000.00,
              investedAmount: 0.00,
              realizedPnL: 0.00,
            },
          });

          await tx.watchlist.create({
            data: {
              userId: newUser.id,
              name: 'Main Tech Watchlist',
              isDefault: true,
              items: {
                create: [
                  { symbol: 'AAPL' },
                  { symbol: 'TSLA' },
                  { symbol: 'NVDA' },
                  { symbol: 'MSFT' },
                  { symbol: 'BTCUSDT' },
                ],
              },
            },
          });

          await tx.userPreference.create({
            data: {
              userId: newUser.id,
              defaultTimeframe: '1D',
              defaultIndicators: JSON.stringify(['SMA_20', 'RSI_14']),
            },
          });

          return newUser;
        });
      }

      const token = generateToken({ userId: user.id, email: user.email });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: (user as any).profileImage || picture,
          authProvider: (user as any).authProvider || 'google',
          googleId: (user as any).googleId || googleId,
          virtualCash: Number(user.virtualCash),
          createdAt: user.createdAt,
        },
      };
    } catch (err: any) {
      if (err.statusCode) throw err;
      if (config.nodeEnv === 'production') {
        throw { statusCode: 500, message: 'Database operation failed during Google authentication.' };
      }
      console.warn('[AuthService] DB Google Auth failed, utilizing in-memory fallback:', err?.message);
    }

    // In-memory fallback
    let memUser: any = null;
    for (const u of memoryUsers.values()) {
      if (u.googleId === googleId) {
        memUser = u;
        break;
      }
    }

    if (memUser) {
      memUser.profileImage = picture || memUser.profileImage;
      memUser.lastLoginAt = new Date();
    } else {
      const existingMemEmailUser = memoryUsers.get(emailLower);
      if (existingMemEmailUser && existingMemEmailUser.googleId !== googleId) {
        throw {
          statusCode: 400,
          message: 'An account with this email address already exists. Please log in using your password.',
        };
      }

      const userId = 'user_g_' + Math.random().toString(36).substring(2, 9);
      memUser = {
        id: userId,
        email: emailLower,
        name: finalName,
        profileImage: picture,
        authProvider: 'google',
        googleId,
        passwordHash: null,
        virtualCash: 100000.00,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      memoryUsers.set(emailLower, memUser);

      memoryPortfolios.set(userId, {
        id: 'port_' + userId,
        userId,
        cashBalance: 100000.00,
        investedAmount: 0.00,
        realizedPnL: 0.00,
        holdings: [],
      });

      memoryWatchlists.set(userId, [
        {
          id: 'wl_default_' + userId,
          userId,
          name: 'Main Tech Watchlist',
          isDefault: true,
          items: [
            { id: '1', symbol: 'AAPL', name: 'Apple Inc.' },
            { id: '2', symbol: 'TSLA', name: 'Tesla, Inc.' },
            { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp.' },
            { id: '4', symbol: 'MSFT', name: 'Microsoft Corp.' },
            { id: '5', symbol: 'BTCUSDT', name: 'Bitcoin (BTC/USDT)' },
          ],
        },
      ]);
    }

    const token = generateToken({ userId: memUser.id, email: emailLower });
    return {
      token,
      user: {
        id: memUser.id,
        email: emailLower,
        name: memUser.name,
        profileImage: memUser.profileImage || picture,
        authProvider: memUser.authProvider || 'google',
        googleId: memUser.googleId || googleId,
        virtualCash: memUser.virtualCash,
        createdAt: memUser.createdAt,
      },
    };
  }


  // 4. Forgot Password Request
  public async forgotPassword(email: string) {
    this.validateEmail(email);
    const emailLower = email.toLowerCase().trim();

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour

    try {
      const user = await prisma.user.findUnique({ where: { email: emailLower } });
      if (user) {
        await (prisma.user as any).update({
          where: { id: user.id },
          data: { resetToken, resetExpires: new Date(resetExpires) },
        });
        console.log(`\n==================================================`);
        console.log(`[PASSWORD RESET LINK] For user ${emailLower}:`);
        console.log(`http://localhost:5173/reset-password?token=${resetToken}`);
        console.log(`==================================================\n`);
      }
    } catch {
      // In-memory fallback
      if (memoryUsers.has(emailLower)) {
        memoryResetTokens.set(resetToken, { email: emailLower, expires: resetExpires });
        console.log(`\n==================================================`);
        console.log(`[PASSWORD RESET LINK] For user ${emailLower}:`);
        console.log(`http://localhost:5173/reset-password?token=${resetToken}`);
        console.log(`==================================================\n`);
      }
    }

    return {
      success: true,
      message: 'If an account associated with that email exists, a password reset link has been generated.',
    };
  }

  // 5. Reset Password Execution
  public async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw { statusCode: 400, message: 'Invalid or missing password reset token.' };
    }
    this.validatePasswordStrength(newPassword);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Try PostgreSQL via Prisma
    try {
      const user = await (prisma.user as any).findFirst({
        where: {
          resetToken: token,
          resetExpires: { gt: new Date() },
        },
      });

      if (user) {
        await (prisma.user as any).update({
          where: { id: user.id },
          data: {
            passwordHash,
            resetToken: null,
            resetExpires: null,
          },
        });
        return { success: true, message: 'Password updated successfully. You may now log in.' };
      }
    } catch (err: any) {
      console.warn('[AuthService] DB reset password query failed, falling back to memory.');
    }

    // In-memory fallback
    const memToken = memoryResetTokens.get(token);
    if (!memToken || memToken.expires < Date.now()) {
      throw { statusCode: 400, message: 'Password reset token is invalid or has expired.' };
    }

    const memUser = memoryUsers.get(memToken.email);
    if (memUser) {
      memUser.passwordHash = passwordHash;
      memoryResetTokens.delete(token);
      return { success: true, message: 'Password updated successfully. You may now log in.' };
    }

    throw { statusCode: 400, message: 'Unable to reset password. Please try requesting a new link.' };
  }

  // 6. Fetch User By ID
  public async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: (user as any).profileImage || null,
          authProvider: (user as any).authProvider || 'email',
          googleId: (user as any).googleId || null,
          virtualCash: Number(user.virtualCash),
          createdAt: user.createdAt,
          lastLoginAt: (user as any).lastLoginAt || user.createdAt,
        };
      }
    } catch {
      // Fall through to memory
    }

    for (const memUser of memoryUsers.values()) {
      if (memUser.id === userId) {
        return {
          id: memUser.id,
          email: memUser.email,
          name: memUser.name,
          profileImage: memUser.profileImage || null,
          authProvider: memUser.authProvider || 'email',
          googleId: memUser.googleId || null,
          virtualCash: memUser.virtualCash,
          createdAt: memUser.createdAt || new Date(),
          lastLoginAt: memUser.lastLoginAt || new Date(),
        };
      }
    }

    return {
      id: userId,
      email: 'trader@quantflow.io',
      name: 'QuantFlow Pro User',
      profileImage: null,
      authProvider: 'email',
      googleId: null,
      virtualCash: 100000.00,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
  }
}

export { memoryUsers, memoryWatchlists, memoryPortfolios };
export const authService = new AuthService();
