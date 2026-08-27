import { authService, memoryUsers } from '../authService';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';

jest.mock('google-auth-library');

describe('Google Authentication Unit Tests', () => {
  let mockVerifyIdToken: jest.Mock;
  const originalGoogleClientId = config.googleClientId;

  beforeEach(() => {
    jest.clearAllMocks();
    memoryUsers.clear();
    (config as any).googleClientId = originalGoogleClientId || 'test-client-id.apps.googleusercontent.com';

    mockVerifyIdToken = jest.fn();
    (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }));
  });

  afterAll(() => {
    (config as any).googleClientId = originalGoogleClientId;
  });

  it('should reject authentication when GOOGLE_CLIENT_ID is missing on backend server', async () => {
    (config as any).googleClientId = '';
    await expect(authService.googleAuth({ credential: 'valid_token' })).rejects.toEqual({
      statusCode: 500,
      message: 'Google Client ID is not configured on the backend server.',
    });
  });

  it('should reject authentication when credential token is missing', async () => {
    await expect(authService.googleAuth({ credential: '' } as any)).rejects.toEqual({
      statusCode: 400,
      message: 'Google authentication failed: credential ID token is required.',
    });
  });

  it('should reject invalid or malformed Google ID tokens', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token signature'));

    await expect(authService.googleAuth({ credential: 'invalid_token_123' })).rejects.toEqual({
      statusCode: 400,
      message: 'Invalid token signature',
    });
  });

  it('should reject Google ID token if audience mismatches GOOGLE_CLIENT_ID (wrong audience)', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google_sub_wrong_aud',
        email: 'wrongaud@example.com',
        email_verified: true,
        iss: 'accounts.google.com',
        aud: 'unauthorized_different_client_id.apps.googleusercontent.com',
      }),
    });

    await expect(authService.googleAuth({ credential: 'wrong_aud_token' })).rejects.toEqual({
      statusCode: 400,
      message: 'Google ID token audience mismatch.',
    });
  });

  it('should reject Google ID token if email is not verified', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google_sub_101',
        email: 'unverified@example.com',
        email_verified: false,
        iss: 'accounts.google.com',
        aud: config.googleClientId,
      }),
    });

    await expect(authService.googleAuth({ credential: 'unverified_token' })).rejects.toEqual({
      statusCode: 400,
      message: 'Google account email is not verified.',
    });
  });

  it('should reject Google login if email already belongs to an unlinked email/password account', async () => {
    // 1. Create email/password user first
    await authService.register({
      email: 'existing@example.com',
      password: 'Password123!',
      name: 'Existing User',
    });

    // 2. Attempt Google login with same email but different Google sub
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google_sub_999',
        email: 'existing@example.com',
        email_verified: true,
        iss: 'accounts.google.com',
        aud: config.googleClientId,
        name: 'Existing User',
      }),
    });

    await expect(authService.googleAuth({ credential: 'valid_google_token' })).rejects.toEqual({
      statusCode: 400,
      message: 'An account with this email address already exists. Please log in using your password.',
    });
  });

  it('should successfully register a new user on first verified Google login', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google_sub_new_123',
        email: 'newgoogleuser@example.com',
        email_verified: true,
        iss: 'https://accounts.google.com',
        aud: config.googleClientId,
        name: 'New Google User',
        picture: 'https://lh3.googleusercontent.com/avatar',
      }),
    });

    const response = await authService.googleAuth({ credential: 'valid_new_user_token' });

    expect(response).toHaveProperty('token');
    expect(response.user.email).toBe('newgoogleuser@example.com');
    expect(response.user.googleId).toBe('google_sub_new_123');
    expect(response.user.authProvider).toBe('google');
    expect(response.user.virtualCash).toBe(100000);
  });

  it('should successfully authenticate returning user by verified Google sub', async () => {
    // First login -> registration
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google_sub_returning_456',
        email: 'returninguser@example.com',
        email_verified: true,
        iss: 'accounts.google.com',
        aud: config.googleClientId,
        name: 'Returning User',
      }),
    });

    const firstResponse = await authService.googleAuth({ credential: 'token_1' });
    expect(firstResponse.user.email).toBe('returninguser@example.com');

    // Second login -> returning user auth
    const secondResponse = await authService.googleAuth({ credential: 'token_2' });
    expect(secondResponse.user.id).toBe(firstResponse.user.id);
    expect(secondResponse.user.googleId).toBe('google_sub_returning_456');
  });
});
