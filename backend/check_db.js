import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = (await import('./src/models/User.js')).default;
        const Settings = (await import('./src/models/Settings.js')).default;

        let oldUser = await User.findOne({ email: 'vmsgarments67@gmail.com' });
        if (oldUser) {
            oldUser.email = 'jayaseelanjaya67@gmail.com';
            await oldUser.save();
            console.log('✅ Updated old admin email successfully.');
        } else {
            console.log('old user not found.');
            let currUser = await User.findOne({ email: 'jayaseelanjaya67@gmail.com' });
            console.log(currUser ? '✅ New email already active.' : '❌ Neither found.');
        }

        const s = await Settings.findOne({});
        if (s) {
            s.company.email = 'jayaseelanjaya67@gmail.com';
            await s.save();
            console.log('✅ Settings email updated.');
        } else {
            console.log('❌ Settings not found.');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
        mongoose.disconnect();
    }
};

check();
