module.exports = function (req, res, next) {
    if (req.user.role === 'teacher' && !req.user.isApproved) {
        return res.status(403).json({ msg: 'Access denied. Your account is pending approval.' });
    }
    next();
};
