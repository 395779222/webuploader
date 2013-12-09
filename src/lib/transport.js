/**
 * @fileOverview Transport
 */
define([
    '../base',
    '../runtime/client',
    '../core/mediator'
], function( Base, RuntimeClient, Mediator ) {

    var $ = Base.$;

    function Transport( opts ) {
        var me = this;

        this.options = $.extend( true, {}, Transport.options, opts || {} );
        RuntimeClient.call( this, 'Transport' );

        this._blob = null;
        this._formData = opts.formData || {};
        this._headers = opts.headers || {};

        this.on( 'progress', this._timeout );
        this.on( 'load error', function() {
            clearTimeout( me._timer );
        });
    }

    Transport.options = {
        server: '',
        method: 'POST',

        // 跨域时，是否允许携带cookie, 只有html5 runtime才有效
        withCredentials: false,
        fileVar: 'file',
        timeout: 2 * 60 * 1000,    // 2分钟
        formData: {},
        headers: {},
        sendAsBinary: false
    };

    $.extend( Transport.prototype, {

        // 添加Blob, 只能添加一次，最后一次有效。
        appendBlob: function( key, blob, filename ) {
            var me = this,
                opts = me.options;

            if ( me.getRuid() ) {
                me.disconnectRuntime();
            }

            // 连接到blob归属的同一个runtime.
            me.connectRuntime( blob.ruid, function() {
                me.exec('init');
            });

            me._blob = blob;
            opts.fileVar = key || opts.fileVar;
            opts.filename = filename;
        },

        // 添加其他字段
        append: function( key, value ) {
            if ( typeof key === 'object' ) {
                $.extend( this._formData, key );
            } else {
                this._formData[ key ] = value;
            }
        },

        setRequestHeader: function( key, value ) {
            if ( typeof key === 'object' ) {
                $.extend( this._headers, key );
            } else {
                this._headers[ key ] = value;
            }
        },

        send: function( method ) {
            this.exec( 'send', method );
            this._timeout();
        },

        abort: function() {
            return this.exec('abort');
        },

        destroy: function() {
            this.trigger('destroy');
            this.off();
            this.exec('destroy');
            this.disconnectRuntime();
        },

        getResponse: function() {
            return this.exec('getResponse');
        },

        getResponseAsJson: function() {
            return this.exec('getResponseAsJson');
        },

        getResponseHeader: function() {
            return this.exec('getResponseHeader');
        },

        _timeout: function() {
            var me = this,
                duration = me.options.timeout;

            if ( !duration ) {
                return;
            }

            clearTimeout( me._timer );
            me._timer = setTimeout(function() {
                me.abort();
                me.trigger( 'error', 'timeout' );
            }, duration );
        }

    });

    Mediator.installTo( Transport.prototype );

    return Transport;
});