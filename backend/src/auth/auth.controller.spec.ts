import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { ConfigService } from '@nestjs/config';
import { UserResponse } from '@supabase/supabase-js';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;
    let mockResponse: any;

    const mockSupabaseClient = {
        auth: {
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    };

    const mockAuthService = {
        supabase: mockSupabaseClient,
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        // Mock response object
        mockResponse = {
            cookie: jest.fn(),
            clearCookie: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCurrentUser', () => {
        it('should return user data when authenticated', async () => {
            const mockUserResponse: UserResponse = {
                data: {
                    user: {
                        id: 'test-user-id',
                        email: 'test@example.com',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email_confirmed_at: '2023-01-01T00:00:00Z',
                        phone: '',
                        confirmed_at: '2023-01-01T00:00:00Z',
                        last_sign_in_at: '2023-01-01T00:00:00Z',
                        app_metadata: {},
                        user_metadata: {},
                        identities: [],
                        created_at: '2023-01-01T00:00:00Z',
                        updated_at: '2023-01-01T00:00:00Z',
                    },
                },
                error: null,
            };

            mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserResponse);

            const result = await controller.getCurrentUser();

            expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockUserResponse);
        });

        it('should handle error when getting user fails', async () => {
            const mockErrorResponse: UserResponse = {
                data: { user: null },
                error: {
                    message: 'User not found',
                } as any,
            };

            mockSupabaseClient.auth.getUser.mockResolvedValue(mockErrorResponse);

            const result = await controller.getCurrentUser();

            expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockErrorResponse);
        });
    });

    describe('getUserByEmail (login)', () => {
        it('should successfully sign in user and set cookie', async () => {
            const mockSignInResponse = {
                data: {
                    user: {
                        id: 'test-user-id',
                        email: 'jonas@42heilbronn.de',
                    },
                    session: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token',
                        expires_in: 3600,
                        token_type: 'bearer',
                        user: {
                            id: 'test-user-id',
                            email: 'jonas@42heilbronn.de',
                        },
                    },
                },
                error: null,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockSignInResponse);

            const result = await controller.getUserByEmail(mockResponse);

            expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'jonas@42heilbronn.de',
                password: 'changeme',
            });

            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'token',
                'mock-access-token',
                {
                    httpOnly: true,
                    secure: true,
                    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
                }
            );

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User signed in successfully',
            });
        });

        it('should handle sign in error and return null', async () => {
            const mockErrorResponse = {
                data: { user: null, session: null },
                error: {
                    message: 'Invalid credentials',
                } as any,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockErrorResponse);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await controller.getUserByEmail(mockResponse);

            expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'jonas@42heilbronn.de',
                password: 'changeme',
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error signing in:', mockErrorResponse.error);
            expect(result).toBeNull();
            expect(mockResponse.cookie).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle missing session data', async () => {
            const mockResponseWithoutSession = {
                data: {
                    user: {
                        id: 'test-user-id',
                        email: 'jonas@42heilbronn.de',
                    },
                    session: null,
                },
                error: null,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponseWithoutSession);

            // This should throw an error when trying to access session.access_token
            await expect(controller.getUserByEmail(mockResponse)).rejects.toThrow();
        });
    });

    describe('logout', () => {
        it('should successfully sign out user and clear cookie', async () => {
            const mockSignOutResponse = {
                error: null,
            };

            mockSupabaseClient.auth.signOut.mockResolvedValue(mockSignOutResponse);

            const result = await controller.logout(mockResponse);

            expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
            expect(mockResponse.clearCookie).toHaveBeenCalledWith('token');
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User signed out successfully',
            });
        });

        it('should handle sign out error', async () => {
            const mockErrorResponse = {
                error: {
                    message: 'Sign out failed',
                } as any,
            };

            mockSupabaseClient.auth.signOut.mockResolvedValue(mockErrorResponse);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await controller.logout(mockResponse);

            expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockErrorResponse.error);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Error signing out',
            });
            expect(mockResponse.clearCookie).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle multiple login attempts', async () => {
            const mockSignInResponse = {
                data: {
                    user: { id: 'test-user-id', email: 'jonas@42heilbronn.de' },
                    session: { access_token: 'token-1', refresh_token: 'refresh-1' },
                },
                error: null,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockSignInResponse);

            // First login
            await controller.getUserByEmail(mockResponse);
            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);

            // Second login (should work the same way)
            await controller.getUserByEmail(mockResponse);
            expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
        });

        it('should handle logout after login', async () => {
            // Login first
            const mockSignInResponse = {
                data: {
                    user: { id: 'test-user-id', email: 'jonas@42heilbronn.de' },
                    session: { access_token: 'mock-token', refresh_token: 'refresh-token' },
                },
                error: null,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockSignInResponse);
            await controller.getUserByEmail(mockResponse);

            // Then logout
            const mockSignOutResponse = { error: null };
            mockSupabaseClient.auth.signOut.mockResolvedValue(mockSignOutResponse);
            await controller.logout(mockResponse);

            expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
            expect(mockResponse.clearCookie).toHaveBeenCalledTimes(1);
        });
    });
}); 