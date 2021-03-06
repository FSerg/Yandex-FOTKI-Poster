var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
  email: { type: String, required: true, index: { unique: true }},
  yaname: { type: String, required: true },
  yatoken: { type: String, required: true },
  password: { type: String, required: true, select: false}
});

userSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) { return next(); }

    bcrypt.hash(user.password, null, null, function(err, hash) {
      if (err) { return next(err); }

      user.password = hash;
      next();

    });
});

userSchema.methods.comparePassword = function(password) {
  var user = this;
  return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('User', userSchema);
