function verificarAutenticacion(req, res, next) {
    if (req.session.usuario) {
        return next();
    } else {
        res.redirect('/');
    }
}

app.get('/index', verificarAutenticacion, (req, res) => {
    res.render('index', { usuario: req.session.usuario, rol: req.session.rol });
});
