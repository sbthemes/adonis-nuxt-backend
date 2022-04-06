import { Exception } from '@adonisjs/core/build/standalone';
import Env from '@ioc:Adonis/Core/Env';
import User from 'App/Models/User';
import { rules, schema } from '@ioc:Adonis/Core/Validator';
import VerifyEmailNotification from 'App/Mailers/VerifyEmailNotification';
import { DateTime } from 'luxon';
import ResetPassqwordNotification from 'App/Mailers/ResetPassqwordNotification';

export default class AuthController {
    public async login({ auth, request, response }) {
        const data = await request.validate({
            schema: schema.create({
                email: schema.string({ trim: true }, [rules.email()]),
                password: schema.string({}),
            }),
            messages: {
                required: 'The {{ field }} field is required.',
            },
        });

        try {
            const token = await auth.use('api').attempt(data.email, data.password, {
                expiresIn: '1year',
            });

            return { token: token.token };
        } catch (e) {
            return response.unprocessableEntity({ error: 'Invalid email or password.' });
        }
    }

    public async register({ request, response }) {
        const data = await request.validate({
            schema: schema.create({
                email: schema.string({ trim: true }, [
                    rules.email(),
                    rules.unique({ table: 'users', column: 'email' }),
                ]),
                password: schema.string({}, [rules.minLength(8), rules.confirmed()]),
            }),
            messages: {
                'required': 'The {{ field }} field is required.',
                'email.email': 'The email must be a valid email address.',
                'unique': 'The {{ field }} has already been taken.',
                'password.minLength': 'The password must be atleast 8 characters.',
                'password_confirmation.confirmed': 'The password confirmation does not match.',
            },
        });

        try {
            const user = await User.create(data);
            new VerifyEmailNotification(user).send();
            return { success: 'Please check your email inbox (and spam) for an access link.' };
        } catch (e) {
            return response.unprocessableEntity({ error: e.message });
        }
    }

    public async logout({ auth, response }) {
        await auth.use('api').revoke();
        return response.noContent();
    }

    public async user({ auth }) {
        return { data: auth.user };
    }

    public async resendVerificationEmail({ auth, response }) {
        try {
            new VerifyEmailNotification(auth.user).send();
            return {
                success: 'Please check your email inbox (and spam) for an access link.',
            };
        } catch (e) {
            return response.unprocessableEntity({ error: e.message });
        }
    }

    public async verifyEmail({ params, request, response }) {
        if (!request.hasValidSignature()) {
            return response.unprocessableEntity({ error: 'Invalid verification link.' });
        }

        const email = decodeURIComponent(params.email);

        const user = await User.query().where('id', params.id).where('email', email).first();
        if (!user) {
            return response.unprocessableEntity({ error: 'Invalid verification link.' });
        }

        user.email_verified_at = DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss');
        await user.save();

        return { success: 'Email verified successfully.' };
    }

    public async forgotPassword({ request }) {
        const data = await request.validate({
            schema: schema.create({
                email: schema.string({ trim: true }, [rules.email()]),
            }),
            messages: {
                'required': 'The {{ field }} field is required.',
                'email.email': 'The email must be a valid email address.',
            },
        });

        const user = await User.findBy('email', data.email);

        if (!user) {
            throw new Exception("We can't find a user with that e-mail address.", 422);
        }

        new ResetPassqwordNotification(user).send();

        return { success: 'Please check your email inbox (and spam) for a password reset link.' };
    }

    public async resetPassword({ params, request, response }) {
        if (!request.hasValidSignature()) {
            return response.unprocessableEntity({ error: 'Invalid reset password link.' });
        }

        const user = await User.find(params.id);
        if (!user) {
            return response.unprocessableEntity({ error: 'Invalid reset password link.' });
        }

        if (encodeURIComponent(user.password) !== params.token) {
            return response.unprocessableEntity({ error: 'Invalid reset password link.' });
        }

        const data = await request.validate({
            schema: schema.create({
                password: schema.string({}, [rules.minLength(8), rules.confirmed()]),
            }),
            messages: {
                'password.minLength': 'The password must be atleast 8 characters.',
                'password_confirmation.confirmed': 'The password confirmation does not match.',
            },
        });

        user.password = data.password;
        await user.save();

        return { success: 'Password reset successfully.' };
    }
}
