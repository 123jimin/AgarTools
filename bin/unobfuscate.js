#!/usr/bin/env node

var fs = require('fs');

var $$ = require("uglify-js"),
	Beautifier = require("../lib/beautifier.js");

var id_dict = {}, curr_id = 0;

var tag = function tag(obj){
	if('@tag' in obj) return obj['@tag'];
	var tag;
	do{
		tag = curr_id++;
	}while(tag in id_dict);
	id_dict[tag] = obj;
	return obj['@tag'] = tag;
};

var files = process.argv.slice(-3).map(function(name){
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
var varData = {};
var varArr = [];
var scope = [];
agarAST.walk(new $$.TreeWalker(function(node, descend){
	if(node instanceof $$.AST_Scope && !(node instanceof $$.AST_Toplevel)){
		scope.push(tag(node));
		descend();
		scope.pop();
		return true;
	}
	if(node instanceof $$.AST_Symbol && node.thedef){
		if(!(node.thedef.scope instanceof $$.AST_Toplevel)){
			var infoObj;
			if(tag(node.thedef) in varData) infoObj = varData[tag(node.thedef)];
			else{
				infoObj = varData[tag(node.thedef)] = {
					'scopes': {},
					'origName': node.name,
					'def': node.thedef
				};
				varArr.push(infoObj);
			}
			infoObj.scopes[scope.join(' ')] = 1;
		}
	}
}));

varArr.sort(function(v1, v2){
	var s1 = v1.def.orig[0].start, s2 = v2.def.orig[0].start;
	return s1.pos - s2.pos;
});

// Guess names (currently it's just a dictionary lookup)
var varDict = fs.readFileSync(files[1], 'utf-8').trim().split('\n');

varDict = varDict.map(function(line){
	return line.split('#')[0].trim();
});

if(varDict.length != varArr.length) console.warn("Warning: dictionary size %d does not match with number of variables %d!", varDict.length, varArr.length);

varArr.forEach(function(info, i){
	if(!(i in varDict) || varDict[i] == '' || varDict[i] == '?')
		info.def.mangled_name = 'unk_'+(i+1);
	else
		info.def.mangled_name = varDict[i];
});

// Inject scripts

// Beautify the AST
console.log("Beautifying the AST...");
agarAST.transform(new Beautifier);

// Results
console.log("Generating the output...");
var stream = $$.OutputStream({'beautify': true});
agarAST.print(stream);

fs.writeFileSync(files[2], stream.toString(), 'utf-8');
