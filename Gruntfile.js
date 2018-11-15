module.exports = function (grunt) {

    grunt.initConfig({
        responsive_images: {
            dev: {

                options: {
                    sizes: [
                        { width: 260, name: 'small' },//for large screen grid thumbs
                        { width: 420, name: 'medium' },//for mobile thumbs
                        { width: 800, name: 'large' },//for large-screen inside features
                    ],

                    quality: 50,
                },

                files: [
                    {
                        expand: true,
                        src: ['*.{gif,jpg,png}'],
                        cwd: 'img/',
                        dest: 'img/',
                    }
                ],
            }
        }
    });

    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.registerTask('default', ['responsive_images']);
};
