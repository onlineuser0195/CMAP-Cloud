import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true, lowercase: true},
    password_hash: { type: String, required: true },
    role: { type: String, required: true, trim: true },
    system_id: { type: Number, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    created_at: { type: Date, default: Date.now }
});


// // Then, apply a unique index with a case-insensitive collation:
// UserSchema.index(
//   { email: 1 },
//   {
//     unique: true,
//     collation: {
//       locale: 'en',
//       strength: 2    // strength:2 means case and diacritic insensitive
//     }
//   }
// );

const UserSchema = mongoose.model('user', userSchema, 'user');

export default UserSchema;
