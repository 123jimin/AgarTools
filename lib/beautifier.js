var $$ = require('uglify-js');

function Beautifier() {
}

Beautifier.prototype = new $$.TreeTransformer;

module.exports = Beautifier;
