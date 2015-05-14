all: main_out_patched.js

clean:
	/bin/rm -f main_out.min.js main_out.js main_out_patched.js

main_out_patched.js: main_out.js
	cp main_out.js main_out_patched.js

main_out.js: main_out.min.js data/main_out.dict
	./bin/unobfuscate.js main_out.min.js data/main_out.dict main_out.js

main_out.min.js:
	wget "http://agar.io/main_out.js" -O main_out.min.js
	touch -c main_out.min.js
