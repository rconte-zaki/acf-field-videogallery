/**
 * Author: Zaki
 * Author URI: http://www.zaki.it
 */

(function ($) {

    acf.fields.videogallery = acf.field.extend({
        type: 'videogallery',
        $el: null,
        $main: null,
        $side: null,
        $videos: null,
        actions: {
            'ready': 'initialize',
            'append': 'initialize',
            'submit': 'close_sidebar',
            'show': 'resize'
        },
        events: {
            'click .acf-videogallery-video': '_select',
            'click .acf-videogallery-add': '_add',
            'click .acf-videogallery-remove': '_remove',
            'click .acf-videogallery-close': '_close'
        },
        /*
         *  focus
         *
         *  This function will setup variables when focused on a field
         *
         *  @type	function
         *  @date	12/04/2016
         *  @since	5.3.8
         *
         *  @param	n/a
         *  @return	n/a
         */
        focus: function () {

            // el
            this.$el = this.$field.find('.acf-videogallery:first');
            this.$main = this.$el.children('.acf-videogallery-main');
            this.$side = this.$el.children('.acf-videogallery-side');
            this.$videos = this.$main.children('.acf-videogallery-videos');

            // get options
            this.o = acf.get_data(this.$el);

            // min / max
            this.o.min = this.o.min || 0;
            this.o.max = this.o.max || 0;

        },
        /*
         *  initialize
         *
         *  This function will initialize the field
         *
         *  @type	function
         *  @date	12/04/2016
         *  @since	5.3.8
         *
         *  @param	n/a
         *  @return	n/a
         */
        initialize: function () {

            // reference
            var self = this;
            var $field = this.$field;

            // sortable
            this.$videos.unbind('sortable').sortable({
                items: '.acf-videogallery-video',
                forceHelperSize: true,
                forcePlaceholderSize: true,
                scroll: true,
                start: function (event, ui) {
                    ui.placeholder.html(ui.item.html());
                    ui.placeholder.removeAttr('style');
                    acf.do_action('sortstart', ui.item, ui.placeholder);
                },
                stop: function (event, ui) {
                    acf.do_action('sortstop', ui.item, ui.placeholder);
                }
            });

            // resizable
            this.$el.unbind('resizable').resizable({
                handles: 's',
                minHeight: 200,
                stop: function (event, ui) {
                    acf.update_user_setting('videogallery_height', ui.size.height);
                }
            });

            // resize
            $(window).on('resize', function () {
                self.set('$field', $field).resize();
            });

            // render
            this.render();

            // resize
            this.resize();

        },
        /*
         *  resize
         *
         *  This function will resize the columns
         *
         *  @type	function
         *  @date	20/04/2016
         *  @since	5.3.8
         *
         *  @param	$post_id (int)
         *  @return	$post_id (int)
         */
        resize: function () {

            // vars
            var min = 100,
                max = 175,
                columns = 4,
                width = this.$el.width();

            // get width
            for (var i = 4; i < 20; i++) {
                var w = width / i;
                if (min < w && w < max) {
                    columns = i;
                    break;
                }
            }

            // max columns css is 8
            columns = Math.min(columns, 8);

            // update data
            this.$el.attr('data-columns', columns);

        },
        render: function () {

            // vars
            var $a = this.$main.find('.acf-videogallery-add');

            // disable a
            if (this.o.max > 0 && this.count() >= this.o.max) {
                $a.addClass('disabled');
            } else {
                $a.removeClass('disabled');
            }

        },
        open_sidebar: function () {

            // add class
            this.$el.addClass('sidebar-open');

            // vars
            var width = this.$el.width() / 2;

            // set minimum width
            width = parseInt(width);
            width = Math.max(width, 350);

            // animate
            this.$side.children('.acf-videogallery-side-inner').css({'width': width - 1});
            this.$side.animate({'width': width - 1}, 250);
            this.$main.animate({'right': width}, 250);

        },
        /*
         *  _close
         *
         *  event listener
         *
         *  @type	function
         *  @date	12/04/2016
         *  @since	5.3.8
         *
         *  @param	e (event)
         *  @return	n/a
         */
        _close: function (e) {
            this.close_sidebar();
        },
        /*
         *  close_sidebar
         *
         *  This function will open the videogallery sidebar
         *
         *  @type	function
         *  @date	19/04/2016
         *  @since	5.3.8
         *
         *  @param	n/a
         *  @return	n/a
         */
        close_sidebar: function () {

            // remove class
            this.$el.removeClass('sidebar-open');

            // clear selection
            this.get_video('active').removeClass('active');

            // disable sidebar
            this.$side.find('input, textarea, select').attr('disabled', 'disabled');

            // animate
            this.$main.animate({right: 0}, 250);
            this.$side.animate({width: 0}, 250, function () {
                $(this).find('.acf-videogallery-side-data').html('');
            });

        },
        /*
         *  count
         *
         *  This function will return the number of attachemnts
         *
         *  @type	function
         *  @date	12/04/2016
         *  @since	5.3.8
         *
         *  @param	n/a
         *  @return	n/a
         */
        count: function () {
            return this.get_videos().length;
        },
        /*
         *  get_videos
         *
         *  description
         *
         *  @type	function
         *  @date	19/04/2016
         *  @since	5.3.8
         *
         *  @param	$post_id (int)
         *  @return	$post_id (int)
         */
        get_videos: function () {
            return this.$videos.children('.acf-videogallery-video');
        },
        /*
         *  get_video
         *
         *  This function will return an video
         *
         *  @type	function
         *  @date	19/04/2016
         *  @since	5.3.8
         *
         *  @param	id (string)
         *  @return	$el
         */
        get_video: function (s) {

            // defaults
            s = s || 0;

            // update selector
            if (s === 'active') {
                s = '.active';
            } else {
                s = '[data-code="' + s + '"]';
            }

            // return
            return this.$videos.children('.acf-videogallery-video' + s);

        },
        /*
         *  render_video
         *
         *  This functin will render an attachemnt
         *
         *  @type	function
         *  @date	20/04/2016
         *  @since	5.3.8
         *
         *  @param	$post_id (int)
         *  @return	$post_id (int)
         */
        render_video: function ( video ) {

            // vars
            var $video = this.get_video(video.code),
                $img = $video.find('img'),
                $input = $video.find('input[type="hidden"]');
        
            // update els
            $img.attr({
                'src': video.image,
                'alt': video.title,
                'style': 'width:150px;height:auto;'
            });

        },
        _add: function (e) {

            // reference
            var self = this,
                $field = this.$field,
                input = this.$field.find('.acf-videogallery-url');
            
            // validation
            if( input.val() === '' ) {
                acf.validation.add_warning( this.$field, acf._e('videogallery', 'error') );
                return;
            }
            
            // add
            self.add_video( input.val() );
            
            input.val('');
                    
        },
        /*
         *  add_video
         *
         *  This function will add an video
         *
         *  @type	function
         *  @date	20/04/2016
         *  @since	5.3.8
         *
         *  @param	$post_id (int)
         *  @return	$post_id (int)
         */
        add_video: function ( url ) {
            
            // validate
            if( url === '' )
                return;
            
            // vars
            var data = acf.prepare_for_ajax({
                action: 'acf/fields/videogallery/get_video_info',
                field_key: this.$field.data('key'),
                nonce: acf.get('nonce'),
                url: url,
                settings: {
                    google_key : this.$el.data('googlekey')
                }
            });

            // abort XHR if this field is already loading AJAX data
            if (this.$el.data('xhr')) {
                this.$el.data('xhr').abort();
            }

            // get results
            var xhr = $.ajax({
                url: acf.get('ajaxurl'),
                dataType: 'html',
                type: 'post',
                cache: false,
                data: data,
                context: this,
                success: function( request ){
                    
                    var result = JSON.parse( request );
                                                            
                    if( result.success === true ) {
                                        
                        var video = result.data;

                        // check if already exist
                        if( this.get_video( video.code ).length > 0 ) {
                            acf.validation.add_warning( this.$field, acf._e('videogallery', 'exist') );
                            return;
                        }

                        // vars
                        var name = this.$el.find('input[type="hidden"]:first').attr('name');
                        // html
                        var html = [
                            '<div class="acf-videogallery-video acf-soh" data-code="' + video.code + '" data-url="' + video.url + '">',
                                '<input type="hidden" value=\'' + JSON.stringify(video) + '\' name="' + name + '[]">',
                                '<div class="margin">',
                                    '<div class="thumbnail">',
                                        '<img src="" alt="">',
                                    '</div>',
                                '</div>',
                                '<div class="actions acf-soh-target">',
                                    '<a href="#" class="acf-icon -cancel dark acf-videogallery-remove" data-code="' + video.code + '"></a>',
                                '</div>',
                            '</div>'].join('');

                        var $html = $(html);

                        // append
                        this.$videos.append($html);

                        // render data
                        this.render_video( video );

                        // render
                        this.render();
                    
                    } else {
                        
                        acf.validation.add_warning( this.$field, result.data );
                        return;
                        
                    }
                    
                }
            });
            
            // update el data
            this.$el.data('xhr', xhr);

        },
        _select: function (e) {

            // vars
            var code = e.$el.data('code');

            // select
            this.select_video(code);

        },
        select_video: function (code) {

            // vars
            var $video = this.get_video(code);

            // bail early if already active
            if ($video.hasClass('active'))
                return;

            // clear selection
            this.get_video('active').removeClass('active');

            // add selection
            $video.addClass('active');

            // fetch
            this.fetch($video);

            // open sidebar
            this.open_sidebar();
        },
        fetch: function ($video) {

            // vars
            var data = acf.prepare_for_ajax({
                action: 'acf/fields/videogallery/get_video_sidebar',
                field_key: this.$field.data('key'),
                nonce: acf.get('nonce'),
                url: $video.data('url')
            });

            // abort XHR if this field is already loading AJAX data
            if (this.$el.data('xhr')) {
                this.$el.data('xhr').abort();
            }

            // get results
            var xhr = $.ajax({
                url: acf.get('ajaxurl'),
                dataType: 'html',
                type: 'post',
                cache: false,
                data: data,
                context: this,
                success: this.fetch_success
            });

            // update el data
            this.$el.data('xhr', xhr);

        },
        fetch_success: function (html) {

            // bail early if no html
            if (!html)
                return;

            // vars
            var $side = this.$side.find('.acf-videogallery-side-data');

            // render
            $side.html(html);

            // remove acf form data
            $side.find('.compat-field-acf-form-data').remove();

            // detach meta tr
            var $tr = $side.find('> .compat-video-fields > tbody > tr').detach();

            // add tr
            $side.find('> table.form-table > tbody').append($tr);

            // remove origional meta table
            $side.find('> .compat-video-fields').remove();

            // setup fields
            acf.do_action('append', $side);

        },
        _remove: function (e) {

            // prevent event from triggering click on video
            e.stopPropagation();

            // vars
            var code = e.$el.data('code');
            
            // select
            this.remove_video(code);

        },
        remove_video: function (code) {

            // close sidebar (if open)
            this.close_sidebar();

            // remove video
            this.get_video(code).remove();

            // render (update classes)
            this.render();

        },
        render_collection: function (frame) {

            var self = this;

            // Note: Need to find a differen 'on' event. Now that videos load custom fields, this function can't rely on a timeout. Instead, hook into a render function foreach item

            // set timeout for 0, then it will always run last after the add event
            setTimeout(function () {

                // vars
                var $content = frame.content.get().$el
                collection = frame.content.get().collection || null;

                if (collection) {

                    var i = -1;

                    collection.each(function (item) {

                        i++;

                        var $li = $content.find('.videos > .video:eq(' + i + ')');

                        // if image is already inside the videogallery, disable it!
                        if (self.get_video(item.id).exists()) {

                            item.off('selection:single');
                            $li.addClass('acf-selected');

                        }

                    });

                }

            }, 10);

        }

    });

})(jQuery);