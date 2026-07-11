const authService = require('./auth.service');
const { languageSchema } = require('./auth.validation');
const { ZodError } = require('zod');
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

async function updateLanguage(req, res) {
  try {
    const { preferredLanguage } = languageSchema.parse(req.body);
    const user = await authService.updateLanguage(req.user.userId, preferredLanguage);
    return res.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  login,
  me,
  updateLanguage,
};