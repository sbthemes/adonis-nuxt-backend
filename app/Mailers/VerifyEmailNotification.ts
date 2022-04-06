import Env from '@ioc:Adonis/Core/Env';
import Route from '@ioc:Adonis/Core/Route';
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail';
import User from 'App/Models/User';
import mjml from 'mjml';

export default class VerifyEmailNotification extends BaseMailer {
    constructor(private user: User) {
        super();
    }

    public prepare(message: MessageContract) {
        let link = Route.makeSignedUrl(
            'verifyEmail',
            {
                email: encodeURIComponent(this.user.email),
                id: this.user.id,
            },
            {
                expiresIn: '30m',
                prefixUrl: Env.get('API_URL'),
            }
        );

        link = `${Env.get('APP_URL')}/account/verify/accept?token=${encodeURIComponent(link)}`;

        const htmlOutput = mjml(`<mjml>
            <mj-head>
                <mj-title>Baboost</mj-title>
                <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,500"></mj-font>
                <mj-attributes>
                    <mj-all font-family="Roboto, Helvetica, sans-serif"></mj-all>
                    <mj-text font-weight="300" font-size="16px" color="#333333" line-height="24px"></mj-text>
                    <mj-section padding="0px"></mj-section>
                </mj-attributes>
            </mj-head>
            <mj-body>
                <mj-section>
                    <mj-column width="100%">
                        <mj-spacer></mj-spacer>
                    </mj-column>
                </mj-section>
                <mj-section>
                    <mj-column width="100%">
                        <mj-image href="https://baboost.com" src="https://baboost.com/img/baboost-logo.svg" width="147px" height="33px"></mj-image>
                    </mj-column>
                </mj-section>
                <mj-section padding-top="30px">
                    <mj-column width="100%">
                        <mj-text>
                            <p><strong>Hi ${this.user.name},</strong></p>
                            <p>Please click the button below to verify your email address. This verificaiton link will expire in 30 minutes.</p>
                        </mj-text>
                        <mj-button href="${link}" background-color="#27AE94" color="white">Verify Email Address</mj-button>
                        <mj-text>
                            <p>If you did this request by mistake, no further action is required.</p>
                            <p>Thank You.</p>
                        </mj-text>
                    </mj-column>
                </mj-section>
            </mj-body>
        </mjml>`).html;

        message
            .from(Env.get('MAIL_FROM'))
            .subject('Verify Email Address')
            .to(this.user.email)
            .html(htmlOutput);
    }
}
