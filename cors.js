module.exports = function( req, res, next ) {
    "use strict";
    // Website you wish to allow to connect
    res.setHeader( "Access-Control-Allow-Origin", "*" );

    // Request methods you wish to allow
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type"
    );

    res.setHeader( "Access-Control-Allow-Credentials", true );
    next();

};
