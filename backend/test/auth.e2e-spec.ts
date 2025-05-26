import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let authService: AuthService;

    const mockSupabaseClient = {
        auth: {
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                AuthModule,
            ],
        })
            .overrideProvider(AuthService)
            .useValue({
                supabase: mockSupabaseClient,
            })
            .compile();

        app = moduleFixture.createNestApplication();
        authService = moduleFixture.get<AuthService>(AuthService);
        await app.init();

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('/auth/me (GET)', () => {
        it('should return user data when authenticated', async () => {
            const mockUserResponse = {
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

            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Cookie', 'token=valid-jwt-token')
                .expect(200);

            expect(response.body).toEqual(mockUserResponse);
            expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app.getHttpServer())
                .get('/auth/me')
                .expect(401);
        });

        it('should handle user not found error', async () => {
            const mockErrorResponse = {
                data: { user: null },
                error: {
                    message: 'User not found',
                } as any,
            };

            mockSupabaseClient.auth.getUser.mockResolvedValue(mockErrorResponse);

            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Cookie', 'token=valid-jwt-token')
                .expect(200);

            expect(response.body).toEqual(mockErrorResponse);
        });
    });

    describe('/auth/login (GET)', () => {
        it('should successfully login and set cookie', async () => {
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

            const response = await request(app.getHttpServer())
                .get('/auth/login')
                .expect(200);

            expect(response.body).toEqual({
                message: 'User signed in successfully',
            });

            // Check if cookie was set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('token=mock-access-token');
            expect(cookies[0]).toContain('HttpOnly');
            expect(cookies[0]).toContain('Secure');

            expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'jonas@42heilbronn.de',
                password: 'changeme',
            });
        });

        it('should handle login error', async () => {
            const mockErrorResponse = {
                data: { user: null, session: null },
                error: {
                    message: 'Invalid credentials',
                } as any,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockErrorResponse);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app.getHttpServer())
                .get('/auth/login')
                .expect(200);

            expect(response.body).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error signing in:', mockErrorResponse.error);

            consoleSpy.mockRestore();
        });
    });

    describe('/auth/logout (POST)', () => {
        it('should successfully logout and clear cookie', async () => {
            const mockSignOutResponse = {
                error: null,
            };

            mockSupabaseClient.auth.signOut.mockResolvedValue(mockSignOutResponse);

            const response = await request(app.getHttpServer())
                .post('/auth/logout')
                .expect(200);

            expect(response.body).toEqual({
                message: 'User signed out successfully',
            });

            // Check if cookie was cleared
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('token=;');

            expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
        });

        it('should handle logout error', async () => {
            const mockErrorResponse = {
                error: {
                    message: 'Sign out failed',
                } as any,
            };

            mockSupabaseClient.auth.signOut.mockResolvedValue(mockErrorResponse);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const response = await request(app.getHttpServer())
                .post('/auth/logout')
                .expect(500);

            expect(response.body).toEqual({
                message: 'Error signing out',
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockErrorResponse.error);

            consoleSpy.mockRestore();
        });
    });

    describe('Authentication flow integration', () => {
        it('should complete full login-logout cycle', async () => {
            // Login
            const mockSignInResponse = {
                data: {
                    user: { id: 'test-user-id', email: 'jonas@42heilbronn.de' },
                    session: { access_token: 'test-token', refresh_token: 'refresh-token' },
                },
                error: null,
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockSignInResponse);

            const loginResponse = await request(app.getHttpServer())
                .get('/auth/login')
                .expect(200);

            expect(loginResponse.body.message).toBe('User signed in successfully');

            // Extract cookie from login response
            const cookies = loginResponse.headers['set-cookie'];
            const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('token='));

            // Logout
            const mockSignOutResponse = { error: null };
            mockSupabaseClient.auth.signOut.mockResolvedValue(mockSignOutResponse);

            const logoutResponse = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Cookie', tokenCookie)
                .expect(200);

            expect(logoutResponse.body.message).toBe('User signed out successfully');
        });
    });
}); 