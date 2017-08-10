<?php
/*
  Plugin Name: Advanced Custom Fields: Video Gallery
  Description: The video gallery ACF field provides a simple and intuitive interface for managing a collection of videos from Youtube and Vimeo.
  Version: 1.0
  Author: Zaki
  Author URI: http://www.zaki.it
  License: GPLv2 or later
  License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */

if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'acf_plugin_videogallery' ) ) :

    class acf_plugin_videogallery {

        public function __construct() {

            $this->settings = array(
                'version' => '1.0',
                'url' => plugin_dir_url( __FILE__ ),
                'path' => plugin_dir_path( __FILE__ )
            );

            load_plugin_textdomain( 'acf-videogallery', false, plugin_basename( dirname( __FILE__ ) ) . '/lang' );

            add_action( 'acf/include_field_types', array( $this, 'include_field_types' ) );
        }

        public function include_field_types( $version = false ) {
            include_once 'field/class-acf-field-videogallery.php';
        }

    }

    new acf_plugin_videogallery();

endif;