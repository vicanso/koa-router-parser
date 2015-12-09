SRC = lib/*.js

TESTS = test/*.js

jshint:
	node ./node_modules/.bin/jshint \
		$(SRC)

cov:
	@NODE_ENV=test node \
		./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		$(TESTS) \
		--

test:
	make jshint && make cov


.PHONY: jshint cov test