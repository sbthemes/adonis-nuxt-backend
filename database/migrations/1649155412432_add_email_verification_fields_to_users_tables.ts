import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class AddEmailVerificationFieldsToUsersTables extends BaseSchema {
    public async up() {
        this.schema.alterTable('users', (table) => {
            table.string('name').after('email').nullable();
            table.timestamp('email_verified_at', { useTz: true }).after('name').nullable();
        });
    }

    public async down() {
        this.schema.alterTable('users', (table) => {
            table.dropColumn('name');
            table.dropColumn('email_verified_at');
        });
    }
}
