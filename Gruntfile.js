// TODO urn docco on watch
module.exports = function(grunt) {
	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
					clearRequireCache: true,
				},
				src: ['tests/**/*.js']
			}
		},
		docco: {
			doc: {
				src: ['lib/**/*.js'],
				options: {
					output: 'docs/'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-docco');
 
	grunt.registerTask('default', ['docco', 'mochaTest']);
};