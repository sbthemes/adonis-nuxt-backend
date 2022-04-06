import User from 'App/Models/User';

export default class UserController {
    public async index() {
        return User.all();
    }
}
