#!/usr/bin/env node

var fs = require('fs');

var $$ = require("uglify-js"),
	Beautifier = require("../lib/beautifier.js");

var files = process.argv.slice(-2).map(function(name){
	if(name[0] == '/') return name;
	return process.cwd() + '/' + name;
});

var agarAST = $$.parse(
	fs.readFileSync(files[0], 'utf-8'),
	{'filename': files[0]}
);

// Create scope informations
console.log("Figuring out the scope...");
agarAST.figure_out_scope();

// Collect informations of variables
console.log("Guessing variable names...");
agarAST.walk(new $$.TreeWalker(function(node, descend){
	if(node instanceof $$.AST_Scope){
		console.log(node.print_to_string());
		console.log("Vars:", node.variables);
		console.log(node);
	}
}));

// Rename variables
agarAST.walk(new $$.TreeWalker(function(node, descend){
	if(node instanceof $$.AST_Scope){
	}
	if(node instanceof $$.AST_Label){
	}
}));

// Beautify the AST
console.log("Beautifying the AST...")
agarAST.transform(new Beautifier);

// Inject scripts

// Results
var stream = $$.OutputStream({'beautify': true});
agarAST.print(stream);

console.log("==========");
console.log(stream.toString());
