const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://prathampoudel2:Yr80IsZUMjDrSofB@cluster0.zrmx0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => {
  console.log('Connected to the database');
});

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  universityRollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  verified: {
    type: Boolean,
    default: false
},
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
