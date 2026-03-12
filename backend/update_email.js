import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const oldEmail = 'jayaseelanjaya67@gmail.com';
const newEmail = 'jayaseelanjaya67@gmail.com';

const updateDB = async () => {
    try {
        const User = (await import('./src/models/User.js')).default;
        const Settings = (await import('./src/models/Settings.js')).default;

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        const user = await User.findOneAndUpdate({ email: oldEmail }, { email: newEmail });
        console.log('User updated:', user ? 'Yes' : 'No');

        const settings = await Settings.findOneAndUpdate(
            { 'company.email': oldEmail },
            { $set: { 'company.email': newEmail } }
        );
        console.log('Settings updated:', settings ? 'Yes' : 'No');
        mongoose.disconnect();
    } catch (e) {
        console.error('DB Error', e);
    }
};

const updateFiles = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', '.git', '.gemini'].includes(file)) {
                updateFiles(fullPath);
            }
        } else if (['.js', '.jsx', '.json', '.md', '.txt', '.css'].includes(path.extname(fullPath))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(oldEmail)) {
                content = content.replace(new RegExp(oldEmail, 'g'), newEmail);
                fs.writeFileSync(fullPath, content);
                console.log('Updated file:', fullPath);
            }
        }
    }
};

(async () => {
    await updateDB();
    updateFiles(path.join(__dirname, '../'));
    console.log('Done!');
})();
