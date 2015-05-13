all: main_out.js

clean:
	/bin/rm main_out.min.js main_out.js

main_out.js: main_out.min.js main_out.dict
	./bin/unobfuscate.js main_out.min.js main_out.dict main_out.js

main_out.min.js:
	wget "http://agar.io/main_out.js" -O main_out.min.js
	touch -c main_out.min.js
