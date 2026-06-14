const authService = require('./auth.service');
async function login(req, res) {
  try {
    const { email, password } =
      req.body;

    const result =
      await authService.login(
        email,
        password
      );

    return res.json(result);
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    });
  }
}

async function me(req, res) {
  try {
    const user =
      await authService.currentUser(
        req.user.userId
      );

    return res.json(user);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

module.exports = {
  login,
  me,
};