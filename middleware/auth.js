module.exports = {
    ensureAuthenticated: function(req,res,next) {
        if(req.isAuthenticated()){
            return next();
        }
        req.flash('error','You are not logged in');
        res.redirect('/login');
    }
}