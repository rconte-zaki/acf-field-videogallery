<?php

if( !defined( 'ABSPATH' ) ) exit;

// check if class already exists
if( !class_exists( 'acf_field_videogallery' ) ) :

    class acf_field_videogallery extends acf_field {
    
        public function __construct( $settings ) {

            $this->name = 'videogallery';
            $this->label = __('Video Gallery', 'acf-videogallery');
            $this->category = 'content';
            $this->defaults = array(
                'google_key' => ''
            );
            $this->l10n = array(
                'insert' => __('Insert a video url', 'acf-videogallery'),
                'error' => __('Insert a url', 'acf-videogallery'),
                'exist' => __('Video already in list', 'acf-videogallery'),
                'edit' => __('Edit video', 'acf-videogallery'),
                'update' => __('Update video', 'acf-videogallery'),
            );
            $this->settings = $settings;
            
            // actions
            add_action( 'wp_ajax_acf/fields/videogallery/get_video_info', array( $this, 'ajax_get_video_info' ) );
            add_action( 'wp_ajax_nopriv_acf/fields/videogallery/get_video_info', array( $this, 'ajax_get_video_info' ) );
            add_action( 'wp_ajax_acf/fields/videogallery/get_video_sidebar', array( $this, 'get_video_sidebar' ) );
            add_action( 'wp_ajax_nopriv_acf/fields/videogallery/get_video_sidebar', array( $this, 'get_video_sidebar' ) );

            parent::__construct();
        }
        	
	function render_field_settings( $field ) {
				
            acf_render_field_setting( $field, array(
                'label' => __('Google API Key','acf-videogallery'),
                'instructions' => __('Google API Key for Youtube','acf-videogallery'),
                'type' => 'text',
                'name' => 'google_key',
            ));

	}
        
        private function get_video_info( $url, $settings ) {
            
            if ( $url == '' )
                return array( 0, __('No url provided', 'acf-videogallery') );
            
            $videoInfoArray = array();
            $url_isold = explode( '/watch?v=', $url );
            
            if ( isset( $url_isold[1] ) ) {
                // YOUTUBE VECCHIO
                $codice = array('Y', $url_isold[1]);
            } else {
                $url_isnew = explode( '.be/', $url );
                if ( isset( $url_isnew[1] ) ) {
                    // YOUTUBE NEW
                    $codice = array('Y', $url_isnew[1]);
                } else {
                    // VIMEO
                    $url_vimeo = explode( 'vimeo.com/', $url );
                    $codice = array('V', $url_vimeo[1]);
                }
            }

            switch ( $codice[0] ) {
                case 'Y':
                    if( ! isset( $settings['google_key'] ) or $settings['google_key'] == '' ) :
                        return array( 0, __('Google API key not valid', 'acf-videogallery' ) );
                    endif;
                    $remote_get = wp_remote_get( sprintf( 
                        'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=%s&key=%s',
                        $codice[1],
                        $settings['google_key']
                    ));
                    if( ! is_wp_error( $remote_get ) ) :
                        $arrayDec = json_decode( $remote_get['body'], true );
                        if( ! isset( $arrayDec['error'] ) ) :
                            $videoInfoArray['url'] = 'https://www.youtube.com/watch?v='.$arrayDec['items'][0]['id'];
                            $videoInfoArray['title'] = $arrayDec['items'][0]['snippet']['title'];
                            $videoInfoArray['image'] = $arrayDec['items'][0]['snippet']['thumbnails']['medium']['url'];
                            $videoInfoArray['code'] = $codice[1];
                        else:
                            return array( 0, $arrayDec['error']['errors'][0]['message'] . ': ' . $arrayDec['error']['errors'][0]['reason'] );
                        endif;
                    else :
                        return array( 0, $remote_get->get_error_message() );
                    endif;
                    break;
                case 'V':
                    $remote_get = wp_remote_get( 'https://vimeo.com/api/v2/video/' . $codice[1] . '.json' );
                    if( ! is_wp_error( $remote_get ) ) :
                        $arrayDec = json_decode( $remote_get['body'], true );
                        $videoInfoArray['url'] = 'https://player.vimeo.com/video/' . $arrayDec[0]['id'];
                        $videoInfoArray['title'] = $arrayDec[0]['title'];
                        $videoInfoArray['image'] = $arrayDec[0]['thumbnail_large'];
                        $videoInfoArray['code'] = $codice[1];
                    else :
                        return array( 0, $remote_get->get_error_message() );
                    endif;
                    break;
                default:
                    return array( 0, __('Url not recognized', 'acf-videogallery') );
            }

            return array( 1, $videoInfoArray );
        }
        
        private function get_videos( $json_videos ) {
            if( ! is_array( $json_videos) ) return false;
            $videos = array();
            foreach( $json_videos as $v ) :
                $videos[] = json_decode( $v );
            endforeach;
            return $videos;
        }
        
        public function render_field( $field ) {
            
            acf_enqueue_uploader();

            $atts = array(
                'id' => $field['id'],
                'class' => 'acf-videogallery',
                'style' => 'height:400px',
                'data-googlekey' => $field['google_key']
            );
            
            $videos = $this->get_videos( $field['value'] );
            ?>
            <div <?php acf_esc_attr_e($atts); ?>>
            	<div class="acf-hidden">
                    <?php acf_hidden_input( array( 'name' => $field['name'], 'value' => '' ) ); ?>
            	</div>
            	<div class="acf-videogallery-main">
                    <div class="acf-videogallery-videos">	
                        <?php if( $videos ) : ?>	
                            <?php foreach( $videos as $v ) : ?>
                                <div class="acf-videogallery-video acf-soh" data-code="<?php echo $v->code; ?>" data-url="<?php echo $v->url; ?>">
                                    <?php acf_hidden_input( array( 'name' => $field['name'] . '[]', 'value' => json_encode( $v ) ) ); ?>
                                    <div class="margin">
                                        <div class="thumbnail">
                                            <img src="<?php echo $v->image ?>" width="150" height="150" alt="<?php echo $v->title; ?>" />
                                        </div>
                                    </div>
                                    <div class="actions acf-soh-target">
                                        <a class="acf-icon -cancel dark acf-videogallery-remove" href="#" data-code="<?php echo $v->code; ?>" title="<?php _e('Remove', 'acf-videogallery'); ?>"></a>
                                    </div>
                                </div>			
                            <?php endforeach; ?>		
                        <?php endif; ?>		
                    </div>
                    <div class="acf-videogallery-toolbar">
                        <ul class="acf-hl">
                            <li>
                                <input type="text" name="videourl" value="" placeholder="<?php echo $this->l10n['insert'] ?>" class="acf-videogallery-url regular-text">
                            </li>
                            <li>
                                <a href="#" class="acf-button button button-primary acf-videogallery-add"><?php _e('Add video', 'acf-videogallery'); ?></a>
                            </li>
                        </ul>
                    </div>
            	</div>
            	<div class="acf-videogallery-side">
                    <div class="acf-videogallery-side-inner">	
            		<div class="acf-videogallery-side-data"><?php _e('Loading video', 'acf-videogallery'); ?></div>				
                        <div class="acf-videogallery-toolbar">
                            <ul class="acf-hl">
                                <li>
                                    <a href="#" class="acf-button button acf-videogallery-close"><?php _e('Close', 'acf-videogallery'); ?></a>
                                </li>
                            </ul>
                        </div>
                    </div>
            	</div>
            </div>
            <?php
        }

        function input_admin_enqueue_scripts() {

            // vars
            $url = $this->settings['url'];
            $version = $this->settings['version'];

            // register & include JS
            wp_register_script( 'acf-input-videogallery', "{$url}assets/js/main.js", array('acf-input'), $version );
            wp_enqueue_script('acf-input-videogallery');

            // register & include CSS
            wp_register_style( 'acf-input-videogallery', "{$url}assets/css/main.css", array('acf-input'), $version );
            wp_enqueue_style('acf-input-videogallery');

        }
        
        function ajax_get_video_info() {

            // options
            $options = acf_parse_args($_POST, array(
                'url' => '',
                'settings' => array(),
                'field_key' => '',
                'nonce' => '',
            ));
            
            if( ! wp_verify_nonce( $options['nonce'], 'acf_nonce' ) )
                wp_send_json_error();

            if( $options['url'] == '' or ! isset( $options['settings'] ) )
                wp_send_json_error();

            $video = $this->get_video_info( $options['url'], $options['settings'] );

            if( ! $video[0] )
                wp_send_json_error( $video[1] );

            // render
            wp_send_json_success( $video[1] );
        }
        
        function get_video_sidebar() {
            
            // options
            $options = acf_parse_args($_POST, array(
                'url' => '',
                'field_key' => '',
                'nonce' => '',
            ));

            if( ! wp_verify_nonce( $options['nonce'], 'acf_nonce' ) )
                die();

            if( $options['url'] == '' )
                die();
            
            echo wp_oembed_get( $options['url'], array( 'width' => 400 ) );            
           
            die();
            
        }

    }

    // initialize
    new acf_field_videogallery( $this->settings );


// class_exists check
endif;