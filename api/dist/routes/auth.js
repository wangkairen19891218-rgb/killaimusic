"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const supabase_1 = require("../config/supabase");
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                error: 'Name, email and password are required'
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
            return;
        }
        const { data: existingUser } = await supabase_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
            return;
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const userId = (0, uuid_1.v4)();
        const { data: newUser, error } = await supabase_1.supabase
            .from('users')
            .insert({
            id: userId,
            name,
            email,
            password: hashedPassword,
            subscription: 'free'
        })
            .select('id, name, email, subscription, created_at')
            .single();
        if (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create user account'
            });
            return;
        }
        const token = (0, jwt_1.generateToken)({ userId: newUser.id, email: newUser.email });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: newUser,
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        if (!email || !password) {
            console.log('Missing email or password');
            res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
            return;
        }
        if (email === 'demo@example.com' && password === 'password') {
            console.log('Demo account login');
            const demoUser = {
                id: 'demo_user_id',
                email: 'demo@example.com',
                name: '演示用户',
                subscription: 'free',
                created_at: new Date().toISOString()
            };
            const token = (0, jwt_1.generateToken)({ userId: demoUser.id, email: demoUser.email });
            res.json({
                success: true,
                message: 'Login successful (demo)',
                data: {
                    user: demoUser,
                    token
                }
            });
            return;
        }
        if (!supabase_1.supabase || typeof supabase_1.supabase.from !== 'function') {
            console.error('Supabase client unavailable. Check environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY');
            res.status(500).json({
                success: false,
                error: 'Database unavailable. Please try again later.'
            });
            return;
        }
        console.log('Querying database for user:', email);
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('id, name, email, password, subscription, created_at')
            .eq('email', email)
            .single();
        console.log('Database query result:', { user: user ? 'found' : 'not found', error: error?.message });
        if (error || !user) {
            console.log('User not found in database:', error?.message);
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
            return;
        }
        console.log('Verifying password for user:', user.email);
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        console.log('Password verification result:', isValidPassword);
        if (!isValidPassword) {
            console.log('Password verification failed for user:', user.email);
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
            return;
        }
        const token = (0, jwt_1.generateToken)({ userId: user.id, email: user.email });
        const { password: _pw, ...userWithoutPassword } = user;
        console.log('Login successful for user:', user.email);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        try {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
        catch { }
    }
});
router.get('/me', jwt_1.authenticateToken, async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        if (userPayload.email === 'demo@example.com' && userPayload.userId === 'demo_user_id') {
            res.json({
                success: true,
                data: {
                    user: {
                        id: 'demo_user_id',
                        name: '演示用户',
                        email: 'demo@example.com',
                        subscription: 'free',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                }
            });
            return;
        }
        if (!supabase_1.supabase || typeof supabase_1.supabase.from !== 'function') {
            console.error('Supabase client unavailable in /me');
            res.status(500).json({
                success: false,
                error: 'Database unavailable'
            });
            return;
        }
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('id, name, email, subscription, created_at, updated_at')
            .eq('id', userPayload.userId)
            .single();
        if (error || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/logout', jwt_1.authenticateToken, async (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});
exports.default = router;
