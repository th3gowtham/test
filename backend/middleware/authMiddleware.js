const { auth } = require('../config/firebaseAdmin');

const verifySessionCookie = async (req, res, next) => {
  const sessionCookie = req.cookies.session || '';
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = verifySessionCookie;
