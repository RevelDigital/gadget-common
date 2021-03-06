/*jshint node:true, unused:true */
/*!
 * Iadea Rest API
 * Copyright(c) 2017 Alexander Pivovarov
 * pivovarov@gmail.com
 * MIT Licensed
 */

/**
 * Json structure with file information.
 * @typedef {{fileSize: Number, id: String,
 *  etag: String,
 *  downloadPath: String,
 *  createdDate: String,
 *  transferredSize: Number,
 *  modifiedDate: String,
 *  mimeType: String,
 *  completed: Boolean }} IadeaFile
 *
 */

/**
 * Json structure with user settings information
 * @typedef {{userPref : [{name: String, value: String}]}} IdeaUserPref
 *
 */


/**
 * Module dependencies.
 * @private
 */

var http = require('http');
var Q = require('q');
var fs = require('fs');

/**
* Buffer size (maximum 40*1024, if upload fails try to set smaller buffer size)
* @public
*/
var BUFFER_SIZE = 8*1024;
var IADEA_TIMEOUT = 5000;

/**
 * Create new IadeaDevice 
 * @param {String} host
 * @param {Number} port (optional)
 * @param {String} user (optional)
 * @param {String} pass (optional)
 * 
 * @return {IadeaDevice}
 */
function createDevice(host, port, user, pass) {
    return new IadeaDevice(host, port, user, pass);
}

/**
 * Class IadeaDevice
 * @param {String} host
 * @param {Number} port (optional)
 * @param {String} user (optional)
 * @param {String} pass (optional)
 */
function IadeaDevice(host, port, user, pass) {
    this._access_token = null;   
    this._iadea_host = host;
    this._iadea_port = port || 8080;
    this._iadea_user = user || 'admin';
    this._iadea_pass = pass || '';
    
    var that = this;

    /**
     * Connect to device
     * @public
     * @promise {String} access token
     *
     */
    IadeaDevice.prototype.connect = function() {
        var data = {
            grant_type: 'password',
            username: that._iadea_user,
            password: that._iadea_pass};


        return call('/v2/oauth2/token', data)
            .then(function (res){
                if (res.error) {
                    throw new Error(res.error);
                }

                that._access_token = res.access_token;
                return that._access_token;
            });
    };

    /**
     * Connect to device and check if device is online
     * @public
     * @promise {Boolean} true is online
     *
     */
    IadeaDevice.prototype.checkOnline = function() {
        function _onOk(data) {
            return (data && (data !== '')); // Maybe just return true?
        }
        
        // eslint-disable-next-line no-unused-vars
        function _onError(err) {
            return false;
        }
        
        return that.connect()
            .then(_onOk)
            .fail(_onError);
    };
    
    
    /**
     * Upload a file to device
     * @public
     * @param {String} filename full path to file to upload
     * @param {String} downloadPath where to upload file, e.g. '/user-data/media/test.jpg'. Should begin with /user-data/
     *
     * @promise {IadeaFile}
     * @notify {{size: Number, done: Number, percent: Number}}, size - total file size, done - uploaded so far
     *
     * TODO: it is necessary to check that downloadPath contains only ASCII symbols
     */
    IadeaDevice.prototype.uploadFile = function (filename, downloadPath) {
        var deferred = Q.defer();
        var mimeType = '';
        var modified = '';
        var fileSize = 0;

        var extension = filename.split('.').pop();
        switch (extension) {
            case 'jpg' :
            case 'jpeg':
                mimeType = 'image/jpeg';
                break;
            case 'png' :
                mimeType = 'image/png';
                break;
            case 'mp4':
                mimeType = 'video/mp4';
                break;
            case 'mpe':
            case 'mpeg':
            case 'mpg':
                mimeType = 'video/mpeg';
                break;
            case 'avi':
                mimeType = 'video/x-msvideo';
                break;
            case 'wmv':
                mimeType = 'video/x-ms-wmv';
                break;
            case 'divx':
                mimeType = 'video/x-divx';
                break;
            case 'mov':
                mimeType = 'video/quicktime';
                break;
            case 'smil':
            case 'smi':
                mimeType = 'application/smil';
                break;
            case 'txt':
                mimeType = 'text/plain';
                break;
            case 'mp3':
                mimeType = 'audio/mpeg';
                break;
            case 'apk':
                mimeType = 'application/vnd.android.package-archive';
                break;
            default:
                throw new Error('Unknown mimeType = ' + extension);
        }

        try {
            var stats = fs.statSync(filename);
            fileSize = stats.size;
            modified = (stats.mtime).toISOString();
        } catch (err) {
            // file not found or other file access error
            deferred.reject(err);
            return deferred.promise;
        }

        var options = {
            host: that._iadea_host,
            port: that._iadea_port,
            path: '/v2/files/new?access_token=' + that._access_token,
            method: 'POST'};

        var req = http.request(options, function(response) {
            var data = '';
            response.on('data', function (chunk) {
                data += chunk;
            });

            response.on('end', function () {
                deferred.resolve(data);
            });
        });

        var boundaryKey = Math.random().toString(16); // random string
        req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');

        var formStart =
            '--' + boundaryKey + '\r\n'
            + 'Content-Disposition: form-data; name="downloadPath"\r\n\r\n'
            + downloadPath + '\r\n'
            + '--' + boundaryKey + '\r\n'
            + 'Content-Disposition: form-data; name="fileSize"\r\n\r\n'
            + fileSize + '\r\n'
            +  '--' + boundaryKey + '\r\n'
            + 'Content-Disposition: form-data; name="mimeType"\r\n\r\n'
            + mimeType + '\r\n'
            +  '--' + boundaryKey + '\r\n'
            + 'Content-Disposition: form-data; name="modifiedDate"\r\n\r\n'
            + modified + '\r\n'
            +  '--' + boundaryKey + '\r\n'
            + 'Content-Disposition: form-data; name="data"; filename=""\r\n'
            +' Content-Type: application/octet-stream\r\n\r\n';

        var formEnd = '\r\n--' + boundaryKey + '--';

        var contentLength = byteLength(formStart) + byteLength(formEnd) + fileSize;
        req.setHeader('Content-Length', contentLength);

        req.write(formStart);

        var writtenCount = 0;
        fs.createReadStream(filename, { bufferSize: BUFFER_SIZE })
            .on('data', function(data){
                // notify about progress
                writtenCount += data.length;
                deferred.notify({size: fileSize, done: writtenCount, percent: writtenCount/fileSize});
            })
            .on('end', function() {
                req.end(formEnd);
            })
            .pipe(req, { end: false })
            .on('error', function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    /**
     * Get list of files or list of files matching filter criteria
     * @public
     * @param {String} filter
     * @param {String} filter_type - 'mimeType', 'completed', 'downloadPath' (default)
     *
     * @promise {{items:[{IadeaFile}]}} Json structure where items points to array of matching files
     */
    IadeaDevice.prototype.getFileList = function(filter, filter_type) {
        var deferred = Q.defer();


        function FilterFiles(data) {
            var files = data.items;
            var found = [];

            for (var i = 0; i < files.length; i++) {
                var match = false;

                switch (filter_type) {
                    case 'completed':
                        match = (files[i].completed === filter);

                        break;
                    case 'mimeType':
                        match = files[i].mimeType.includes(filter);
                        break;
                    default:
                        match = files[i].downloadPath.includes(filter);
                }


                if (match)
                    found.push(files[i]);
            }
            deferred.resolve({items: found});
            return deferred.promise;
        }

        if ((typeof(filter) === 'undefined') || (filter === null))
            return call('/v2/files/find', {});

        return that.getFileList().then(FilterFiles);
    };



    /**
     * Get file by ID
     * @public
     * @param {string} id file id
     *
     * @promise {IadeaFile}
     */
    IadeaDevice.prototype.getFile = function(id) {
        return call('/v2/files/' + id);
    };

    /**
     * Find (first) file by name
     * @public
     * @param {string} name name of file to find
     *
     * @promise {IadeaFile}
     */
    IadeaDevice.prototype.findFileByName = function (name) {
        return that.getFileList().
            then(function(data){
                var files = data.items;
                var count = files ? files.length : 0;
                for (var i = 0; i < count; i ++) {
                    if (files[i].downloadPath.includes(name)) {
                        return that.getFile(files[i].id);
                    }
                }

                throw new Error('File not found - ' + name);

            });
    };

    /**
     * Reboot player.
     * @public
     * @promise {Error}. Note: connection will be terminated and promise rejected is call. Promise resolved is never called in this case.
     */
    IadeaDevice.prototype.reboot = function() {
        return call('/v2/task/reboot');
    };

    /**
     * Play content once (could be media file or SMIL)
     * @public
     * @param {String | IadeaFile} file location of content or IadeaFile returned by GetFile or GetFileByName
     *                             or external file if parameter starts with 'http'
     *
     * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
     */
    IadeaDevice.prototype.playFile = function (file) {
        var downloadPath = file.downloadPath;
        if (typeof(file) === 'string') downloadPath = file;

        var uri = 'http://localhost:8080/v2'  + downloadPath;
        if (downloadPath.includes('http')) uri = downloadPath;

        var play_command = {
            uri: uri,
            className: 'com.iadea.player.SmilActivity',
            packageName: 'com.iadea.player',
            action: 'android.intent.action.VIEW'
        };

        return call('/v2/app/exec', play_command);
    };

    /**
     * Set default content to play each time player boots up
     * @public
     * @param {String} downloadPath location of content - local file or external file if parameter starts with 'http'
     * @param {Boolean} fallback optional parameter if true set safe-url instead
     *
     * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
     */
    IadeaDevice.prototype.setStart = function(downloadPath, fallback) {
        var options = downloadPath;

        if (typeof options !== 'object') {
            var uri = 'http://localhost:8080/v2'  + downloadPath;
            if (downloadPath.includes('http')) uri = downloadPath;
            
            options = {
                uri: uri,
                className: 'com.iadea.player.SmilActivity',
                packageName: 'com.iadea.player',
                action: 'android.intent.action.VIEW'
            };            
        }

        var command = '/v2/app/start';
        if (fallback) command = '/v2/app/fallback';

        return call(command, options);
    };
    
    
    
    
    
    
    
    
    

    /**
     * Get storage information
     * @public
     *
     * @promise {[ {id: {Number},
     *              freeSpace: {Number},
     *              capacity :{Number},
     *              mediaType: {String},
     *             storageType: {String}]}
     */
    IadeaDevice.prototype.storageInfo = function () {
        var command = '/v2/system/storageInfo';

        return call(command);
    };

    /**
     * Trigger network event in SMIL (XMP-6200 and higher)
     * @public
     * @param {String} event - name of smil event
     * @promise
     */
    IadeaDevice.prototype.notify = function (event) {
        var command = '/v2/task/notify';
        var option = {};
        if (event)
            option.smilEvent = event;

        return call(command, option);
    };

    /**
     * Enable or disable auto start
     * TODO: check if disbale autostart is supported.
     * @public
     * @param {Boolean} enable - true if auto start is set to be enabled
     *
     * @promise {{settings: [ {name: {String}, value: {...} ]} - return the default value
     */
    IadeaDevice.prototype.enableAutoStart = function(enable) {
        // Query current configuration
        // Check if the setting exist
        // if exist run update, if not run add new

        var that = this;

        if (typeof (enable) === 'undefined') enable = false;

        var settingsPath = 'app.settings.com.iadea.console';

        return isSettingExist(settingsPath + '.disableAutoStart').then(function(exist) {
            if (exist)
                return updateSettings('disableAutoStart', enable);

            return newSettings('disableAutoStart', enable);

        });

        /**
         * Check if setting exist in com.iadea.console.xxxx section
         * @private
         * @param {String} name - setting to update
         *
         * @promise {Boolean}
         */
        function isSettingExist(name) {
            return that.exportConfiguration().then(function(data) {
                var deferred = Q.defer();
                var userPref = data.userPref;
                if (!userPref) {
                    deferred.reject(new Error('Error: userPref is not set'));
                    return deferred.promise;
                }

                var found = false;
                for (var i = 0; i < userPref.length; i++) {
                    if (userPref[i].name === name) {found = true; break;}
                }

                deferred.resolve(found);
                return deferred.promise;
            });
        }
    };



    /**
     * Add new setting under com.iadea.console.xxxx section
     * @private
     * @param {String} name - setting to add
     * @param value
     *
     * @promise {{settings: [ {name: {String}, value: {...} ]} - return the default value
     */
    var newSettings = function(name, value) {
        var options = {settings: [{name: name, value: value}]};
        var command = '/v2/app/settings/com.iadea.console/new';

        return call(command, options);
    };

    /**
     * Update setting value under com.iadea.console.xxxx section
     * @private
     * @param {String} name - setting to update
     * @param value
     *
     * @promise {{settings: [ {name: {String}, value: {...} ]} - return the default value 
    */
    var updateSettings = function(name, value) {
        var options = {settings: [{name: name, value: value}]};
        var command = '/v2/app/settings/com.iadea.console/update';

        return call(command, options);
    };


    /**
     * Switch to play default content (e.g. set by setStart function)
     * @public
     * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
     */
    IadeaDevice.prototype.switchToDefault = function () {
        return call('/v2/app/switch', {mode: 'start'});
    };

    /**
     * SwitchTo
     * @public
     * @param mode - 'home' - switch from app to home screen
     * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
     */
    IadeaDevice.prototype.switchTo = function (mode) {
        return call('/v2/app/switch', {mode: mode});
    };
    

    /**
     * Delete one or more files.
     * @public
     * @param {(string|string[]|Object|Object[])} files - file ID or array of files ID or file structure or array of structures
     *
     * @promise {{}|[{}..{}]} when promise fulfilled returns empty json object or array of empty json objects
     */
    IadeaDevice.prototype.deleteFiles = function (files) {
        // Delete a file by fileID or by file Object
        function _delete(data) {
            var id = data.id;                               // data can be IdeaFile structure (then get id from it)
            if (typeof(data) === 'string') id = data;       // or just ID of file to delete

            return call('/v2/files/delete', {id:id});
        }

        var f_arr = files.items; // is it object returned by getFileList?
        if (typeof(f_arr) === 'undefined') f_arr = files;

        if (f_arr instanceof Array) {                      //is it array of IDs/IdeaFiles or not array?
            return f_arr.reduce(function(promise, n) {     // process array sequentially using promises
                return promise.then(function() {
                    return _delete(n);
                });
            }, Q.resolve());
        } else {
            return _delete(f_arr);
        }
    };

    /**
     * Get screenshot (not implemented?). It's poorly described in REST API.
     * @public
     * @promise {}
     */
    IadeaDevice.prototype.getScreenshot = function() {
        return call('/v2/task/screenshot');
    };

    /**
     * Get the firmware information on device
     * @public
     * @promise {{firmwareVersion: String, family: String}}
     */
    IadeaDevice.prototype.getFirmwareInfo = function () {
        return call('/v2/system/firmwareInfo');
    };

    /**
     * Get player model name and other manufacture use only information
     * @public
     * @promise {{modelDescription: String, modelName: String, modelURL: String, manufacturer: String, licenseModel: String,
     *  PCBRevision: String, manufacturerURL: String, PCB: Sring, options: [Sring] }}
     */
    IadeaDevice.prototype.getModelInfo = function () {
        return call('/v2/system/modelInfo');
    };

    /**
     * Checking WIFI status
     * @public
     * @promise {Boolean}
     */
    IadeaDevice.prototype.isWifiEnabled = function () {
        return call('/v2/android.net.wifi.WifiManager/isWifiEnabled');
    };

    /**
     * Get configuration from player
     * @public
     * @promise {IdeaUserPref} return the player configuration
     */
    IadeaDevice.prototype.exportConfiguration = function () {
        return call('/v2/task/exportConfiguration');
    };

    /**
     * Update device password
     * @public
     * @param {String} pass - new password, null to reset default password
     * @promise {IdeaUserPref} return the player configuration
     */
    IadeaDevice.prototype.setPassword = function (pass) {
        return call('/v2/security/users/admin', {password: pass || 'pass'});
    };
    
    /**
     * Import new configuration to player
     * @public
     * @param {IdeaUserPref} config new configuration object ex.
     * @param {Boolean} runCommit if true commitConfiguration is called at the end
     *
     * @promise {{IdeaUserPref,    -- return newly imported configuration
     *  restartRequired: Boolean,  -- true/false , if restart is required for changes to take effect, restartRequired is true
     *  commitId: String }}        -- ID for commitConfiguration
     */
    IadeaDevice.prototype.importConfiguration = function (config, runCommit) {
        var cfg = config;
        if (cfg instanceof Array) {
            cfg = {userPref: cfg};
        } else if (typeof(cfg.userPref) === 'undefined') {
            cfg = {userPref: [config]};
        }

        if (!runCommit)
            return call('/v2/task/importConfiguration', cfg);


        return call('/v2/task/importConfiguration', cfg).then(commitConfiguration);
    };

    /**
     * Send request via /app/settings/com.iadea.console/new
     * @param config {JSON} - new setting object
     *     Example: {"settings": [ {"name": "autoTimeServer", "default": "ntp://host{:port}" } ] }
     * @promis - return the default value configured above    
     */
    IadeaDevice.prototype.settingsConsoleNew = function (config) {
        return call('/v2/app/settings/com.iadea.console/new', config);
    };

    /**
     * Send request via /app/settings/com.iadea.console/update
     * @param config {JSON} - setting object
     *     Example: {"settings": [ {"name": "autoTimeServer", "default": "ntp://host{:port}" } ] }
     * @promis - return the default value configured above
     */
    IadeaDevice.prototype.settingsConsoleUpdate = function (config) {
        return call('/v2/app/settings/com.iadea.console/update', config);
    };

    IadeaDevice.prototype.rawCall = function (command, data) {
        return call(command, data);
    };

    /**
     * Commit new configuration to playerr
     * @public
     * @param {String | Object} data Commit Id or Object returned by importConfiguration
     *
     * @promise {{ restartRequired: Boolean,    -- true/false , if restart is required for changes to take effect, restartRequired is true
     *  commitId: String }}                     -- ID for commitConfiguration
     */
    function commitConfiguration(data) {
        var commitId = data.commitId;

        if (typeof(data) === 'string')
            commitId = data;

        return call('/v2/task/commitConfiguration', {commitId: commitId});

    }


    /**
     * Turn display on or off
     * @public
     * @param {Boolean} on - true if on
     *
     * @promise {{id: Number, power: Boolean}} id is always 0, power - last state of the screen (that was before switchDisplay is caleld)
     */
    IadeaDevice.prototype.switchDisplay = function (on) {
        var power = 'standby';
        if (on) power = 'on';

        var command = {id: 0, power: power};

        return call('/v2/hardware/display', command);
    };

    /**
     * Set color of ligth bars for Iadea XDS-1078
     * if called with 1 parameter then color_or_red is a color specified as a string
     * Format: '#RRGGBB'. Example: '#00FF00' - green color
     *
     * if called with 3 parameters: color_or_red is a red color
     *
     *
     *
     * @public
     * @param {String|Number} color_or_red - color string or red part of RGB color set
     * @param {Number} [green] - green part of RGB color set
     * @param {Number} [blue] - blue part of RGB color set
     */
    IadeaDevice.prototype.setColor = function (color_or_red, green, blue) {

        var color = color_or_red;

        if (arguments.length === 3) {
            color = '#' +
                ('00' + color_or_red.toString(16)).substr(-2) +
                ('00' + green.toString(16)).substr(-2) +
                ('00' + blue.toString(16)).substr(-2);
        }

        return call('/v2/hardware/light', {name: 'frame', brightness: 1, color: color});

    };

    /**
     * Perform call to Iadea REST API
     * @private
     * @param {String} uri REST API command
     * @param {Object} data - parameters
     * @param {String} contentType - optional. default ('application/json')
     *
     * @promise {Json} when promise fulfilled returns json object with output data
     */
    var call = function(uri, data, contentType) {
        var deferred = Q.defer();

        if ((!that._access_token) && (uri !== '/v2/oauth2/token')) {
            var err = new Error('Error. Access token is required.');
            deferred.reject(err);
            return deferred.promise;
        }

        var options = {
            host: that._iadea_host,
            port: that._iadea_port,
            path: uri,
            method: (data) ? 'POST': 'GET',
            headers: {'Content-Type': (contentType || 'application/json')}
        };

        if (that._access_token) options.path += '?access_token=' + that._access_token;

        var req = http.request(options, function(response) {
            var type = response.headers['content-type'];

            // response.setTimeout(IADEA_TIMEOUT);

            if (type && type.match(/image/))
                response.setEncoding('binary');


            var res_data = '';
            response.on('data', function (chunk) {
                res_data += chunk;
            });

            response.on('end', function () {
                try {
                    res_data = JSON.parse(res_data);
                    //  deferred.resolve(data);
                } catch(err) {
                    // deferred.reject(new Error("Error. JSON is expected as output."))
                }

                // if ip address is valid but it's not an iadea device, 404 error would be returned
                if (response.statusCode === 404)
                    deferred.reject(new Error('Error 404. /v2/ interface is not found'));
                else
                    deferred.resolve(res_data);

            });
            
        });

        req.on('error', function(err) {
            // If reboot is run. 'ECONNRESET' (scocket hang up) error is thrown.
            deferred.reject(err);
        });

        req.setTimeout(IADEA_TIMEOUT, function(){
            this.abort();
        }.bind(req));

        if (data) req.write(JSON.stringify(data));

        req.end();

        return deferred.promise;
    };

}

/**
 * Returns the byte length of an utf8 string
 * @private
 * @param str {String} 
 * @returns {Number} 
 */
function byteLength(str) {
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s+=2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

// Necessary to use in IridiumMobile
if (typeof IR === 'object') {
    var exports = {};
}

exports.BUFFER_SIZE = BUFFER_SIZE;
exports.IADEA_TIMEOUT = IADEA_TIMEOUT;
exports.createDevice = createDevice;

// Necessary to use in IridiumMobile
if ((typeof IR === 'object') && (typeof module === 'object')) {
    module['iadea-rest'] = exports;
    exports = null;
}