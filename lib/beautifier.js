var $$ = require('uglify-js');

var def = function def(op, arrs){
	arrs.forEach(function(a){
		a[0].DEFMETHOD(op, function(){
			return a[1].apply(this, arguments);
		});
	});
};

var make_node = function make_node(type, orig, props){
	if(!props) props = {};
	if(orig){
		if(!props.start) props.start = orig.start;
		if(!props.end) props.end = orig.end;
	}
	return new type(props);
};

var wrap_exp = function wrap_exp(exp){
	return make_node($$.AST_SimpleStatement, exp, {'body': exp});
};

function Beautifier() {
	$$.TreeTransformer.call(this, this.before, this.after);
}

Beautifier.prototype = new $$.TreeTransformer;

Beautifier.prototype.option = function(key){
	switch(key){
		case 'unsafe_comps':
			return true;
		default:
			return false;
	}
};

Beautifier.prototype.before = function Beautifier$before(node, descend, in_list){
	if('@beautifier:visited' in node) return node;
	descend(node, this);
	node = node.beautify(this);
	node['@beautifier:visited'] = true;
	return node;
};

def('beautify', [
	function AST_Node(btf){
		return this;
	},
	function AST_SimpleStatement(btf){
		var body = this.body;
		if(body instanceof $$.AST_Binary){
			switch(body.operator){
				// a && b; => if(a) b;
				case '&&':
					return make_node($$.AST_If, this, {
						'condition': body.left,
						'body': wrap_exp(body.right)
					});
					break;
				// a || b; => if(!a) b;
				case '||':
					return make_node($$.AST_If, this, {
						'condition': body.left.negate(btf),
						'body': wrap_exp(body.right)
					});
					break;
			}
		}else if(body instanceof $$.AST_Conditional){
			return make_node($$.AST_If, this, {
				'condition': body.condition,
				'body': wrap_exp(body.consequent),
				'alternative': wrap_exp(body.alternative)
			});
		}else if(body instanceof $$.AST_Seq){
			var commas = [],
				curr_body = body;
			do{
				commas.push(curr_body.car);
				curr_body = curr_body.cdr
			}while(curr_body instanceof $$.AST_Seq)
			commas.push(curr_body);

			return make_node($$.AST_BlockStatement, this, {
				'body': commas.map(wrap_exp)
			});
		}
		return this;
	},
	function AST_UnaryPrefix(btf){
		var op = this.operator,
			ex = this.expression;
		switch(op){
			case '!':
				if(ex instanceof $$.AST_Number) {
					return make_node(!ex.value ? $$.AST_True : $$.AST_False, this);
				}
				break;
			case '~':
				if(ex instanceof $$.AST_UnaryPrefix && ex.operator == '~'){
					return make_node($$.AST_Binary, this, {
						'left': make_node($$.AST_Number, this, {'value': 0}),
						'operator': '|',
						'right': ex.expression
					});
				}
				break;
		}
		return this;
	}
].map(function(f){
	return [$$[f.name], function(btf){
		if('@beautified' in this) return this;
		var beautified = f.call(this, btf);
		beautified['@beautified'] = true;
		if(beautified === this) return beautified;
		return beautified.transform(btf);
	}];
}));

module.exports = Beautifier;
